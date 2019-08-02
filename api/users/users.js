const fileManagement = require('../../config/fileManagement.js')

module.exports = app => {

    // Mongoose model para usuario
    const { User } = app.config.mongooseModels
    
    // Validação de dados
    const { exists, validateEmail, validateCpf, validatePassword } = app.config.validation
    
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
                    {deleted: false}
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
                    {deleted: false}
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
                    deleted: false
                })

                await saveUser.save().then((response) => res.status(201).send(response)).catch(error => {
                    if(error.code === 11000) throw 'Ja existe cadastro com essas informações'
                })
            }
        }catch (error) {
            error = await userError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const updateExtraInfo = async (req, res) => {
        const user = {...req.body}
        const _id = req.params.id
        try {
            if(!_id) throw 'Usuário não encontrado'
            
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

            if(!_id) throw 'Usuário não encontrado'


            if(!userRequest.tagAdmin && userRequest._id !== _id)
                throw 'Acesso negado, somente administradores podem remover outros usuários'
            
            const {User} = app.config.mongooseModels
            const update = await User.updateOne({_id}, {deleted: true})
            
            if(update.nModified > 0) return res.status(204).send()
            else throw 'Este usuário já foi removido'
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

    return {get, getOne, save, remove,
            changePassword, updateExtraInfo,
            configProfilePhoto, removeProfilePhoto}

}