const bodyParser = require('body-parser')
const cors = require('cors')
const { webApp, panel } = require('../../.env')

/**
 * @function
 * @module middlewares
 * @param {Object} app - A app Object provided by consign.
 * @description Middlewares settings.
 */
module.exports = app => {
  /**
   * @type {Array<String>}
   * @description Origin urls acceptables by app.
   */
  const whiteList = process.env.PRODUCTION ? [webApp.default, panel.default] : null

  /**
   * @function
   * @description Validates current origin url in whiteList array.
   * @param {String} origin Origin url.
   * @param {Function} callback Function callback to resolve cors permission.
   */
  const origin = (origin, callback) => {
    if (whiteList.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }

  const options = whiteList ? { origin } : null

  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(cors(options))
}
