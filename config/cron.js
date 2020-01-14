const schedule = require('node-schedule')

module.exports = app => {

    const { viewsJob } = app.api.articles.views
    const { commentsJob } = app.api.articles.comments
    const { likesJob } = app.api.articles.likes 

    schedule.scheduleJob('00 01 * * *', async () => {
        viewsJob()
    })

    schedule.scheduleJob('00 02 * * *', async () => {
        commentsJob()
    })

    schedule.scheduleJob('00 03 * * *', async () => {
        likesJob()
    })
}