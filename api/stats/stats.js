module.exports = app => {

    const { Article } = app.config.mongooseModels
    
    const { getLikesPerArticle } = app.api.articles.likes

    const { getViewsPerArticle } = app.api.articles.views

    const { getCommentsPerArticle } = app.api.articles.comments

    const get = async(req, res) => {
        
        const _id = req.params.id

        try {
            const viewsPage = parseInt(req.query.viewsPage) || 1
            const commentsPage = parseInt(req.query.commentsPage) || 1
            const viewsLimit = parseInt(req.query.viewsLimit) || 10
            const commentsLimit = parseInt(req.query.commentsLimit) || 10

            const article = await Article.findOne({_id})

            const views = await getViewsPerArticle(article, viewsPage, viewsLimit)
            const likes = await getLikesPerArticle(article)
            const comments = await getCommentsPerArticle(article, commentsPage, commentsLimit)

            return res.json({likes, views, comments})
        } catch (error) {
            return res.status(500).send('Ocorreu um erro ao obter as estatísticas, tente novamente mais tarde')
        }
    }


    return { get }
}