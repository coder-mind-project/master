const captcha = require('../../config/recaptcha/captcha')
const authMailer = require('./emails')

/**
 * @module RedeemAccount
 * @function
 * @description Manage features about redeem account, provide some middleware functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions for provide users management.
 */
module.exports = app => {
  const { validateEmail, validatePassword } = app.config.validation

  const { User } = app.config.database.schemas.mongoose

  const { encryptAuth, encryptToken, decryptToken } = app.config.secrets

  const { redeemAccountError } = app.config.api.httpResponses

  /**
   * @function
   * @description Rescue account (password) by email
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `response` - A recaptcha token
   * @middlewareParams {String} `email` - The user email
   */
  const redeemPerEmail = async (req, res) => {
    try {
      const request = { ...req.body }

      const response = await captcha.verify(request.response)

      if (!response.success) {
        throw {
          name: 'recaptcha',
          description: 'Captcha inválido'
        }
      }

      validateEmail(request.email, {
        name: 'email',
        description: 'E-mail inválido'
      })

      const user = await User.findOne({ email: request.email, deletedAt: null })

      if (user) {
        const payload = {
          generatedAt: Date.now(),
          expireAt: Date.now() + 1000 * 60 * 60 * 12,
          user: user._id
        }

        const token = await encryptToken(JSON.stringify(payload))
        await User.updateOne({ _id: user._id }, { token })

        await authMailer().sendEmail('redeem-per-email', { user, token })
      }

      return res.status(204).send()
    } catch (error) {
      const stack = await redeemAccountError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Store redeem account request in MySQL database
   * @private
   * @param {Object} request - A Request account request
   *
   * @returns {Promise} A 'knex insert' promise
   */
  const storeRedeemRequest = request => {
    try {
      const redeemRequest = {
        contact_email: request.email,
        cellphone: request.cellphone,
        public_profile: request.publicProfile,
        date_begin: request.dateBegin,
        msg: request.msg
      }

      return app.knex.insert(redeemRequest).into('redeem_account_requests')
    } catch (error) {
      return { status: false }
    }
  }

  /**
   * @function
   * @description Rescue account by more informations
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `response` - A recaptcha token
   * @middlewareParams {String} `email` - The user email
   */
  const redeemPerMoreInformations = async (req, res) => {
    try {
      const request = { ...req.body }

      const response = await captcha.verify(request.response)

      if (!response.success) {
        throw {
          name: 'recaptcha',
          description: 'Captcha inválido'
        }
      }

      validateEmail(request.email, {
        name: 'email',
        description: 'É necessário fornecer um endereço de e-mail válido para contato'
      })

      await storeRedeemRequest(request)

      return res.status(204).send()
    } catch (error) {
      const stack = redeemAccountError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Validate a redeem account token
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `response` - A recaptcha token
   * @middlewareParams {String} `token` in `body` - The request account token
   */
  const validateToken = async (req, res) => {
    try {
      const { token } = req.query

      if (!token) {
        throw {
          name: 'token',
          description: 'Token não informado'
        }
      }

      const payload = JSON.parse(decryptToken(token))

      if (payload.generatedAt > Date.now() || payload.expireAt < Date.now()) {
        throw {
          name: 'token',
          description: 'Token inválido, solicite uma nova recuperação de senha'
        }
      }

      const _id = payload.user
      const user = await User.findOne({ _id, deletedAt: null }, { password: 0 })

      if (!user) {
        throw {
          name: 'user',
          description: 'Usuário não encontrado'
        }
      }

      if (user.token !== token) {
        throw {
          name: 'token',
          description: 'Token inválido, solicite uma nova recuperação de senha'
        }
      }

      return res.json(user)
    } catch (error) {
      const stack = await redeemAccountError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Change a user password with the redeem account token
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` in `params` - The User identifier
   * @middlewareParams {String} `token` in `params` - The request account token
   */
  const changePassword = async (req, res) => {
    try {
      const { id, token } = req.query
      const { firstField, secondField } = req.body

      if (!app.mongo.Types.ObjectId.isValid(id)) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const user = await User.findOne({ _id: id }, { token: 1 })

      if (user.token !== token) {
        throw {
          name: 'token',
          description: 'Token inválido, solicite uma nova recuperação de senha'
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

      await User.updateOne({ _id: id }, { password, token: null })

      return res.status(204).send()
    } catch (error) {
      const stack = redeemAccountError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { redeemPerEmail, redeemPerMoreInformations, validateToken, changePassword }
}
