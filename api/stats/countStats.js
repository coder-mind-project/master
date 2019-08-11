module.exports = app => {
    
    const getViews = app.api.articles.views.getStats
    const getComments = app.api.articles.comments.getStats
    const getLikes = app.api.articles.likes.getStats


    const get = async (req, res) => {
        try {
            const views = (await getViews()).views
            const comments = (await getComments()).comments
            const likes = (await getLikes()).likes
            
            return res.json({views, comments, likes})
        } catch (error) {
            return res.status(500).send('Ocorreu um erro ao obter as estatísticas, se persistir reporte')
        }
    }

    return { get }
}