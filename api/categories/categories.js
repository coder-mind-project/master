module.exports = app => {

    const {exists, validateLength} = app.config.validation
    const {Category} = app.config.mongooseModels
    const {errorTheme} = app.config.codeHttpResponse

    const save = async (req, res) => {
        const category = {...req.body}


        try {
            exists(category.name, 'Categoria não informada')
            exists(category.theme, 'Tema não informado')
            validateLength(category.name, 30, 'bigger')
            validateLength(category.alias, 30, 'bigger')
            validateLength(category.description, 100, 'bigger')
            
            if(!category.alias) delete category.alias
            if(!category.description) delete category.description
            
            
            category.state = 'active'
        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
            if(!category._id){
                delete category._id 

                const newCategory = new Category(category)

                await newCategory.save().then( () => res.status(204).send()).catch(error => {
                    if(error.code === 11000) throw 'Ja existe categoria com este nome'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte [Code: 3]'
                })
            }else{
                Category.updateOne({_id: category._id}, category).then(() => res.status(204).send()).catch(error => {
                    if(error.code === 11000) throw 'Ja existe categoria com este nome'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte [Code: 3]'
                })
            }
        } catch (error) {
            const _error = await errorTheme(error)
            return res.status(_error).send(error)
        }
    }

    const get = async (req, res) => {
        
        try {
            const query = req.query.query || ''
            const page = req.query.page || 1
            const limit = parseInt(req.query.limit) || 10

            let count = await Category.aggregate([
                {$match : 
                    {$and: [
                            {$or : [
                                {name: {$regex: `${query}` , $options: 'i'}},
                                {alias: {$regex: `${query}` , $options: 'i'}},
                            ]
                            },
                            {
                                state: 'active'
                            }
                        ]
                    }
                }
            ]).count('id')

            count = count.length > 0 ? count.reduce(item => item).id : 0

            Category.aggregate([
                {$match : 
                    {$and: [
                            {$or : [
                                {name: {$regex: `${query}` , $options: 'i'}},
                                {alias: {$regex: `${query}` , $options: 'i'}},
                            ]
                            },
                            {
                                state: 'active'
                            }
                        ]
                    }
                }
            ]).skip(page * limit - limit).limit(limit).then(categories => res.json({categories, count, limit}))
        } catch (error) {
            return res.status(500).send('Ops, ocorreu um erro ao recuperar as informações. Tente atualizar a página')
        }
    }

    const remove = async (req, res) => {
        try {
            const _id = req.params.id

            if(!_id) throw 'Tema não encontrado [Code: 1]'

            const state = {
                state: 'removed'
            }

            Category.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorTheme(error)
            return res.status(_error).send(error)
        }
    }

    const getOne = (req, res) => {
        const _id = req.params.id
        Category.findOne({_id}).then(category => res.json(category)).catch( () => res.status(500).send('Ops, ocorreu um erro ao recuperar as informações. Tente atualizar a página'))
    }
    
    const active = async (req, res) => {
        try {
            const _id = req.params.id
            
            if(!_id) throw 'Tema não encontrado [Code: 1]'
            
            const state = {
                state: 'active'
            }
            
            Category.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorTheme(error)
            return res.status(_error).send(error)
        }
    }

    const getByTheme = (req, res) => {
        const _id = req.params.id
        try {
            if(!_id) throw 'Cadastro não encontrado [Code: 1]'
        } catch (error) {
            return res.status(400).send(error)
        }

        try {
            Category.aggregate([
                {$match : 
                    {$and: [
                            {
                                'theme._id': _id 
                            },
                            {
                                state: 'active'
                            }
                        ]
                    }
                }
            ]).then(categories => res.json(categories))
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    return {save, get, getOne, remove, active, getByTheme}
}