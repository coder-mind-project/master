const { CAPTCHA_URL, CAPTCHA_SECRET_KEY } = require('../../.env')
const https = require('https')
const url = require('url')

/**
 * @class
 * @module Catpcha
 * @description Provide captcha service validation.
 */
class Captcha {
  constructor() {
    this.url = `${CAPTCHA_URL}?secret=${CAPTCHA_SECRET_KEY}&response=`
  }

  /**
   * @function
   * @description Validate the recaptcha token
   * @param {String} token - A recaptcha token
   * @param {Boolean} environment - Sets `true` for disable captcha validation.
   */
  verify(token, environment) {
    return new Promise((resolve, reject) => {
      // Disable captcha validation
      if (!process.env.PRODUCTION && environment) resolve({ success: true })

      const resource = new url.URL(`${this.url}${token}`)
      let data = null

      const options = {
        host: resource.hostname,
        path: `${resource.pathname}${resource.search}`,
        method: 'POST'
      }

      const req = https.request(options, res => {
        res.on('data', buffer => {
          const json = buffer.toString('utf-8')
          data = JSON.parse(json)
          resolve(data)
        })
      })

      req.on('error', err => {
        reject(new Error(err))
      })

      req.end()
    })
  }
}

module.exports = new Captcha()
