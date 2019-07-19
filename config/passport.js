const { authSecret } = require('../.env')
const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt

module.exports = app => {
    
    const { User } = app.config.mongooseModels

    const params = {
        secretOrKey: authSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }

    const strategy = new Strategy(params, (payload, done) => {
        const _id = payload.user._id
        User.findOne({_id, deleted: false}).then( user => {
            done(null, user ? {...payload} : false)
        }).catch(error => done(error, false))
    })

    passport.use(strategy)

    return {
        authenticate: () => passport.authenticate('jwt', {session: false})
    }
}