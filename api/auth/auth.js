const jwt = require('jwt-simple')
const { authSecret, issuer, panel } = require('../../.env')
const rp = require('request-promise')


module.exports = app => {
    
    // Validações de dados
    const { exists} = app.config.validation
    
    // Mongoose Model para usuarios
    const { User } = app.config.database.schemas.mongoose
    
    // Configurações extras
    const { encryptAuth } = app.config.secrets

    const { validateTokenManagement, signInError } = app.config.api.httpResponses

    const { secret_key, uri } = app.config.captcha

    const signIn = async (req, res) => {
        /* Realiza a autenticação do usuário no sistema */

        try {
            const request = {...req.body}

            const url = `${uri}?secret=${secret_key}&response=${request.response}`
            
            await rp({method: 'POST', uri: url, json: true}).then( response => {
                if(!response.success) throw 'Captcha inválido'
            })
            
            const countUsers = await User.countDocuments()

            exists(request.email, 'É necessário informar um e-mail ou username')
            exists(request.password, 'É necessário informar uma senha')
            
            const user = countUsers ? await User.findOne({email: request.email}) : await app.knex.select().from('users').where('username', request.email).orWhere('email', request.email).first()

            if(!user) throw 'E-mail ou senha inválidos'
            if(user.deleted) throw 'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema'

            const password = await encryptAuth(request.password)

            if(user.password === password) {

                if(!user.firstLogin && !user.id){
                    await User.updateOne({_id: user._id},{firstLogin: true})
                }

                user.password = null

                const now = Math.floor(Date.now() / 1000)
                const tenDaysLater = (60*60*24*10)

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
                    token: jwt.encode(payload, authSecret),
                    user
                })
            }
            else throw 'E-mail ou senha inválidos'

        } catch (error) {
            error = await signInError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const validateToken = async (req, res) =>{
        /* Valida o token de acesso */

        var token = null
        var payload = null

        try {
            const token = {...req.body}.token

            if(token){
                payload = await jwt.decode(token, authSecret)
            }else{
                throw 'Acesso não autorizado'
            }

        } catch (error) {
            return res.status(401).send('Acesso não autorizado')
        }

        try {
                const user = payload.user
                
                if(payload.iss !== issuer) throw 'Acesso não autorizado'

                const origin = isNaN(user._id)

                const exist = origin ? await User.findOne({_id: user._id, deleted: false}) : await app.knex.select().from('users').where('id', user._id).first()
                
                if(exist && (exist._id || exist.id)) {
                    
                    if(user.email !== exist.email) throw 'Acesso não autorizado, seu e-mail de acesso foi alterado.'

                    if( payload.exp - Math.floor(Date.now() / 1000) < (60 * 60 * 24 * 2)){
                        payload.exp = (60*60*24*10)
                        token = await jwt.encode(payload, authSecret)
                    }
                    
                    if(exist.id){
                        exist._id = exist.id
                        delete exist.id
                    }
                    
                    exist.password = null

                    return res.json({
                        token,
                        user: exist
                    })
                }else{
                    throw 'Acesso não autorizado'
                } 

        } catch (error) {
            error = await validateTokenManagement(error)
            return res.status(error.code).send(error.msg)
        }

    }

    return {signIn, validateToken}
}