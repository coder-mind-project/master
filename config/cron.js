const schedule = require('node-schedule')

module.exports = app => {

    const { View } = app.config.mongooseModels
    
    const { viewsJob } = app.api.articles.views
    const { commentsJob } = app.api.articles.comments

    schedule.scheduleJob('10 * * * *', async () => {
        viewsJob()
    })

    schedule.scheduleJob('20 * * * *', async () => {
        commentsJob()
    })
}