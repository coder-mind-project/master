const { SMTP_SETTINGS } = require('../.env')

/**
 * @function
 * @module mailer
 * @description Provide SMTP settings for send emails through app object by consign.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} SMTP Settings.
 */
module.exports = app => {
  const { server, user, passport, port, secure, receiver } = SMTP_SETTINGS

  const SMTP_SERVER = server
  const PORT = port
  const SECURE = secure

  const USER = user
  const PASSWORD = passport

  const RECEIVER = receiver

  return { SMTP_SERVER, PORT, SECURE, USER, PASSWORD, RECEIVER }
}
