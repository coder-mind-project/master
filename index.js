const express = require('express')
const app = express()
const consign = require('consign')
const mongoose = require('mongoose')

require('./config/mongoDB')

app.mongo = mongoose
app.express = express

consign()
.include('./config/mysqlDB.js')
.then('./config/middlewares.js')
.then('./config/validation.js')
.then('./config/managementHttpResponse.js')
.then('./config/captcha.js')
.then('./config/secrets.js')
.then('./config/mailer.js')
.then('./config/mongooseModels.js')
.then('./config/passport.js')
.then('./api/articles/management.js')
.then('./api')
.then('./config/cron.js')
.then('./config/routes.js')
.into(app)

const port = process.env.DEFAULTPORT || 3001

app.listen(port, () => {
    console.log(`Server running at port ${port}`)
})

