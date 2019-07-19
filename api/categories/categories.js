module.exports = app => {

    // Validação de dados
    const { exists, validateLength } = app.config.validation
    
    // Mongoose model para categorias
    const { Category } = app.config.mongooseModels
    
    // Responsável por gerar Mensagens de erro Personalizadas
    const { errorCategory } = app.config.managementHttpResponse

    const save = async (req, res) => {
        /* Responsável por persistir categorias */

        const category = {...req.body}


        try {
            exists(category.name, 'Categoria não informada')
            exists(category.theme, 'Tema não informado')
            validateLength(category.name, 30, 'bigger')
            validateLength(category.alias, 30, 'bigger')
            validateLength(category.description, 100, 'bigger')
            
            category.state = 'active'
        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
            if(!category._id){
                delete category._id 

                const newCategory = new Category(category)

                await newCategory.save().then( (response) => res.status(201).send(response)).catch(error => {
                    if(error.code === 11000) throw 'Ja existe categoria com este nome'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte'
                })
            }else{
                await Category.updateOne({_id: category._id}, category).then(() => res.status(204).send()).catch(error => {
                    if(error.code === 11000) throw 'Ja existe categoria com este nome'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte'
                })
            }
        } catch (error) {
            error = await errorCategory(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const get = async (req, res) => {
        /*  Responsável por obter as categorias por filtros de 
            palavras chave. Ocorrendo a possibilidade de limitar 
            por páginação e também obtendo a quantidade total de registros
            por filtragem
         */
        
        try {
            var limit = parseInt(req.query.limit) || 10
            const query = req.query.query || ''
            const page = req.query.page || 1

            if(limit > 100) limit = 10

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
        /* Responsável por remover a categoria */

        try {
            const _id = req.params.id

            if(!_id) throw 'Categoria não encontrada'

            const state = {
                state: 'removed'
            }

            Category.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorCategory(error)
            return res.status(_error).send(error)
        }
    }

    const getOne = (req, res) => {
        /* Responsável por obter a categoria pelo ID */

        const _id = req.params.id
        Category.findOne({_id}).then(category => res.json(category)).catch( () => res.status(500).send('Ops, ocorreu um erro ao recuperar as informações. Tente atualizar a página'))
    }
    
    const active = async (req, res) => {
        /* Responsável restaurar uma categoria excluída */
        // Não implementado

        try {
            const _id = req.params.id
            
            if(!_id) throw 'Categoria não encontrada'
            
            const state = {
                state: 'active'
            }
            
            Category.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorCategory(error)
            return res.status(_error).send(error)
        }
    }

    const getByTheme = (req, res) => {
        /* Obtém todas as categorias de um determinado tema */

        const _id = req.params.id

        try {
            if(!_id) throw 'Cadastro não encontrado'
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