module.exports = app => {
    const {validateEmail, exists} = app.config.validation
    const {User} = app.config.mongooseModels
    const {encryptAuth} = app.config.secrets
    const signIn = async (req, res) => {
        try {
            const payload = {...req.body}
            validateEmail(payload.email, 'E-mail inválido')
            exists(payload.password, 'É necessário informar uma senha')

            const user = await User.findOne({email: payload.email})

            if(!user) throw 'Não encontramos um cadastro com estas credenciais'
            if(user.deleted) throw 'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema'

            const password = await encryptAuth(payload.password)

            if(user.password === password) {
                //delete user.password
                return res.json(user)
            }
            else throw 'Senha incorreta'

        } catch (error) {
            return res.status(400).send(error)
        }
    }

    const validateToken = async (req, res) =>{
        try {
            const user = {...req.body}
            
            const exist = await User.findOne({email: user.email, deleted: false})
            if(exist && exist._id) return res.json(exist)
            else res.status(400).send('Acesso não autorizado')

        } catch (error) {
            return res.status(500).send(error)
        }

    }

    return {signIn, validateToken}
}