const Image = require('../../config/serialization/images.js')

const { issuer, panel } = require('../../.env')

/**
 *  @function
 *  @module Users
 *  @description Manage users, provide some middleware functions.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing some middleware functions for provide users management.
 */
module.exports = app => {
  const { User } = app.config.database.schemas.mongoose

  const { exists, validateEmail, validatePassword, validateLength } = app.config.validation

  const { encryptTag, encryptAuth, decryptAuth, encryptToken, decryptToken } = app.config.secrets

  const { sendEmail } = app.api.users.emails

  const { userError } = app.api.responses

  /**
   * @function
   * @description Gets some users
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} limit - Limit users per page
   * @middlewareParams {String} query - Keyword to search for users
   * @middlewareParams {Number} page - Current page
   * @middlewareParams {String} deleted - Sets only deleted users
   *
   * @returns {Object} A object containing count, limit and Themes Objects representations
   */
  const get = async (req, res) => {
    try {
      let limit = parseInt(req.query.limit) || 10
      const query = req.query.query || ''
      const page = req.query.page || 1
      const order = req.query.order || 'desc'

      const deleted = Boolean(req.query.deleted) || false

      if (limit > 100) limit = 10

      const count = await User.countDocuments({
        $and: [
          {
            $or: [
              { name: { $regex: `${query}`, $options: 'i' } },
              { email: { $regex: `${query}`, $options: 'i' } },
              { cellphone: { $regex: `${query}`, $options: 'i' } }
            ]
          },
          { deletedAt: deleted ? { $ne: null } : null }
        ]
      })

      const users = await User.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { name: { $regex: `${query}`, $options: 'i' } },
                  { email: { $regex: `${query}`, $options: 'i' } },
                  { cellphone: { $regex: `${query}`, $options: 'i' } }
                ]
              },
              { deletedAt: deleted ? { $ne: null } : null }
            ]
          }
        },
        {
          $project: {
            password: 0
          }
        },
        {
          $sort: {
            createdAt: order === 'asc' ? 1 : -1
          }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return res.json({ users, count, limit })
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get user by ID
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   *
   * @returns {Object} An User
   */
  const getOne = async (req, res) => {
    try {
      const _id = req.params.id
      const found = await User.findOne({ _id, deletedAt: null }, { password: 0 })
      const { user } = req.user

      // Only admin gets any user, not admin gets only himself data
      if (user._id !== _id && !user.tagAdmin) {
        throw {
          name: 'forbidden',
          description: 'Não permitido para acessar este recurso'
        }
      }

      if (!found) {
        throw {
          name: 'id',
          description: 'Usuário não encontrado'
        }
      }

      return res.json(found)
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Save an user
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A User Object representation
   *
   * @middlewareParams {String} id - The User identifier
   */
  const save = async (req, res) => {
    try {
      const user = req.body
      const _id = req.params.id
      const dispatchEmail = req.query.sm || 'no' // Available values: 'yes' and 'no' (default)

      exists(user.name, {
        name: 'name',
        description: 'É necessário informar um nome'
      })

      validateEmail(user.email, {
        name: 'email',
        description: 'E-mail inválido'
      })

      exists(user.gender, {
        name: 'gender',
        description: 'É necessário informar um genero'
      })

      // Verify the user type, available values: 'author' and 'admin'
      if (user.type !== 'admin' && user.type !== 'author') {
        throw {
          name: 'type',
          description: "Tipo de usuário inválido, escolha entre 'author' e 'admin'"
        }
      }

      if (user.cellphone && (user.cellphone.length < 10 || isNaN(user.cellphone))) {
        throw {
          name: 'cellphone',
          description: 'Número de telefone inválido'
        }
      }

      // Update an user
      if (_id) {
        exists(user.customUrl, {
          name: 'customUrl',
          description: 'Url personalizada inválida'
        })

        const found = await User.findOne({ _id, deletedAt: null })

        if (!found) {
          throw {
            name: 'id',
            description: 'Usuário não encontrado'
          }
        }

        const updatedUser = await formatUserToUpdate(user, found)

        await User.updateOne({ _id }, updatedUser)

        const userUpdated = await User.findOne({ _id }, { password: 0 })

        // Send email to the user that have changed account
        if (dispatchEmail === 'yes') {
          const purpose = found.email !== updatedUser.email ? 'advanced-change-account' : 'simple-change-account'
          const payload = {
            _id,
            admin: req.user.user,
            oldEmail: found.email
          }

          sendEmail(purpose, payload)
        }

        return res.json(userUpdated)
      } else {
        // Create an user
        validatePassword(user.password, 8, {
          name: 'password',
          description: 'Informe uma senha de pelo menos 8 caracteres'
        })

        const tag = encryptTag(user.email)
        const password = encryptAuth(user.password)

        const saveUser = new User({
          name: user.name,
          email: user.email,
          gender: user.gender,
          cellphone: user.cellphone,
          birthDate: user.birthDate,
          address: user.address,
          number: user.number,
          [user.type === 'admin' ? 'tagAdmin' : 'tagAuthor']: tag,
          [user.type !== 'admin' ? 'tagAdmin' : 'tagAuthor']: null,
          password,
          customUrl: tag
        })

        const newUser = await saveUser.save()

        // Send email to the user that have created account
        if (dispatchEmail === 'yes') {
          const purpose = 'account-created'
          const payload = {
            user: newUser
          }

          sendEmail(purpose, payload)
        }

        return res.status(201).send(newUser)
      }
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Resend the email for change email address of the user who requested it.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const resendEmail = async (req, res) => {
    try {
      const user = { ...req.body }
      const _id = req.params.id

      const find = await User.findOne({ _id, deletedAt: null }, { lastEmailTokenSendAt: 1 })

      if (!find) {
        throw {
          name: '_id',
          description: 'Usuário não encontrado'
        }
      }

      const token = JSON.parse(decryptToken(user.confirmEmailToken))

      // Validate the token issuer
      if (token.issuer !== issuer) {
        throw {
          name: 'issuer',
          description: 'Emissor inválido!'
        }
      }

      // Validate cooldown for resend multiple email sends
      const diff = Date.now() - Number(find.lastEmailTokenSendAt)

      // 3 minutes of interval
      if (diff < 1000 * 60 * 3) {
        throw {
          name: 'manyRequest',
          description:
            'Já foi enviado um e-mail a pouco tempo, espere um pouco até enviar outro novamente. Verifique sua caixa de spam.'
        }
      }

      // Generate a new confirm email token
      await User.updateOne({ _id }, { lastEmailTokenSendAt: Date.now() })

      // Send the email
      const purpose = 'request-change-email'
      const payload = {
        user
      }

      const result = await sendEmail(purpose, payload)

      if (!result.status) {
        throw {
          name: 'sendEmail',
          description: 'Ocorreu um erro ao enviar o e-mail, por favor reporte este problema'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Cancel the email change not confirmed in new user email address, invalidating the confirmEmailToken.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const cancelChangeEmail = async (req, res) => {
    try {
      const _id = req.params.id

      const user = await User.findOne({ _id, deletedAt: null }, { password: 0 })
      if (!user) {
        throw {
          name: '_id',
          description: 'Usuário não encontrado'
        }
      }

      const token = user.confirmEmailToken

      if (!token) {
        throw {
          name: 'token',
          description: 'Não existe pendência de troca de e-mail'
        }
      }

      const payload = JSON.parse(decryptToken(token))

      // Validate the token issuer
      if (payload.issuer !== issuer || payload.oldEmail !== user.email || payload.newEmail !== user.confirmEmail) {
        throw {
          name: 'token',
          description: 'Token inválido'
        }
      }

      await User.updateOne({ _id, deletedAt: null }, { confirmEmail: null, confirmEmailToken: null })

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   * @middlewareParams {Object} User - The User Object representation
   */
  const saveByMySelf = async (req, res) => {
    try {
      const user = { ...req.body }
      const _id = req.params.id

      const userRequest = req.user.user

      if (userRequest._id !== _id) {
        throw {
          name: 'forbidden',
          description: 'Não permitido para acessar este recurso'
        }
      }

      exists(user.name, {
        name: 'name',
        description: 'Nome inválido'
      })

      exists(user.email, {
        name: 'email',
        description: 'E-mail inválido'
      })

      exists(user.gender, {
        name: 'gender',
        description: 'Gênero inválido'
      })

      exists(user.customUrl, {
        name: 'customUrl',
        description: 'Url personalizada inválida'
      })

      if (user.cellphone && (user.cellphone.length < 10 || isNaN(user.cellphone))) {
        throw {
          name: 'cellphone',
          description: 'Número de celular inválido'
        }
      }

      const found = await User.findOne({ _id, deletedAt: null }, { password: 0 })

      if (found.email !== user.email) {
        const emailAlreadyExists = await User.findOne({ email: user.email }, { email: 1 })

        if (emailAlreadyExists) {
          throw {
            name: 'email',
            description: 'Este endereço de e-mail já está cadastrado'
          }
        }

        user.confirmEmail = user.email
        user.email = found.email

        const payload = {
          issuer,
          _id,
          createdAt: Date.now(),
          expireAt: Date.now() + 1000 * 60 * 60 * 24 * 2,
          oldEmail: user.email,
          newEmail: user.confirmEmail
        }

        const token = await encryptToken(JSON.stringify(payload))

        user.confirmEmailToken = token
        user.lastEmailTokenSendAt = Date.now()
      }

      await User.updateOne({ _id, deletedAt: null }, user)

      // If the user changed their own email
      if (user.confirmEmail) {
        // Send the email containing a token for confirm a new email address
        const purpose = 'request-change-email'
        const payload = { user }

        sendEmail(purpose, payload)
      }

      const updatedUser = await User.findOne({ _id, deletedAt: null }, { password: 0 })

      return res.json(updatedUser)
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Change current tag if level access is changed
   * @private
   *
   * @param {Object} userToUpdate - User data to be updated
   * @param {Object} userInDatabase - Current User data
   * @returns {Object} A User Object representation
   */
  const formatUserToUpdate = async (userToUpdate, userInDatabase) => {
    if (userInDatabase.tagAdmin && userToUpdate.type !== 'admin') {
      userToUpdate.tagAdmin = null
      userToUpdate.tagAuthor = encryptTag(userToUpdate._id)
    }

    if (userInDatabase.tagAuthor && userToUpdate.type === 'admin') {
      userToUpdate.tagAdmin = encryptTag(userToUpdate._id)
      userToUpdate.tagAuthor = null
    }

    return userToUpdate
  }

  /**
   * @function
   * @description Remove/Delete an user
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const remove = async (req, res) => {
    try {
      const _id = req.params.id
      const { user } = req.user

      const idIsValid = app.mongo.Types.ObjectId.isValid(_id)

      if (!idIsValid) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      // If method is equal to 'PUT', the user has requested to remove own account
      if (req.method === 'PUT') {
        if (!user.tagAdmin && user._id !== _id) {
          throw {
            name: 'forbidden',
            description: 'Acesso negado, somente administradores podem remover outros usuários'
          }
        }

        exists(req.body.password, {
          name: 'password',
          description: 'Senha não informada'
        })

        const password = await encryptAuth(req.body.password)

        const found = await User.findOne({ _id }, { _id, password })

        if (!found) {
          throw {
            name: '_id',
            description: 'Usuário não encontrado'
          }
        }

        if (password !== found.password) {
          throw {
            name: 'password',
            description: 'Senha não confere, esqueceu sua senha?'
          }
        }
      }

      const today = new Date()
      const result = await User.updateOne({ _id, deletedAt: null }, { deletedAt: today })

      if (!result.nModified) {
        throw {
          name: '_id',
          description: 'Este usuário já foi removido'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove a user permanently
   * @param {String} _id The user identifier
   *
   * @returns {Promise}
   */
  const deleteUser = async _id => {
    try {
      const result = await User.deleteOne({ _id })
      Promise.resolve(result)

      return result
    } catch (error) {
      Promise.reject(error)
    }
  }

  /**
   * @function
   * @description Remove/Delete an User permanently.
   * This middleware is not accessible for production releases, use only for development.
   * To use, add a new route and point to this middleware.
   *
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const removePermanently = async (req, res) => {
    try {
      const _id = req.params.id

      const user = await User.findOne({ _id })

      if (!user) {
        throw {
          name: '_id',
          description: 'Usuário não encontrado'
        }
      }

      const result = await deleteUser(_id)

      if (result.deletedCount) {
        const payload = {
          status: true,
          data: [
            {
              _id: user.id,
              name: user.name,
              cellphone: user.cellphone,
              password: user.password,
              deleted_at: new Date()
            }
          ]
        }

        // Write removed users in another database
        writeRemovedUsers(payload, true)

        return res.status(204).send()
      }
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Restore a deleted user (Only for soft deleted users).
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const restore = async (req, res) => {
    try {
      const _id = req.params.id

      const result = await User.updateOne({ _id }, { deletedAt: null })

      if (!result.nModified) {
        throw {
          name: '_id',
          description: 'Este usuário já foi restaurado'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Change the User password.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const changePassword = async (req, res) => {
    try {
      const _id = req.params.id
      const { password } = req.body

      validatePassword(password, 8, {
        name: 'password',
        description: 'Senha inválida, é necessário pelo menos 8 caracteres'
      })

      const newPass = encryptAuth(password)

      await User.updateOne({ _id }, { password: newPass })

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Change the User password, called by User himself.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const changeMyPassword = async (req, res) => {
    try {
      const _id = req.params.id
      const { firstField, secondField } = req.body

      const { user } = req.user

      if (user._id !== _id) {
        throw {
          name: 'forbidden',
          description: 'Recurso não disponível para este usuário'
        }
      }

      validatePassword(firstField, 8, {
        name: 'firstField',
        description: 'Senha inválida, é necessário pelo menos 8 caracteres'
      })

      validatePassword(secondField, 8, {
        name: 'secondField',
        description: 'Senha de confirmação inválida, é necessário pelo menos 8 caracteres'
      })

      if (firstField !== secondField) {
        throw {
          name: 'firstAndSecondField',
          description: 'As senhas não coincidem'
        }
      }

      const password = encryptAuth(firstField)

      await User.updateOne({ _id }, { password })

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Save a new user image profile.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const saveProfileImage = async (req, res) => {
    try {
      const _id = req.params.id

      const size = 512

      const user = await User.findOne({ _id }, { password: 0 })

      if (!user) {
        throw {
          name: '_id',
          description: 'Usuário não encontrado'
        }
      }

      const currentImgPath = user.profilePhoto || ''

      if (!req.file) {
        throw {
          name: 'image',
          description: 'Imagem não encontrada'
        }
      }

      const newPath = await Image.compressImage({
        file: req.file,
        size,
        currentImage: currentImgPath,
        folder: 'users/' // Needs "/" character, for more details checks compressImage method.
      })

      if (!newPath) {
        throw {
          name: 'compressImageError',
          description: 'Ocorreu um erro ao comprimir a image, se persistir reporte!'
        }
      }

      await User.updateOne({ _id }, { profilePhoto: newPath })

      return res.status(200).send(newPath)
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove an user image profile.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - The User identifier
   */
  const removeProfileImage = async (req, res) => {
    try {
      const _id = req.params.id

      const result = await User.updateOne({ _id }, { profilePhoto: '' })

      if (!result.nModified) {
        throw {
          name: 'userProfileImage',
          description: 'Imagem já removida'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Validate an User by password.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   */
  const validateUserPassword = async (req, res) => {
    try {
      const { user } = req.user
      const { password } = req.body

      const encryptPass = encryptAuth(password)

      const found = await User.findOne({ _id: user._id, deletedAt: null }, { password: 1 })

      if (!found) {
        throw {
          name: '_id',
          description: 'Usuário não encontrado'
        }
      }

      if (found.password !== encryptPass) {
        throw {
          name: 'password',
          description: 'Senha não confere, esqueceu sua senha?'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get all users who have not logged on for the first time in 7 days
   * @returns {Object} Containing status of operation and removed users
   */
  const validateFirstLoginTime = async () => {
    try {
      const users = await User.find({ firstLoginAt: null })

      if (!users || users.length === 0) {
        throw {
          name: 'users',
          description: 'There are no users with these criteria'
        }
      }

      const futureUsersRemoved = await Promise.all(
        users.filter(user => {
          const createdDate = user.createdAt.getTime()
          const sevenDays = 1000 * 60 * 60 * 24 * 7

          if (createdDate + sevenDays < Date.now()) {
            // Delete the current user from MongoDB database
            const userDeleted = deleteUser(user._id).then(op => {
              if (op && op.deletedCount > 0) {
                // Return general data from deleted user
                return {
                  _id: user._id,
                  name: user.name,
                  cellphone: user.cellphone,
                  password: user.password,
                  deleted_at: new Date()
                }
              }
            })

            return userDeleted
          }
        })
      )

      if (futureUsersRemoved.length === 0) {
        throw {
          name: 'users',
          description: 'There are no users with these criteria'
        }
      }

      return { status: true, data: futureUsersRemoved }
    } catch (error) {
      return { status: false, data: [], msg: error }
    }
  }

  /**
   * @function
   * @description Write delete user action log in MySQL database
   * @private
   *
   * @param {Object} payload Containing status and data property
   * @param {Boolean} manually Flag to indicate whether the removal is manual or not
   */
  const writeRemovedUsers = async (payload, manually = false) => {
    try {
      const status = payload.status
      const users = payload.data
      if (!status) return
      if (users.length === 0) throw 'User not informed'
      app.knex
        .insert(users)
        .into('users_removed_permanently')
        .then(() => {
          const msg = manually
            ? `${users.length} user(s) removed your account permanently [manually] at ${new Date()}.`
            : `${users.length} user(s) removed permanently because he(they) didn't authenticate for the first time.`
          // eslint-disable-next-line no-console
          console.log(msg)
        })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Message: Error on write removed users | Error: ${error}`)
    }
  }

  /**
   * @function
   * @description Validate an user confirm email, used when user changed your email address, but not yet confirmed.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   */
  const validateConfirmEmailToken = async (req, res) => {
    try {
      const { token } = req.body
      const payload = JSON.parse(await decryptToken(token))

      const user = await User.findOne({ _id: payload._id })

      if (!user) {
        throw {
          name: 'token',
          description: 'Token não reconhecido, se persistir reporte'
        }
      }

      if (user.confirmEmailToken !== token) {
        throw {
          name: 'token',
          description: 'Token não reconhecido, se persistir reporte'
        }
      }

      if (payload.issuer !== issuer) {
        throw {
          name: 'issuer',
          description: 'Token não reconhecido, se persistir reporte'
        }
      }

      // If true, then token is expired
      if (Date.now() > payload.expireAt) {
        await User.updateOne({ _id: payload._id }, { confirmEmail: null, confirmEmailToken: null })
        throw {
          name: 'token',
          description: 'Token expirado, solicite uma nova troca de e-mail'
        }
      }

      await User.updateOne(
        { _id: payload._id },
        {
          confirmEmail: null,
          confirmEmailToken: null,
          email: payload.newEmail
        }
      )

      return res.status(204).send()
    } catch (error) {
      const stack = userError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return {
    get,
    getOne,
    save,
    remove,
    changePassword,
    saveByMySelf,
    saveProfileImage,
    removeProfileImage,
    changeMyPassword,
    validateUserPassword,
    restore,
    validateFirstLoginTime,
    writeRemovedUsers,
    resendEmail,
    validateConfirmEmailToken,
    cancelChangeEmail,
    deleteUser
  }
}
