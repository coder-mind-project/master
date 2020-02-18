const { authSecret } = require('../../.env')
const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt

module.exports = app => {
    
    const { User } = app.config.database.schemas.mongoose

    const params = {
        secretOrKey: authSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }

    const strategy = new Strategy(params, async (payload, done) => {
        const _id = payload.user._id
        const countUser = await User.countDocuments()
        if(countUser){
            User.findOne({_id, deleted: false}).then( user => {
                done(null, user ? {...payload} : false)
            }).catch(error => done(error, false))
        }else{
            const user = await app.knex.select().from('users').where('id', _id).first()
            done(null, user ? {...payload} : false)
        }
    })

    passport.use(strategy)

    return {
        authenticate: () => passport.authenticate('jwt', {session: false})
    }
}