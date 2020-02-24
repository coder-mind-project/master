const { CAPTCHA_SITE_KEY, CAPTCHA_SECRET_KEY } = require('../.env')

/**
 * @function
 * @module catpcha
 * @description Provide captcha service validation.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing public and private keys for validation.
 */
module.exports = app => {
  const url = 'https://www.google.com/recaptcha/api/siteverify'
  const siteKey = CAPTCHA_SITE_KEY
  const secretKey = CAPTCHA_SITE_KEY

  return { siteKey, secretKey, url }
}
