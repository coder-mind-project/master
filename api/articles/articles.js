/* Responsável por realizar o gerenciamento de imagens dos artigos */
const fileManagement = require('../../config/fileManagement.js')
const MyDate = require('../../config/Date')
module.exports = app => {

    // Mongoose Model para artigos
    const { Article } = app.config.mongooseModels

    // Validações de dados
    const { exists, validateLength } = app.config.validation
    
    // Responsável por gerar Mensagens de erro Personalizadas
    const { errorArticle, errorManagementArticles } = app.config.managementHttpResponse
    const { publish, inactive, active, boost } = app.api.articles.management

    const get = async (req, res) => {
        /*  Realiza a busca de artigos filtrando por palavras chave.
            Possui limite de resultados e possui implementação de páginação
            Devolve a quantidade de artigos existentes pelos filtros de pesquisa
            E os artigos páginados de acordo com página desejada.
        */

        try {
            var limit = parseInt(req.query.limit) || 10
            const query = req.query.query || ''
            const page = req.query.page || 1
            const type = req.query.op || 'perUser'

            var config = req.user.user.tagAdmin ? {deleted: false} : {
                'author._id': req.user.user._id,
                deleted: false
            }

            if(req.user.user.tagAdmin && type === 'all'){
                config = {
                    deleted: false
                }
            }

            if(limit > 100) limit = 10

            let count = await Article.aggregate([
                {$match : {$and: [
                    {$or: [
                        {title: {$regex: `${query}` , $options: 'i'}},
                        {shortDescription: {$regex: `${query}` , $options: 'i'}},
                    ]},
                    config
                ]}
            }]).count("id")
            
            count = count.length > 0 ? count.reduce(item => item).id : 0

            Article.aggregate([
                {$match : {$and: [
                    {$or: [
                        {title: {$regex: `${query}` , $options: 'i'}},
                        {shortDescription: {$regex: `${query}` , $options: 'i'}},
                    ]},
                    config
                ]}
                },{$sort: {createdAt: -1}}])
            .skip(page * limit - limit).limit(limit).then(articles => res.json({articles, count, limit}))
        } catch (error) {
            return res.status(500).send(error)
        }
    }

    const getOneById = async (req, res) => {
        /* Middleware responsável por obter o artigo pelo ID  */
        
        const _id = req.params.id
        const article = await getById(_id)

        if(article && article.error) return res.status(500).send()
        
        if(article && article._id) return res.json(article)
        else return res.status(400).send('Nenhum artigo encontrado')
    }

    const getById = (_id) => {
        /* Obtem o artigo pelo ID */

        try {
            return Article.findOne({_id})
        } catch (error) {
            return {error: true}
        }
    }


    const getOne = async (req, res) => {
        /* Middleware responsável por obter o artigo pela URL customizada */
        const customURL = req.params.url
        
        const article = await getByCustomURL(customURL)
        
        if(article && article.error) return res.status(500).send()
        
        if(!req.user.user.tagAdmin && article.author._id !== req.user.user._id)
            return res.status(406).send('Este artigo não é seu, acesso negado')

        if(article && article._id) return res.json(article)
        else return res.status(400).send('Nenhum artigo encontrado')
    }

    const getByCustomURL = (customURL) => {
        /* Obtém o artigo pela URL customizada */

        try {
            return Article.findOne({customURL})
        } catch (error) {
            return {error: true}
        }
    }


    const save = async (req, res) => {
        /* Middleware responśavel por persistir artigos */

        const article = {...req.body}
        try {
            
            exists(article.title, 'Informe um título para o artigo')
            exists(article.theme, 'Tema não informado')
            exists(article.theme._id, 'Tema não informado')
            exists(article.shortDescription, 'Breve descrição inválida')
            validateLength(article.shortDescription, 150, 'bigger', 'Máximo permitido 150 caracteres')
            validateLength(article.longDescription, 300, 'bigger', '')
            exists(article.textArticle, 'Corpo do artigo inválido')
            exists(article.author, 'Autor não encontrado')
            exists(article.author._id, 'Autor não encontrado')
            exists(article.customURL, 'URL não definida')
            
            const exist = await getByCustomURL(article.customURL)

            if(exist && exist._id && exist._id === article._id) throw 'Já existe um artigo com este link personalizado, considere alterar-lo' 
            if(exist && exist.error) throw 'Ocorreu um erro desconhecido, se persistir reporte'

            if(!article._id){

                const newArticle = new Article({
                    title: article.title,
                    theme: article.theme,
                    customURL: article.customURL,
                    author: article.author,
                    shortDescription: article.shortDescription,
                    youtube: article.youtube,
                    github: article.github,
                    textArticle: article.textArticle,
                    published: false,
                    boosted: false,
                    deleted: false,
                    inactivated: false
                })


                if(article.category && article.category._id) newArticle.category = article.category
                else newArticle.category = {
                    name: '',
                    alias: '',
                    description: ''
                }
                if(article.longDescription) newArticle.longDescription = article.longDescription
                
                await newArticle.save().then(async () => {
                    const response = await Article.findOne({customURL: newArticle.customURL})
                    return res.status(201).send(response)
                }).catch(error => {
                    if(error.code === 11000) throw 'Ja existe um artigo com este link personalizado'
                    else throw 'Ocorreu um erro desconhecido, se persistir reporte'
                })
            }else{
                    const _id = article._id

                    if(!(article.category && article.category._id))
                        article.category = {
                            name: '',
                            alias: '',
                            description: ''
                        }
                    
                    await Article.updateOne({_id}, article).then(async () => {
                        const response = await Article.findOne({_id})
                        return res.status(200).send(response)
                    }).catch(error => {
                        if(error.code === 11000) throw 'Ja existe um artigo com este link personalizado'
                        else throw 'Ocorreu um erro desconhecido, se persistir reporte'
                    })
            }
        } catch (error) {
            error = await errorArticle(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const remove = async (req, res) => {
        /* Remove o artigo */
        
        const id = req.params.id
        
        try {

            if(!id) throw 'Artigo não encontrado'

            const article = await Article.findOne({_id: id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.published) throw 'Artigos publicados não podem ser removidos, considere inativar o artigo'

            const change = {
                deleted: true
            }

            const update = await Article.updateOne({_id: id}, change)
            
            if(update.nModified > 0) {
                return res.status(204).send()
            }
            
            else throw 'Ocorreu um erro desconhecido, se persistir reporte. [Code: 2]'
        
        } catch (error) {
            const customError = await errorManagementArticles(error)
            return res.status(customError.code).send(customError.msg)
        }
    }

    
    const management = async (req, res) => {
        /*
            Realiza o gerenciamento de artigos
            Isto é, realiza a publicação, impulsionamento, inativação e
            ativação dos artigos respectivamente.
        */

        const id = req.params.id
        const operation = req.query.op || 'Operação não identificada'

        try {

            if(!id) throw 'Artigo não encontrado'

            let result = false

            switch(operation){
                case 'publish': result = await publish(id); break;
                case 'boost': result = await boost(id); break;
                case 'inactive': result = await inactive(id); break;
                case 'active': result = await active(id); break;
                default: throw 'Nenhum método definido, consulte a documentação'    
            }

            if(! result._id) throw result

            return res.json(result)

        } catch (error) {
            if(!error.code){
                return res.status(500).send(error)
            }else{
                return res.status(error.code).send(error.msg)
            }
        }   
    }

    
    const pushImage = async (req, res) => {
        /* Realiza o envio da(s) imagem(ns) do artigo */
        
        try {
            const _id = req.body.idArticle
            
            const size = parseInt(req.query.size) || 512
            const path = req.query.path || ''

            if(!path) throw 'Ocorreu um problema ao enviar a imagem, se persistir reporte'

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
                throw 'Ocorreu um erro ao salvar a imagem, se persistir reporte'
            }

        } catch (error) {
            return res.status(500).send(error)
        }
        
    }


    const removeImage = async (req, res) => {
        /* Realiza a remoção da(s) imagem(ns) do artigo */

        const _id = req.params.id
        const path = req.query.path

        try {
            if(path !== 'smallImg' && path !== 'mediumImg' && path !== 'bigImg') throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
            
            const article = await Article.findOne({_id})
            if(!article) throw 'Artigo não encontrado'

            if(!article[path]) throw 'Este artigo não possui imagem'

            fileManagement.removeImage(article[path]).then( async resp => {
                if(resp){
                    const update = await Article.updateOne({_id},{[path]: ''})
                    if(update.nModified > 0) return res.status(204).send()
                    else throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
                }else{
                    throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
                }
            })
        } catch (msg) {
            return res.status(400).send(msg)
        }
    }


    

    return {get, getOneById, getOne, save, management, remove, pushImage, removeImage}
}