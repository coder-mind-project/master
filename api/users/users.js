const fileManagement = require('../../config/fileManagement.js')

const newAccountTxtMsg = require('../../mailer-templates/mail-text-msg/newAccount.js')

module.exports = app => {

    // Mongoose model para usuario
    const { User } = app.config.mongooseModels
    
    // Validação de dados
    const { exists, validateEmail, validateCpf, validatePassword, isEqual } = app.config.validation
    
    // Configurações SMTP
    const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.mailer

    // Configurações extras
    const { encryptTag, encryptAuth } = app.config.secrets

    const { userError } = app.config.managementHttpResponse
    
    const get = async (req, res) => {
        /*  Responsável por obter os usuarios por filtros de 
            palavras chave. Ocorrendo a possibilidade de limitar 
            por paginação e também obtendo a quantidade total de registros
            por filtragem
         */

        try {
            var limit = parseInt(req.query.limit) || 10
            const query = req.query.query || ''
            const page = req.query.page || 1

            const deleted = Boolean(req.query.deleted) || false

            if(limit > 100) limit = 10

            let count = await User.aggregate([
                {$match: {$and: [
                    {$or: [
                        {name: {$regex: `${query}`, $options: 'i'}},
                        {gender: {$regex: `${query}`, $options: 'i'}},
                        {cpf: {$regex: `${query}`, $options: 'i'}},
                        {telphone: {$regex: `${query}`, $options: 'i'}},
                        {celphone: {$regex: `${query}`, $options: 'i'}},
                    ]},
                    {deleted: deleted}
                ]}}
            ]).count('id')

            count = count.length > 0 ? count.reduce(user => user).id : 0

            User.aggregate([
                {$match: {$and: [
                    {$or: [
                        {name: {$regex: `${query}`, $options: 'i'}},
                        {gender: {$regex: `${query}`, $options: 'i'}},
                        {cpf: {$regex: `${query}`, $options: 'i'}},
                        {telphone: {$regex: `${query}`, $options: 'i'}},
                        {celphone: {$regex: `${query}`, $options: 'i'}},
                    ]},
                    {deleted: deleted}
                ]}}
            ]).skip(page * limit - limit).limit(limit).then(users => {
                users = users.map(user => {
                    delete user.password
                    return user
                })
                return res.json({users, count, limit})
            })
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const getOne = async (req, res) => {
        /* Responsável por obter o usuario pelo ID */

        try {
            const _id = req.params.id
            const user = await User.findOne({_id})
            if(!user) throw 'Usuário não encontrado'

            return res.json(user)

        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }

    
        
    }

    const save = async (req, res) => {
        /* Responsável por persistir usuarios */
        const user = {...req.body}
        
        try {
            exists(user.name, 'Nome inválido')
            validateEmail(user.email, 'E-mail inválido')
            exists(user.gender, 'Genero inválido')
            exists(user.type, 'Tipo de usuário inválido')
            validateCpf(user.cpf, 'CPF inválido')
            exists(user.telphone, 'Número de telefone inválido')
            exists(user.celphone, 'Número de celular inválido')

            if(user._id){
                const find = await User.findOne({_id: user._id})
                
                if(!find) throw 'Usuário não encontrado'

                const updatedUser = await formatUserToUpdate(user, find)

                await User.updateOne({_id: user._id}, updatedUser).catch(error => {
                    if(error.code === 11000) throw 'Ja existe cadastro com essas informações'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte'
                })

                return res.status(204).send()
            }else{
                validatePassword(user.password, 8)

                const tag = encryptTag(user.cpf)
                const password = encryptAuth(user.password)

                const saveUser = new User({
                    name: user.name,
                    email: user.email,
                    gender: user.gender,
                    [user.type === 'admin' ? 'tagAdmin' : 'tagAuthor']: tag,
                    [user.type !== 'admin' ? 'tagAdmin' : 'tagAuthor']: null,
                    cpf: user.cpf,
                    telphone: user.telphone,
                    celphone: user.celphone,
                    birthDate: user.birthDate,
                    address: user.address,
                    number: user.number,
                    password: password,
                    deleted: false,
                    firstLogin: false,
                    customUrl: `${Date.now()}`
                })

                await saveUser.save().then(async (response) => {
                    const accessLevelPlural = user.type === 'admin' ? 'Administradores' : 'Autores'
                    const accessLevel = user.type === 'admin' ? 'Administrador' : 'Autor'
                    const deleteAccountLink = 'https://codermind.com.br'

                    const htmlPath = 'mailer-templates/newAccount.html'
                    const variables = [
                        {key: '__AccessLevel', value: accessLevelPlural},
                        {key: '__email', value: user.email},
                        {key: '__password', value: user.password},
                        {key: '__notAcceptAccountLink', value: deleteAccountLink},
                        {key: '__AccessLevel', value: accessLevel},
                    ]
                    const params = {
                        accessLevel,
                        email: user.email,
                        password: user.password,
                        notAcceptAccountLink: deleteAccountLink
                    }
                    const email = user.email
                    
                    const result = await sendMail(htmlPath, variables, newAccountTxtMsg, params, email)
                    return res.status(201).send(response)
                }).catch(error => {
                    if(error.code === 11000) throw 'Ja existe cadastro com essas informações'
                })
            }
        }catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const sendMail = async (htmlPath, variables, txtMsgFunction, params, email) => {
        
        let htmlMsg = app.fs.readFileSync(htmlPath, 'utf8')

        variables.forEach( variable => {
            htmlMsg = htmlMsg.replace(variable.key, variable.value)
        })

        const transport = {
            host: SMTP_SERVER,
            port: PORT,
            secure: SECURE,
            auth: {
                user: USER,
                pass: PASSWORD
            }
        }

        const transporter = app.nodemailer.createTransport(transport)

        const mail = {
            from: `"Agente Coder Mind" <${USER}>`,
            to: email,
            subject: 'Acesso a plataforma | Coder Mind',
            text: txtMsgFunction(params),
            html: htmlMsg,
        }
        
        const info = await transporter.sendMail(mail)

        return Boolean(info.messageId)
    }

    const updateExtraInfo = async (req, res) => {
        /* Responsável por atualizar as informações sociais (ou informações extras) do usuario/autor */
        const user = {...req.body}
        const _id = req.params.id

        try {
            if(!_id) throw 'Usuário não encontrado'
            
            if(user.customUrl){
                const customUrl = user.customUrl
                const existsUser = await User.findOne({customUrl, _id: {'$ne': _id}})
                
                if(existsUser) throw 'Está Url customizada já esta associada a outro usuário, tente uma outra url'
            }

            User.updateOne({_id}, user)
                .then( () => res.status(204).send())
        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const formatUserToUpdate = (userToUpdate, userInDatabase) => {
        /*  Responsável por trocar a tag entre Admin e autor e vice e versa
            Quando ocorrer a troca de tipo de usuário ao persistir a mudança
        */

        if(userInDatabase.tagAdmin && userToUpdate.type !== 'admin'){
            userToUpdate.tagAdmin = null
            userToUpdate.tagAuthor = encryptTag(userToUpdate.cpf)
        }else if(userInDatabase.tagAuthor && userToUpdate.type === 'admin'){
            userToUpdate.tagAdmin = encryptTag(userToUpdate.cpf)
            userToUpdate.tagAuthor = null
        }

        delete userToUpdate.password

        return userToUpdate
    }


    const remove = async (req, res) => {
        /* Responsável por remover usuários */

        try {
            const _id = req.params.id
            const userRequest = req.user.user
            let password = ''

            if(!_id) throw 'Usuário não encontrado'

            if(!userRequest.tagAdmin && userRequest._id !== _id)
                throw 'Acesso negado, somente administradores podem remover outros usuários'
            
            if(req.method === 'PUT'){
                exists(req.body.password, 'Senha não informada')
                
                password = await encryptAuth(req.body.password)
                const user = await User.findOne({_id}, {_id, password})
                if(!user) throw 'Usuário não encontrado'

                if(password !== user.password) throw 'Senha incorreta'
            }

            const update = await User.updateOne({_id}, {deleted: true})
            
            if(update.nModified > 0) return res.status(204).send()
            else throw 'Este usuário já foi removido'
        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const restore = async (req, res) => {
        // Responsável por restaurar o usuário
        try {
            const _id = req.params.id
            
            const update = await User.updateOne({_id}, {deleted: false})
            
            if(update.nModified > 0) return res.status(204).send()
            else throw 'Este usuário já foi restaurado'
        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const changePassword = async (req, res) => {
        /* Responsável por alterar a senha de qualquer usuário */

        try {
            const user = {...req.body}
            const userRequest = req.user.user

            if(!userRequest.tagAdmin && userRequest._id !== user._id)
                throw 'Acesso negado, somente administradores podem alterar a senha de outros usuários'
            
            validatePassword(user.password, 8)
            const password = encryptAuth(user.password)
            const _id = user._id
            User.updateOne({_id},{password}).then(() => res.status(204).send())
        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const changeMyPassword = async (req, res) => {
        /* Middleware responsável por alterar a senha do usuario da requisição */

        try {
            const pass = {...req.body}
            const _id = req.params.id

            validatePassword(pass.firstField, 8, 'Senha inválida, é necessário pelo menos 8 caracteres')
            validatePassword(pass.secondField, 8, 'Senha confirmada inválida, é necessário pelo menos 8 caracteres')
            isEqual(pass.firstField, pass.secondField, 'As senhas não coincidem')

            const password = encryptAuth(pass.firstField)

            User.updateOne({_id},{password}).then(() => res.status(204).send())
        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const configProfilePhoto = async (req, res) => {
        try {

            const _id = req.body.idUser

            const size = 512

            const user = await User.findOne({_id})

            delete user.password

            if(!user) throw 'Usuário não encontrado'

            const currentDirectory = user.profilePhoto || ''

            if(req.file){
                await fileManagement.compressImage(req.file, size, currentDirectory).then( async (newPath) => {
                    const change = {
                        profilePhoto: newPath
                    }

                    await User.updateOne({_id}, change)

                    return res.status(200).send(newPath)
                })
            }else{
                throw 'Ocorreu um erro desconhecido, se persistir reporte'
            }

        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const removeProfilePhoto = async (req, res) => {
        try {
            const _id = req.params.id

            const change = {
                profilePhoto: ''
            }

            await User.updateOne({_id}, change).then( response => {
                if(response.nModified !== 1) throw 'Imagem já removida'
                return res.status(204).send()
            }).catch(error => {
                throw error
            })

        } catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const validateAdminPassword = async (req, res) => {
        try {
            const _id = req.user.user._id
            const password = req.body.password

            exists(password, 'É necessário informar sua senha para prosseguir')
            
            
            const user = await User.findOne({_id, deleted: false})
            if(!user) throw 'Usuário não encontrado'
            
            const pass = await encryptAuth(password)

            if(user.password === pass) return res.status(204).send()
            else throw 'Senha inválida'
        } catch (error) {
            error = await userError(error)
            res.status(error.code).send(error.msg)
        }
    }

    const validateUserPass = async (_id, password) => {
        // Responsável por validar a senha atual do usuário
        try {
            const pass = await encryptAuth(password)

            const user = await User.findOne({_id})

            if(!user) throw 'Usuário não encontrado'

            return user.password === pass
        } catch (error) {
            return error
        }
    } 

    const validateUserPassword = async (req, res) => {
        //Middleware responsável por validar a senha atual do usuário
        try {
            const _id = req.body._id
            let password = req.body.password

            const accepted = await validateUserPass(_id, password)

            if(typeof accepted === 'string' && Boolean(accepted)) throw accepted
            if(!accepted) throw 'Senha incorreta'
            
            res.status(204).send()
        } catch (error) {
            error = await userError(error)
            res.status(error.code).send(error.msg)
        }
    }

    const validateFirstLoginTime  = async () => {
        /*  Verifica os novos usuários que nunca logaram
            na aplicação onde os mesmo estejam fora do prazo
            de 7 dias após a criação da conta. 
        */
        try {
            const users = await User.find({firstLogin: false})
            
            if(!users || users.length === 0) throw 'Nenhum usuário encontrado'
            
            let usersDeleted = []
            
            for (let i = 0; i < users.length; i++) {
                if((users[i].created_at.getTime() + (1000*60*60*24*7)) < Date.now()){
                    const result = await User.deleteOne({_id: users[i]._id})

                    if(result && result.deletedCount !== 0){
                        const userDeleted = {
                            _id: users[i].id,
                            name: users[i].name,
                            cpf: users[i].cpf,
                            celphone: users[i].celphone,
                            password: users[i].password,
                            deleted_at: new Date()
                        }

                        usersDeleted.push(userDeleted)
                    }
                }
            }

            if(usersDeleted.length === 0) throw 'Nenhum usuário a remover'

            return {status: true, data: usersDeleted}
        } catch (error) {
            return {status: false, data: [], msg: error}
        }
    }

    const writeRemovedUsers = async (payload) => {
        // Escreve a relação de usuários removidos para a base de dados SQL
        try {
            const status = payload.status
            const users = payload.data
            if(!status) return
            if(users.length === 0) throw 'Nenhum usuário informado'
            app.knex.insert(users).into('users_removed_permanently').then( () => {
                console.log(`${users.length} usuário(s) removido(s) permanentemente por não acessar sua(s) conta(s) pela primeira vez dentro do prazo de 7 dias`)
            })
        } catch (error) {
            console.log('Erro ao gravar os usuários removidos permanentemente por não acessar suas contas pela primeira vez dentro do prazo de 7 dias')
        }
    }


    return {get, getOne, save, remove,
            changePassword, updateExtraInfo,
            configProfilePhoto, removeProfilePhoto, changeMyPassword,
            validateAdminPassword, restore, validateUserPassword,
            validateFirstLoginTime, writeRemovedUsers}

}