module.exports = app => {

    const { Like, User } = app.config.database.schemas.mongoose

    const getLastLikes = (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10

            const article = req.query.art || ''
            const dateBegin = req.query.db ? new Date(req.query.db) : new Date(new Date().setFullYear(new Date().getFullYear() - 100))
            const dateEnd = req.query.de ? new Date(req.query.de) : new Date(new Date().setFullYear(new Date().getFullYear() + 100))

            const user = req.user.user.tagAdmin && req.user.user.platformStats ? null : req.user.user._id

            if(limit > 10) limit = 10

            if(user){
                Like.aggregate([
                    { $match: {   
                            'article.title': {$regex: `${article}`, $options: 'i'},
                            updatedAt: {
                                $gte: dateBegin,
                                $lte: dateEnd
                            },
                            'article.author._id': user
                        }
                    },
                    {$sort: {updatedAt: -1}}
                ]).limit(limit).then(likes => res.json({likes, limit}))
            }else{
                Like.aggregate([
                    { $match: {   
                            'article.title': {$regex: `${article}`, $options: 'i'},
                            updatedAt: {
                                $gte: dateBegin,
                                $lte: dateEnd
                            }
                        }
                    },
                    {$sort: {updatedAt: -1}}
                ]).limit(limit).then(likes => res.json({likes, limit}))
            }

        } catch (error) {
            return res.status(500).send('Ocorreu um erro ao obter as ultimas avaliações')
        }
    }

    const getStats = async (_id) => {
        try {
            const likes = _id ? await app.knex.select().from('likes').where('reference', _id).orderBy('id', 'desc').first() : await app.knex.select().from('likes').whereNull('reference').orderBy('id', 'desc').first()
            return {status: true, likes}
        } catch (error) {
            return {status: error, likes: {}}
        }
    }

    const likesJob = async () => {

        const currentMonth = (new Date().getMonth())
        const currentYear = (new Date().getFullYear())
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth, 31)


        // Estatísticas para cada usuário da plataforma
        
        // Obter o arrays de _ids dos usuários
        const users = await User.find({deleted: false}, {_id: 1})
        
        // Percorre o array obtendo as views e inserindo as views no banco SQL
        users.map(async user => {
            const userLikes = await Like.countDocuments(
                {created_at: {
                    '$gte': firstDay,
                    '$lt': lastDay
                },
                'article.author._id': user.id
            })
            
            await app.knex('likes').insert({month: currentMonth + 1, count: userLikes, year: currentYear, reference: user.id})
        })

        /* Estatísticas gerais de plataforma */
        const likes = await Like.countDocuments({created_at: {
            '$gte': firstDay,
            '$lt': lastDay
        }})

        app.knex('likes').insert({month: currentMonth + 1, count: likes, year: currentYear}).then( () => {
            console.log(`**CRON** | likes updated at ${new Date()}`)
        })
    }

    const getLikesPerArticle = async (article) => {

        try {
            const count =  await Like.find({'article._id': {$regex: `${article._id}`, $options: 'i'}}).countDocuments()

            return {status: true, count}
        } catch (error) {
            return {status: false, count: 0}
        }
    }

    const getChartLikes = async (user = null, limit = 10) => {
        try {
            const likesByArticle = await getLikesByArticle(user, limit)
            const likesByAuthor = await getLikesByAuthor(limit)

            const data = {
                byArticle: likesByArticle,
                byAuthor: likesByAuthor
            }

            return data
        } catch (error) {
            throw error
        }
    }

    const getLikesByArticle = async (user, limit) => {
        
        const likes = user ? await Like.aggregate([
            {$match: {
                'article.author._id': user
            }},
            {$group: 
                {   _id:  {$toObjectId: "$article._id"},
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
        ]).limit(limit) : await Like.aggregate([
            {$match: {}},
            {$group: 
                {   _id:  {$toObjectId: "$article._id"},
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

        const data = await likes.map( elem => {
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
            likes: [],
            originalData: data 
        }

        for (let i = 0; i < data.length; i++) {
            chartData.articles.push(data[i].title)
            chartData.articleId.push(data[i]._id)
            chartData.likes.push(data[i].quantity)
        }

        return chartData
    }

    const getLikesByAuthor = async (limit) => {
        const likes = await Like.aggregate([
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

        const data = await likes.map( elem => {
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
            likes: [],
            originalData: data 
        }

        for (let i = 0; i < data.length; i++) {
            chartData.authors.push(data[i].author.name)
            chartData.authorId.push(data[i]._id)
            chartData.likes.push(data[i].quantity)
        }

        return chartData
    }

    return { getLastLikes, getStats, likesJob, getLikesPerArticle, getChartLikes }
}