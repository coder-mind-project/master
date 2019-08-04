module.exports = app => {
    
    const { View } = app.config.mongooseModels

    const { errorView } = app.config.managementHttpResponse


    const countViewsPerArticle = async (_idArticle) => {
        try {
            const views = await View.findOne({'article._id': _idArticle}).count("id")
            return views.length > 0 ? views.reduce(item => item).id : 0
        } catch (error) {
            throw error
        }
    }

    const getStats = async (req, res) => {
        app.mysql.query('select * from views order by id desc limit 1', (err, result) => {
            if(!err) return res.json(result[0])
            else return res.status(500).send(err)
        })
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
        
        app.mysql.query('insert into views (month, count) values(? , ?)',
            [currentMonth , views], (err, results) => {
                if(err) console.log(err)
                else{
                    console.log(`Visualizações atualizadas as ${new Date()}`)
                }
        })
    }
    
    return {getStats , viewsJob}
}