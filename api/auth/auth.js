const jwt = require('jwt-simple')
const { authSecret, issuer } = require('../../.env')
const rp = require('request-promise')

module.exports = app => {

    // Validações de dados
    const { validateEmail, exists } = app.config.validation

    // Mongoose Model para usuarios
    const { User } = app.config.mongooseModels

    // Configurações extras
    const { encryptAuth } = app.config.secrets


    const { validateTokenManagement, signInError } = app.config.managementHttpResponse

    const { secret_key, uri } = app.config.captcha

    const signIn = async (req, res) => {
        /* Realiza a autenticação do usuário no sistema */

        try {
            const request = {...req.body}

            const url = `${uri}?secret=${secret_key}&response=${request.response}`
            
            await rp({method: 'POST', uri: url, json: true}).then( response => {
                if(!response.success) throw 'Captcha inválido'
            })

            validateEmail(request.email, 'E-mail inválido')
            exists(request.password, 'É necessário informar uma senha')

            const user = await User.findOne({email: request.email})

            if(!user) throw 'Não encontramos um cadastro com estas credenciais'
            if(user.deleted) throw 'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema'

            const password = await encryptAuth(request.password)

            if(user.password === password) {

                user.password = null

                const now = Math.floor(Date.now() / 1000)
                const tenDaysLater = (60*60*24*10)

                const payload = {
                    iss: issuer,
                    iat: now,
                    exp: now + tenDaysLater,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        tagAdmin: user.tagAdmin,
                        tagAuthor: user.tagAuthor
                    }
                }

                return res.json({
                    token: jwt.encode(payload, authSecret),
                    user
                })
            }
            else throw 'Senha incorreta, esqueceu sua senha?'

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

                const exist = await User.findOne({_id: user._id, deleted: false})
                
                if(exist && exist._id) {

                    if( payload.exp - Math.floor(Date.now() / 1000) < (60 * 60 * 24 * 2)){
                        payload.exp = (60*60*24*10)
                        token = await jwt.encode(payload, authSecret)
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