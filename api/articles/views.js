module.exports = app => {
    
    const { View } = app.config.mongooseModels

    const { errorView } = app.config.managementHttpResponse


    // const countViewsPerArticle = async (_idArticle) => {
    //     try {
    //         const views = await View.findOne({'article._id': _idArticle}).count("id")
    //         return views.length > 0 ? views.reduce(item => item).id : 0
    //     } catch (error) {
    //         throw error
    //     }
    // }

    const lastViews = (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10

            if(limit > 10) limit = 10

            View.aggregate([
                {$sort: {startRead: -1}}
            ]).limit(limit).then(response => res.json({views: response, limit}))

        } catch (error) {
            return res.status(500).send('Ocorreu um erro ao obter as visualizações')
        }
    }

    const getStats = async () => {
        try {
            const views = await app.knex.select().from('views').orderBy('id', 'desc').first()
            return {status: true, views}
        } catch (error) {
            return {status: error, views: {}}
        }
    }

    const viewsJob = async () => {

        const currentMonth = (new Date().getMonth())
        const currentYear = (new Date().getFullYear())
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth, 31)

        const views = await View.countDocuments({startRead: {
            '$gte': firstDay,
            '$lt': lastDay
        }})
        
        app.knex('views').insert({month: currentMonth + 1, count: views}).then( () => {
            console.log(`**CRON** | Visualizações atualizadas as ${new Date()}`)
        })
    }

    const getViewsPerArticle = async (article, page, limit) => {

        try {

            if(!page) page = 1
            if(!limit || limit > 100) limit = 10
            
            const count =  await View.find({'article._id': article._id}).countDocuments()
            const views =  await View.aggregate([
                {$match: {
                    'article._id':  article._id,
                }},
                {$sort: {startRead: -1}}
            ]).skip(page * limit - limit).limit(limit)

            return {status: true, views, count}
        } catch (error) {
            return {status: false, views: [], count: 0}
        }
    }
    
    return {getStats , viewsJob, lastViews, getViewsPerArticle}
}