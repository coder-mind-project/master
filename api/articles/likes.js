module.exports = app => {

    const { Like } = app.config.mongooseModels

    const getLastLikes = (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10

            if(limit > 10) limit = 10

            Like.aggregate([
                {$sort: {createdAt: -1}}
            ]).limit(limit).then(likes => res.json({likes, limit}))

        } catch (error) {
            return res.status(500).send('Ocorreu um erro ao obter as ultimas avaliações')
        }
    }

    const getStats = async () => {
        try {
            const likes = await app.knex.select().from('likes').orderBy('id', 'desc').first()
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

        const likes = await Like.countDocuments({created_at: {
            '$gte': firstDay,
            '$lt': lastDay
        }})

        app.knex('likes').insert({month: currentMonth + 1, count: likes}).then( () => {
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