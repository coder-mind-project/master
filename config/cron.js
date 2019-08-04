const schedule = require('node-schedule')

module.exports = app => {

    const { View } = app.config.mongooseModels
    
    const { viewsJob } = app.api.articles.views
    const { commentsJob } = app.api.articles.comments

    schedule.scheduleJob('01 * * *', async () => {
        viewsJob()
    })

    schedule.scheduleJob('02 * * *', async () => {
        commentsJob()
    })
}