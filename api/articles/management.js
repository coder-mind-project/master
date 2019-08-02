const MyDate = require('../../config/Date')

module.exports = app => {

    // Mongoose Model para artigos
    const { Article } = app.config.mongooseModels
    
    // Responsável por gerar Mensagens de erro Personalizadas
    const { errorManagementArticles } = app.config.managementHttpResponse
    
    
    const publish = async (_id) => {
        /*  Habilita a flag de publish do artigo 
            e desabilita todas as outras
        */
    
        try {
    
            const article = await Article.findOne({_id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.deleted) throw 'Esse artigo esta excluído, não é possível publicá-lo'
            if(article.published) throw 'Esse artigo já está publicado'
            
            const change = {
                published: true,
                boosted: false,
                deleted: false,
                inactivated: false,
                publishAt: MyDate.setTimeZone('-3')
            }
    
            const update = await Article.updateOne({_id}, change)
    
            if(update.nModified > 0) {
                return await Article.findOne({_id})
            }
            else{
                throw 'Operação realizada com sucesso, porém nada foi alterado'
            }
        
        } catch (error) {
            return await errorManagementArticles(error)
        }
    }
    
    const boost = async (_id) => {
        /*  Habilita as flags de publish e boosted do artigo
            e desabilita todas as outras
        */
    
        try {
    
            const article = await Article.findOne({_id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.inactivated) throw 'Este artigo está inativo, não é possível impulsioná-lo'
            if(article.deleted) throw 'Este artigo está excluído, não é possível impulsioná-lo'
            if(article.boosted) throw 'Este artigo já está impulsionado'
            if(!article.published) throw 'Este artigo não está publicado, publique-o primeiro'
            
            const change = {
                published: true,
                boosted: true,
                deleted: false,
                inactivated: false
            }
    
            const update = await Article.updateOne({_id}, change)
            
            if(update.nModified > 0) {
                return await Article.findOne({_id})
            }
            else{
                throw 'Operação realizada com sucesso, porém nada foi alterado'
            }
        
        } catch (error) {
            return await errorManagementArticles(error)
        }
    }
    
    const inactive = async (_id) => {
        /* Habilita a flag de inativo do artigo e desabilita todas as outras */
    
        try {
    
            const article = await Article.findOne({_id})
            
            if(!article._id) throw 'Artigo não encontrado'
            if(article.deleted) throw 'Esse artigo esta excluído, não é possível inativá-lo'
            if(!article.published) throw 'Este artigo não está publicado, considere removê-lo'
            
            const change = {
                published: true,
                boosted: false,
                deleted: false,
                inactivated: true
            }
    
            const update = await Article.updateOne({_id}, change)
            
            if(update.nModified > 0) {
                return await Article.findOne({_id})
            }
            else{
                throw 'Operação realizada com sucesso, porém nada foi alterado'
            }
        
        } catch (error) {
            return await errorManagementArticles(error)
        }
    }
    
    const active = async (_id) => {
        /*  Reseta todas as flags do artigo, dando o status identico a artigos
            recém criados
        */
    
        try {
    
            const article = await Article.findOne({_id})
    
            if(!article._id) throw 'Artigo não encontrado'
            if(article.active) throw 'Este artigo já está ativo'
    
            const change = {
                published: false,
                boosted: false,
                deleted: false,
                inactivated: false
            }
    
            const update = await Article.updateOne({_id}, change)
            
            if(update.nModified > 0) {
                return await Article.findOne({_id})
            }
            else{
                throw 'Operação realizada com sucesso, porém nada foi alterado'
            }
        
        } catch (error) {
            return await errorManagementArticles(error)
        }
    }
    
    return {publish, boost, inactive, active}
}