/**
 * @module app
 * @description A index of App
 */

const express = require('express')
const app = express()
const consign = require('consign')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const fs = require('fs')

require('./config/database/mongoDB')

app.mongo = mongoose
app.express = express
app.nodemailer = nodemailer
app.fs = fs

consign()
  .include('./config/database/mysqlDB.js')
  .then('./config/api/middlewares.js')
  .then('./config/validation.js')
  .then('./config/secrets.js')
  .then('./config/mailer.js')
  .then('./config/database/schemas/mongoose.js')
  .then('./config/authentication/passport.js')
  .then('./api/responses.js')
  .then('./api/users/emails.js')
  .then('./api/users/users.js')
  .then('./api/users')
  .then('./api/articles')
  .then('./api/auth')
  .then('./api/categories')
  .then('./api/themes')
  .then('./api/stats')
  .then('./api/themes')
  .then('./api/tickets')
  .then('./api')
  .then('./config/cron.js')
  .into(app)

const port = process.env.DEFAULTPORT || 3001

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at port ${port}`)
})
