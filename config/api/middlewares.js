const bodyParser = require('body-parser')
const useCors = require('./cors')

/**
 * @function
 * @module middlewares
 * @param {Object} app - A app Object provided by consign.
 * @description Middlewares settings.
 */
module.exports = app => {
  app.use(bodyParser.json({ limit: '10mb' }))
  useCors(app)
}
