module.exports = app => {
    const {User} = app.config.mongooseModels
    const {exists, validateEmail, validateCpf, validatePassword} = app.config.validation
    const {encryptTag, encryptAuth} = app.config.secrets
    
    const get = async (req, res) => {
        try {
            const query = req.query.query || ''
            const limit = parseInt(req.query.limit) || 10
            const page = req.query.page || 1

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
            ]).skip(page * limit - limit).limit(limit).then(users => res.json({users, count, limit}))
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const getOne = (req, res) => {
        const _id = req.params.id
        User.findOne({_id}).then(user => res.json(user)).catch(error => res.status(500).send(error))
    }

    const save = async (req, res) => {
        const user = {...req.body}
        
        try {
            exists(user.name, 'Nome inválido')
            validateEmail(user.email, 'E-mail inválido')
            exists(user.gender, 'Genero inválido')
            exists(user.type, 'Tipo de usuário inválido')
            validateCpf(user.cpf, 'CPF inválido')
            exists(user.telphone, 'Número de telefone inválido')
            exists(user.celphone, 'Número de celular inválido')
        }catch(msg){
            return res.status(400).send(msg)
        }

        if(user._id){
            try{
                const find = await User.findOne({_id: user._id})
                if(!find) throw 'Usuário não encontrado'

                const updatedUser = await formatUserToUpdate(user, find)

                const update = await User.updateOne({_id: user._id}, updatedUser).catch(error => {
                    if(error.code === 11000) throw 'Ja existe cadastro, com essas informações.'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 3]'
                })

                if(update.nModified > 0) return res.status(204).send()
                else throw 'Ocorreu um erro ao modificar os dados. [Code: 2]'
            
            }catch(error) {
                return res.status(500).send(error)
            }
        }else{
            try{
                validatePassword(user.password)

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

                saveUser.save().then(() => res.status(204).send()).catch(error => {
                    if(error.code === 11000) return res.status(400).send('Ja existe cadastro, com essas informações.') 
                })
            } catch (error) {
                return res.status(500).send(error)
            }
        }
    }

    const formatUserToUpdate = (userToUpdate, userInDatabase) => {
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
        try {
            const id = req.params.id

            if(!id) throw 'Usuário não encontrado. [Code: 1]'


            const {User} = app.config.mongooseModels
            const update = await User.updateOne({_id: id}, {deleted: true})
            
            if(update.nModified > 0) return res.status(204).send()
            else throw 'Nenhum usuário encontrado'
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const changePassword = (req, res) => {
        try {
            const body = {...req.body}
            console.log(body)
            validatePassword(body.password, "A senha precisa ter no mínimo 8 caracteres")
            const password = encryptAuth(body.password)
            const _id = body._id
            User.updateOne({_id},{password}).then(() => res.status(204).send())
        } catch (error) {
            return res.status(400).send(error)
        }
    }

    return {get, getOne, save, remove, changePassword}

}