const cors = require('cors')
const { panel } = require('../../config/environment')

module.exports = app => {
  /**
   * @type {Array<String>}
   * @description Origin urls acceptables by app.
   */
  const whiteList = process.env.PRODUCTION === 'true' ? [panel.default] : null

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

  app.use(cors(options))
}
