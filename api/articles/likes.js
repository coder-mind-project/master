module.exports = app => {

    const { Like, User } = app.config.mongooseModels

    const getLastLikes = (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10

            const article = req.query.art || ''
            const dateBegin = req.query.db ? new Date(req.query.db) : new Date(new Date().setFullYear(new Date().getFullYear() - 100))
            const dateEnd = req.query.de ? new Date(req.query.de) : new Date(new Date().setFullYear(new Date().getFullYear() + 100))

            if(limit > 10) limit = 10

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
        const users = await User.find({}, {_id: 1})
        
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
            console.log(`**CRON** | Avaliações atualizadas as ${new Date()}`)
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

    return { getLastLikes, getStats, likesJob, getLikesPerArticle }
}