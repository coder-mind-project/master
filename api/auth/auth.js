const jwt = require('jwt-simple')
const { SECRET_AUTH_PACKAGE, issuer } = require('../../config/environment')
const captcha = require('../../config/recaptcha/captcha.js')

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

  const { authError } = app.api.responses

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

      const response = await captcha.verify(request.response, true)

      if (!response.success) {
        throw {
          name: 'recaptcha',
          description: 'Captcha inválido'
        }
      }

      exists(request.email, {
        name: 'emailOrUsername',
        description: 'É necessário informar um e-mail ou username'
      })

      exists(request.password, {
        name: 'password',
        description: 'É necessário informar uma senha'
      })

      const countUsers = await User.countDocuments({ deletedAt: null })

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

      if (user.deletedAt) {
        throw {
          name: 'authentication',
          description:
            'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema'
        }
      }

      const password = await encryptAuth(request.password)

      if (user.password === password) {
        if (!user.firstLoginAt && countUsers) {
          const today = new Date()
          const result = await User.updateOne({ _id: user._id }, { firstLoginAt: today })
          if (result.nModified) user.firstLoginAt = today
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

      if (payload.iss !== issuer) {
        throw {
          name: 'issuer',
          description: 'Acesso não autorizado'
        }
      }

      if (!payload.user) {
        throw {
          name: 'user',
          description: 'Acesso não autorizado'
        }
      }

      const origin = isNaN(payload.user._id)

      // prettier-ignore
      let user = origin
        ? await User.findOne({ _id: payload.user._id, deletedAt: null })
        : await app.knex
          .select()
          .from('users')
          .where('id', payload.user._id)
          .first()

      if (user && (user._id || user.id)) {
        if (payload.user.email !== user.email) {
          throw {
            name: 'changedEmail',
            description: 'Acesso não autorizado, seu e-mail de acesso foi alterado.'
          }
        }

        if (payload.exp - Math.floor(Date.now() / 1000) < 60 * 60 * 24 * 2) {
          payload.exp = 60 * 60 * 24 * 10
          token = jwt.encode(payload, secret)
        }

        if (!origin) {
          user._id = user.id
          delete user.id
        }

        user = user.toObject({
          transform: (doc, ret) => {
            delete ret.password
            return ret
          }
        })

        return res.json({
          token,
          user
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
