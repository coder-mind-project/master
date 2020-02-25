const { CAPTCHA_URL, CAPTCHA_SITE_KEY, CAPTCHA_SECRET_KEY } = require('../.env')

/**
 * @function
 * @module catpcha
 * @description Provide captcha service validation.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing public and private keys for validation.
 */
module.exports = app => {
  const url = CAPTCHA_URL
  const siteKey = CAPTCHA_SITE_KEY
  const secretKey = CAPTCHA_SECRET_KEY

  return { siteKey, secretKey, url }
}
