module.exports = app => {
    
    const { View, User } = app.config.database.schemas.mongoose


    const lastViews = (req, res) => {
        /** Obtem as ultimas visualizações dos artigos [FUNÇÃO NÃO UTILIZADA] */
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

    const getViews = async (req, res) => {
        /* Obtem as visualizações permitindo uma serie de filtros */
        try {
            let limit = parseInt(req.query.limit) || 10

            const article = req.query.art || ''
            const dateBegin = req.query.db ? new Date(req.query.db) : new Date(new Date().setFullYear(new Date().getFullYear() - 100))
            const dateEnd = req.query.de ? new Date(req.query.de) : new Date(new Date().setFullYear(new Date().getFullYear() + 100))

            const user = req.user.user.tagAdmin && req.user.user.platformStats ? null : req.user.user._id

            if(limit > 10) limit = 10

            const match = {   
                'article.title': {$regex: `${article}`, $options: 'i'},
                startRead: {
                    $gte: dateBegin,
                    $lte: dateEnd
                },
                'article.author._id': user
            }

            if(!user) delete match['article.author._id']

            View.aggregate([
                {$match: match}, 
                {$sort: {startRead: -1}}
            ]).limit(limit).then(views => {
                return res.json({views})
            })
            
        } catch (error) {
            res.status(500).send(error)
        }
    }

    const getStats = async (_id) => {
        /* Obtem a quantidade de visualizações mais atualizada da base de dados SQL */
        try {
            const views = _id ? await app.knex.select().from('views').where('reference', _id).orderBy('id', 'desc').first() : await app.knex.select().from('views').whereNull('reference').orderBy('id', 'desc').first()
            return {status: true, views}
        } catch (error) {
            return {status: error, views: {}}
        }
    }

    const viewsJob = async () => {
        /* Responsável por migrar as informações de quantidade de visualizações da base NOSQL para SQL */

        const currentMonth = (new Date().getMonth())
        const currentYear = (new Date().getFullYear())
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth, 31)

        
        // Estatísticas para cada usuário da plataforma
        
        // Obter o arrays de _ids dos usuários
        const users = await User.find({deleted: false}, {_id: 1})
        
        // Percorre o array obtendo as views e inserindo as views no banco SQL
        users.map(async user => {
            const userViews = await View.countDocuments(
                {startRead: {
                    '$gte': firstDay,
                    '$lt': lastDay
                },
                'article.author._id': user.id
            })
            
            await app.knex('views').insert({month: currentMonth + 1, count: userViews, year: currentYear, reference: user.id})
        })

        
        /* Estatísticas gerais de plataforma */
        const views = await View.countDocuments({startRead: {
            '$gte': firstDay,
            '$lt': lastDay
        }})

        app.knex('views').insert({month: currentMonth + 1, count: views, year: currentYear}).then( () => {
            console.log(`**CRON** | views updated at ${new Date()}`)
        })

        
    }

    const getViewsPerArticle = async (article, page, limit) => {
        /* Obtem as estatisticas de visualização por um artigo especifico */
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

    const getChartViews = async (user = null, limit = 10) => {
        try {
            const viewsByArticle = await getViewsByArticle(user, limit)
            const viewsByAuthor = await getViewsByAuthor(user, limit)

            const data = {
                byArticle: viewsByArticle,
                byAuthor: viewsByAuthor
            }


            return data
        } catch (error) {
            throw error
        }
    }

    const getViewsByArticle = async (user, limit) => {
        
        const views = user ? await View.aggregate([
            {$match: {
                'article.author._id': user
            }},
            {$group: 
                {   _id:  "$article._id",
                    count: {$sum: 1},
                }
            },
            {$lookup: 
                {
                    from: "articles",
                    localField: "_id",
                    foreignField: "_id",
                    as: "article"
                }
            }
        ]).limit(limit) : await View.aggregate([
            {$match: {}},
            {$group: 
                {   _id:  "$article._id",
                    count: {$sum: 1}
                }
            },
            {$lookup: 
                {
                    from: "articles",
                    localField: "_id",
                    foreignField: "_id",
                    as: "article"
                }
            }
        ]).limit(limit)

        const data = await views.map( elem => {
            return {
                _id: elem._id,
                title: elem.article[0].title,
                article: elem.article[0],
                quantity: elem.count
            }
        })

        let chartData = {
            articles: [],
            articleId: [],
            views: [],
            originalData: data 
        }

        for (let i = 0; i < data.length; i++) {
            chartData.articles.push(data[i].title)
            chartData.articleId.push(data[i]._id)
            chartData.views.push(data[i].quantity)
        }

        return chartData
    }

    const getViewsByAuthor = async (user, limit) => {
        const views = user ? await View.aggregate([
            {$group: 
                {   _id:  {$toObjectId: "$article.author._id"},
                    count: {$sum: 1}
                }
            },
            {$lookup: 
                {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "author"
                }
            }
        ]).limit(limit) : await View.aggregate([
            {$group: 
                {   _id:  {$toObjectId: "$article.author._id"},
                    count: {$sum: 1}
                }
            },
            {$lookup: 
                {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "author"
                }
            }
        ]).limit(limit)

        const data = await views.map( elem => {
            return {
                _id: elem._id,
                name: elem.author[0].name,
                author: elem.author[0],
                quantity: elem.count
            }
        })

        let chartData = {
            authors: [],
            authorId: [],
            views: [],
            originalData: data 
        }

        for (let i = 0; i < data.length; i++) {
            chartData.authors.push(data[i].author.name)
            chartData.authorId.push(data[i]._id)
            chartData.views.push(data[i].quantity)
        }

        return chartData
    }
    
    return {getStats , viewsJob, lastViews, getViewsPerArticle, getViews, getChartViews}
}