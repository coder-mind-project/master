const { SMTP_SETTINGS } = require('../../config/environment')

/**
 * @function
 * @module SmtpProvider
 * @description Provide SMTP settings for send emails through app object by consign.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} SMTP Settings.
 */
module.exports = app => {
  const { server, user, password, port, secure, receiver } = SMTP_SETTINGS

  const SMTP_SERVER = server
  const PORT = port
  const SECURE = Boolean(secure === 'true') // Boolean values is not parsing in .env file, so this cast are necessary

  const USER = user
  const PASSWORD = password

  const RECEIVER = receiver

  return { SMTP_SERVER, PORT, SECURE, USER, PASSWORD, RECEIVER }
}
