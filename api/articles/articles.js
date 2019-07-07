const fileManagement = require('../../config/fileManagement.js')

module.exports = app => {

    const {Article} = app.config.mongooseModels
    const {exists, validateLength} = app.config.validation
    const {errorURL} = app.config.codeHttpResponse

    const get = async (req, res) => {

        try {
            const query = req.query.query || ''
            const page = req.query.page || 1
            const limit = parseInt(req.query.limit) || 10

            let count = await Article.aggregate([
                {$match : {$and: [
                    {$or: [
                        {title: {$regex: `${query}` , $options: 'i'}},
                        {shortDescription: {$regex: `${query}` , $options: 'i'}},
                    ]},
                    {
                        deleted: false
                    }
                ]}
            }]).count("id")
            
            count = count.length > 0 ? count.reduce(item => item).id : 0

            Article.aggregate([
                {$match : {$and: [
                    {$or: [
                        {title: {$regex: `${query}` , $options: 'i'}},
                        {shortDescription: {$regex: `${query}` , $options: 'i'}},
                    ]},
                    {
                        deleted: false
                    }
                ]}
                },{$sort: {createdAt: -1}}])
            .skip(page * limit - limit).limit(limit).then(articles => res.json({articles, count, limit}))
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const getOneById = (req, res) => {
        const _id = req.params.id

        
        try {
            Article.findOne({_id}).then(data => res.json(data))
        } catch (error) {
            return res.status(500).send(error)
        }
    }


    const getOne = (req, res) => {
        const customURL = req.params.url

        try {
            Article.findOne({customURL}).then(data => res.json(data))
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    
    const save = async (req, res) => {
        const article = {...req.body}
        try {
            
            exists(article.title, 'Informe um título para o artigo')
            //validateLength(article.title, 150, 'bigger', 'Máximo permitido 150 caracteres')
            exists(article.theme, 'Tema não informado')
            exists(article.theme._id, 'Tema não informado')
            exists(article.shortDescription, 'Breve descrição inválida')
            validateLength(article.shortDescription, 150, 'bigger', 'Máximo permitido 150 caracteres')
            validateLength(article.longDescription, 300, 'bigger', 'Máximo permitido 300 caracteres')
            exists(article.textArticle, 'Corpo do artigo inválido')
            exists(article.author, 'Autor não encontrado')
            exists(article.author._id, 'Autor não encontrado')
            exists(article.customURL, 'URL não definida')
            
        }catch(msg){
            return res.status(400).send(msg)
        }

        if(!article._id){

            try{
                article.createdAt = new Date()
                
                const newArticle = new Article({
                    title: article.title,
                    theme: article.theme,
                    author: article.author,
                    shortDescription: article.shortDescription,
                    textArticle: article.textArticle,
                    createdAt: article.createdAt,
                    published: false,
                    boosted: false,
                    deleted: false,
                    inactivated: false
                })
                
                if(article.category && article.category._id) newArticle.category = article.category
                if(article.longDescription) newArticle.longDescription = article.longDescription
                if(article.customURL) newArticle.customURL = article.customURL
                
                await newArticle.save().then(() => {
                    res.status(204).send()
                })
    
            } catch (error) {
                const payload = await errorURL(error)
                return res.status(payload.codeError).send(payload.msg)
            }
        }else{
            try{
                const _id = article._id
                await Article.updateOne({_id}, article).then(() => {
                    res.status(204).send()
                })
    
            } catch (error) {
                const payload = await errorURL(error)
                return res.status(payload.codeError).send(payload.msg)
            }
        }
    }

    const remove = async (req, res) => {
        const id = req.params.id
        
        try {

            const article = await Article.findOne({_id: id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.published) throw 'Artigos publicados não podem ser removidos, considere inativar o artigo'

        } catch (msg) {
            return res.status(400).send(msg)
        }
        
        try {
            
            const update = await Article.updateOne({_id: id}, {deleted: true})
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const publish = async (req, res) => {
        const id = req.params.id
        
        try {

            const article = await Article.findOne({_id: id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.deleted) throw 'Esse artigo esta excluído, não é possível publicá-lo'
            if(article.published) throw 'Esse artigo já está publicado'
            
        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
        
            const change = {
                published: true,
                inactivated: false
            }

            const update = await Article.updateOne({_id: id}, change)
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const boost = async (req, res) => {
        const id = req.params.id

        try {

            const article = await Article.findOne({_id: id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(!article.published) throw 'Este artigo não está publicado, publique-o primeiro'
            if(article.inactivated) throw 'Este artigo está inativo, não é possível impulsioná-lo'
            if(article.deleted) throw 'Este artigo está excluído, não é possível impulsioná-lo'
            if(article.boosted) throw 'Este artigo já está impulsionado'
            
        } catch (error) {
            return res.status(400).send(error)
        }
        
        try {

            const update = await Article.updateOne({_id: id}, {boosted: true})
            
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        
        } catch (error) {
            
            return res.status(500).send(error)
        }
    }

    const inactive = async (req, res) => {

        const id = req.params.id
        
        try {

            const article = await Article.findOne({_id: id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.deleted) throw 'Esse artigo esta excluído, não é possível inativá-lo'
            if(!article.published) throw 'Este artigo não está publicado, considere removê-lo'

        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
            
            const change = {
                published: true,
                inactivated: true,
                boosted: false
            }

            const update = await Article.updateOne({_id: id}, change)
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'

        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const active = async (req, res) => {
        const id = req.params.id
        
        try {

            const article = await Article.findOne({_id: id})

            if(!article._id) throw 'Artigo não encontrado'
            if(article.active) throw 'Este artigo já está ativo'
            if(article.boosted) throw 'Este artigo não necessita ser ativo'
            if(article.deleted) throw 'Este artigo está excluído, não é possível ativá-lo'

        } catch (msg) {
            return res.status(400).send(msg)
        }

        try {
            
            const change = {
                inactivated: false,
                published: true,
                boosted: false
            }
            const update = await Article.updateOne({_id: id}, change)
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'

        } catch (error) {
            return res.status(500).send(error)
        }
    }




    
    const unboost = async (req, res) => {
        try {
            const id = req.params.id

            const update = await Article.updateOne({_id: id}, {boosted: false})
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const restore = async (req, res) => {
        try {
            const id = req.params.id

            const update = await Article.updateOne({_id: id}, {deleted: false})
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const unpublish = async (req, res) => {
        try {
            const id = req.params.id

            const update = await Article.updateOne({_id: id}, {published: false})
            if(update.nModified > 0) {
                const newArticle = await Article.findOne({_id: id})
                return res.json(newArticle)
            }
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    
    const pushImage = async (req, res) => {
        try {
            const _id = req.body.idArticle
            
            const size = parseInt(req.query.size) || 512
            const path = req.query.path || ''

            const article = await Article.findOne({_id})
            
            if(!article) throw 'Artigo não encontrado'

            const currentDirectory = article[path] || ''

            if(req.file){
                fileManagement.compressImage(req.file, size, currentDirectory).then( async (newPath) => {
                    const change = {
                        [path]: newPath
                    }
                    await Article.updateOne({_id}, change)

                    return res.status(200).send(newPath)
                })
            }else{
                throw 'Ocorreu um erro ao salvar a imagem [code: 1]'
            }

        } catch (error) {
            console.log(error)
            return res.status(500).send(error)
        }
        
    }

    const getImage = async (req, res) => {
        const id = req.params.id

        try {
            const article = await Article.findOne({_id: id})
            
            if(!article) throw 'Artigo não encontrado'
            
            if(article.smallImg){
                fileManagement.readImage(article.smallImg).then( data => res.status(200).send(data)).catch(error => {
                    return res.status(500).send(error)
                })
            }else{
                return res.status(204).send()
            }
        } catch (msg) {
            return res.status(400).send(msg)
        }
        
    }

    const removeImage = async (req, res) => {
        const _id = req.params.id
        const path = req.query.path

        try {
            if(path !== 'smallImg' && path !== 'bigImg') throw 'Ocorreu um erro ao remover a imagem [code: 2]'
            
            const article = await Article.findOne({_id})
            if(!article) throw 'Artigo não encontrado'

            if(!article[path]) throw 'Este artigo não possui imagem'

            fileManagement.removeImage(article[path]).then( async resp => {
                if(resp){
                    const update = await Article.updateOne({_id},{[path]: ''})
                    if(update.nModified > 0) return res.status(204).send()
                    else throw 'Ocorreu um erro ao remover a imagem [code: 1]'
                }else{
                    throw 'Ocorreu um erro ao remover a imagem [code: 2]'
                }
            })
        } catch (msg) {
            return res.status(400).send(msg)
        }
    }


    

    return {get, getOneById, getOne, save, remove, publish, boost, inactive, unpublish, unboost, active,restore, pushImage, getImage, removeImage}
}