const fs = require('fs')
const nodemailer = require('nodemailer')

const redeemAccountTextMsg = require('../../mailer-templates/mail-text-msg/redeemAccount.js')

const { panel } = require('../../.env')

const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = require('../../config/mailer')()

/**
 *  @function
 *  @module AuthEmails
 *  @description Provide functions that send emails about authentication.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing functions for provide user emails management.
 */
module.exports = app => {
  /**
   * @function
   * @description Returns email config for simple-change-account event.
   * @param {String} _id - A User identifier (user with changed data)
   * @param {Object} admin - A User Object representation (Admin who changed User data)
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsRedeemPerEmail = async (user, token) => {
    const htmlPath = 'mailer-templates/redeemAccount.html'

    const variables = [
      { key: '__user', value: user.name },
      { key: '__token', value: token },
      { key: '__token', value: token },
      { key: '__url', value: panel.default },
      { key: '__url', value: panel.default }
    ]

    const txtParams = {
      user: user.name,
      token,
      url: panel.default
    }

    const textMsg = redeemAccountTextMsg

    const email = user.email

    const subject = 'Recuperação de conta'

    const params = { htmlPath, variables, txtParams, textMsg, email, subject }

    return params
  }

  /**
   * @function
   * @description Dispatch email for recipient user.
   * @param {Object} params - Necessary params for send the email. For more info see the docs.
   * @returns {String} - MessageId's operation, null value if not sent.
   */
  const dispatchEmail = async params => {
    const { htmlPath, variables, textMsg, txtParams, email, subject } = params

    let htmlMsg = fs.readFileSync(htmlPath, 'utf8')

    variables.forEach(variable => {
      htmlMsg = htmlMsg.replace(variable.key, variable.value)
    })

    const transport = {
      host: SMTP_SERVER,
      port: PORT,
      secure: SECURE,
      auth: {
        user: USER,
        pass: PASSWORD
      }
    }

    const transporter = nodemailer.createTransport(transport)

    const mail = {
      from: `"Coder Mind" <${USER}>`,
      to: email,
      subject: subject,
      text: textMsg(txtParams),
      html: htmlMsg
    }

    const info = await transporter.sendMail(mail)

    return Boolean(info.messageId)
  }

  /**
   * @function
   * @description Send an email
   * @param {String} purpose - Reason for sending email.
   * @param {Object} payload - Payload data for sending email, for more informations check documentation.
   */
  const sendEmail = async (purpose, payload) => {
    if (!purpose || typeof purpose !== 'string') return

    const { user, token } = payload

    let params = null
    switch (purpose) {
      case 'redeem-per-email': {
        params = await getParamsRedeemPerEmail(user, token)
        break
      }
      default: {
        return {
          status: false,
          description: 'Purpose not defined'
        }
      }
    }

    if (params) dispatchEmail(params)

    return { status: true }
  }

  return {
    sendEmail
  }
}
