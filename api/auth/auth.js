const jwt = require('jwt-simple')
const { SECRET_AUTH_PACKAGE, issuer } = require('../../.env')
const rp = require('request-promise')

/**
 *  @function
 *  @module Auth
 *  @description Manage authentications.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing some functions for provide authentication.
 */
module.exports = app => {
  const { exists } = app.config.validation

  const { User } = app.config.database.schemas.mongoose

  const { encryptAuth } = app.config.secrets

  const { authError } = app.config.api.httpResponses

  const { secretKey, url } = app.config.captcha

  /**
   * @function
   * @description Realize authentications.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A User Object representation + jwt token.
   *
   * @middlewareParams {Object} Localizated in Body request, must contain email, password and response attributes.
   */
  const signIn = async (req, res) => {
    try {
      const request = { ...req.body }

      const { secret } = SECRET_AUTH_PACKAGE

      const uri = `${url}?secret=${secretKey}&response=${request.response}`

      await rp({ method: 'POST', uri, json: true }).then(response => {
        if (!response.success) {
          throw {
            name: 'captcha',
            description: 'Captcha inválido'
          }
        }
      })

      const countUsers = await User.countDocuments()

      exists(request.email, {
        name: 'emailOrUsername',
        description: 'É necessário informar um e-mail ou username'
      })

      exists(request.password, {
        name: 'password',
        description: 'É necessário informar uma senha'
      })

      // prettier-ignore
      const user = countUsers
        ? await User.findOne({ email: request.email })
        : await app.knex
          .select()
          .from('users')
          .where('username', request.email)
          .orWhere('email', request.email)
          .first()

      if (!user) {
        throw {
          name: 'authentication',
          description: 'E-mail ou senha inválidos'
        }
      }

      if (user.deleted) {
        throw {
          name: 'authentication',
          description:
            'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema'
        }
      }

      const password = await encryptAuth(request.password)

      if (user.password === password) {
        if (!user.firstLogin && !user.id) {
          await User.updateOne({ _id: user._id }, { firstLogin: true })
        }

        user.password = null

        const now = Math.floor(Date.now() / 1000)
        const tenDaysLater = 60 * 60 * 24 * 10

        const payload = {
          iss: issuer,
          iat: now,
          exp: now + tenDaysLater,
          user: {
            _id: user._id || user.id,
            name: user.name,
            email: user.email,
            tagAdmin: user.tagAdmin,
            tagAuthor: user.tagAuthor,
            platformStats: Boolean(user.platformStats)
          }
        }
        return res.json({
          token: jwt.encode(payload, secret),
          user
        })
      } else {
        throw {
          name: 'authentication',
          description: 'E-mail ou senha inválidos'
        }
      }
    } catch (error) {
      const stack = await authError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Validate passport token.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A User Object representation + jwt token.
   *
   * @middlewareParams {Object} Localizated in Body request, must contain token attribute.
   */
  const validateToken = async (req, res) => {
    try {
      let token = { ...req.body }.token
      const { secret } = SECRET_AUTH_PACKAGE

      const payload = token ? await jwt.decode(token, secret) : {}
      const user = payload.user

      if (payload.iss !== issuer) {
        throw {
          name: 'issuer',
          description: 'Acesso não autorizado'
        }
      }

      const origin = isNaN(user._id)

      // prettier-ignore
      const exist = origin
        ? await User.findOne({ _id: user._id, deleted: false })
        : await app.knex
          .select()
          .from('users')
          .where('id', user._id)
          .first()

      if (exist && (exist._id || exist.id)) {
        if (user.email !== exist.email) {
          throw {
            name: 'changedEmail',
            description: 'Acesso não autorizado, seu e-mail de acesso foi alterado.'
          }
        }

        if (payload.exp - Math.floor(Date.now() / 1000) < 60 * 60 * 24 * 2) {
          payload.exp = 60 * 60 * 24 * 10
          token = jwt.encode(payload, secret)
        }

        if (exist.id) {
          exist._id = exist.id
          delete exist.id
        }

        exist.password = null

        return res.json({
          token,
          user: exist
        })
      } else {
        throw {
          name: 'unauthorized',
          description: 'Acesso não autorizado'
        }
      }
    } catch (error) {
      const stack = await authError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { signIn, validateToken }
}
