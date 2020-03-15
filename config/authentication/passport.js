const { SECRET_AUTH_PACKAGE } = require('../../.env')
const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt

/**
 *  @function
 *  @module Passport
 *  @description Generate a user passport for access middlewares that need authentication.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Informations included a user extracted from jwt token.
 */
module.exports = app => {
  const { User } = app.config.database.schemas.mongoose

  const { secret } = SECRET_AUTH_PACKAGE

  const params = {
    secretOrKey: secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
  }

  const strategy = new Strategy(params, async (payload, done) => {
    const _id = payload.user._id
    const countUser = await User.countDocuments()
    if (countUser) {
      User.findOne({ _id, deletedAt: null })
        .then(user => {
          done(null, user ? { ...payload } : false)
        })
        .catch(error => done(error, false))
    } else {
      const user = await app.knex
        .select()
        .from('users')
        .where('id', _id)
        .first()
      done(null, user ? { ...payload } : false)
    }
  })

  passport.use(strategy)

  return {
    authenticate: () => passport.authenticate('jwt', { session: false })
  }
}
