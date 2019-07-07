module.exports = app => {

    const {exists, validateLength} = app.config.validation
    const {Theme} = app.config.mongooseModels
    const {errorTheme} = app.config.codeHttpResponse

    const save = async (req, res) => {
        const theme = {...req.body}


        try {
            exists(theme.name, 'Tema não informado')
            validateLength(theme.name, 30, 'bigger')
            validateLength(theme.alias, 30, 'bigger')
            validateLength(theme.description, 100, 'bigger')
            
            if(!theme.alias) delete theme.alias
            if(!theme.description) delete theme.description
            
            
            theme.state = 'active'
        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
            if(!theme._id){
                delete theme._id 
                const newTheme = new Theme(theme)

                await newTheme.save().then( () => res.status(204).send()).catch(error => {
                    if(error.code === 11000) throw 'Ja existe tema com este nome'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte [Code: 3]'
                })

            }else{
                const _id = theme._id

                Theme.updateOne({_id}, theme).then(() => res.status(204).send()).catch(error => {
                    if(error.code === 11000) throw 'Ja existe tema com este nome'
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

            let count = await Theme.aggregate([
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

            Theme.aggregate([
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
            ]).skip(page * limit - limit).limit(limit).then(themes => res.json({themes, count, limit}))
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

            Theme.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorTheme(error)
            return res.status(_error).send(error)
        }
    }

    const getOne = (req, res) => {
        const _id = req.params.id
        Theme.findOne({_id}).then(theme => res.json(theme)).catch( () => res.status(500).send('Ops, ocorreu um erro ao recuperar as informações. Tente atualizar a página'))
    }
    
    const active = async (req, res) => {
        try {
            const _id = req.params.id
            
            if(!_id) throw 'Tema não encontrado [Code: 1]'
            
            const state = {
                state: 'active'
            }
            
            Theme.updateOne({_id}, state).then(() => res.status(204).send())
        } catch (error) {
            const _error = await errorTheme(error)
            return res.status(_error).send(error)
            }
    }

    return {save, get, getOne, remove, active}
}