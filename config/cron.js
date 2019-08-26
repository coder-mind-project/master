const schedule = require('node-schedule')

module.exports = app => {

    const { viewsJob } = app.api.articles.views
    const { commentsJob } = app.api.articles.comments
    const { likesJob } = app.api.articles.likes

    schedule.scheduleJob('15 0 * * *', async () => {
        viewsJob()
    })

    schedule.scheduleJob('16 0 * * *', async () => {
        commentsJob()
    })

    schedule.scheduleJob('17 0 * * *', async () => {
        likesJob()
    })
}