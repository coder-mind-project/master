const answerSentTxtMsg = require('../../../assets/emails/puretext/answerSent')
const { webApp } = require('../../../config/environment')

/**
 *  @function
 *  @module UserEmails
 *  @description Provide functions that send emails about article comments.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing functions for provide article comment emails management.
 */
module.exports = app => {
  const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.smtp.smtpprovider

  /**
   * @function
   * @description Returns email config to notify that the comment has been answered.
   * @param {String} user - A User Object representation
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsAnswerSent = (comment, answer) => {
    const htmlPath = 'assets/emails/answerSent.html'

    const reader = {
      name: comment.userName || 'Leitor',
      email: comment.userEmail
    }
    const author = answer.userName
    const article = {
      title: comment.article.title,
      customUrl: `${webApp.default}/artigos/${comment.article.customURL}`
    }

    const variables = [
      { key: '__user', value: reader.name },
      { key: '__author', value: author },
      { key: '__article', value: article.title },
      { key: '__url', value: article.customUrl }
    ]

    const textParams = {
      user: reader.name,
      author,
      article: article.title,
      url: article.customUrl
    }

    const textMsg = answerSentTxtMsg

    const email = reader.email

    const subject = 'Seu comentário foi respondido'

    const payload = { htmlPath, variables, textParams, textMsg, email, subject }

    return payload
  }

  /**
   * @function
   * @description Dispatch email for recipient user.
   * @param {Object} params - Necessary params for send the email. For more info see the docs.
   * @returns {String} - MessageId's operation, null value if not sent.
   */
  const dispatchEmail = async params => {
    const { htmlPath, variables, textMsg, textParams, email, subject } = params

    let htmlMsg = app.fs.readFileSync(htmlPath, 'utf8')

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

    const transporter = app.nodemailer.createTransport(transport)

    const mail = {
      from: `"Coder Mind" <${USER}>`,
      to: email,
      subject: subject,
      text: textMsg(textParams),
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

    const { comment, answer } = payload

    let params = null
    switch (purpose) {
      case 'answer-sent': {
        params = await getParamsAnswerSent(comment, answer)
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
