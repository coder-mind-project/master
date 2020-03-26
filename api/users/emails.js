const userChangedTxtMsg = require('../../mailer-templates/mail-text-msg/userChanged')
const userChangedToOldMailTxtMsg = require('../../mailer-templates/mail-text-msg/userChangedToOldMail')
const newAccountTxtMsg = require('../../mailer-templates/mail-text-msg/newAccount')
const emailChangedMyAccountTxtMsg = require('../../mailer-templates/mail-text-msg/emailChangedMyAccount')

const { panel } = require('../../.env')

/**
 *  @function
 *  @module UserEmails
 *  @description Provide functions that send emails about users.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing functions for provide user emails management.
 */
module.exports = app => {
  const { User } = app.config.database.schemas.mongoose
  const { decryptAuth } = app.config.secrets

  const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.smtp.smtpprovider

  /**
   * @function
   * @description Returns email config for simple-change-account event.
   * @param {String} _id - A User identifier (user with changed data)
   * @param {Object} admin - A User Object representation (Admin who changed User data)
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsChangeAccount = async (_id, admin) => {
    const user = await User.findOne({ _id })
    const htmlPath = 'assets/emails/userChanged.html'

    const variables = [
      { key: '__username', value: user.name },
      { key: '__username', value: user.name },
      { key: '__cpf', value: user.cpf },
      { key: '__celphone', value: user.celphone },
      { key: '__email', value: user.email },
      { key: '__password', value: decryptAuth(user.password) },
      { key: '__accessLevel', value: user.tagAdmin ? 'Administrador' : 'Autor' },
      { key: '___idUserAdmin', value: admin._id },
      {
        key: '__changeDate',
        value: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
      }
    ]

    const txtParams = {
      username: user.name,
      cpf: user.cpf,
      celphone: user.celphone,
      email: user.email,
      password: user.password,
      accessLevel: user.tagAdmin ? 'Administrador' : 'Autor',
      _idUserAdmin: admin._id,
      changeDate: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
    }

    const textMsg = userChangedTxtMsg

    const email = user.email

    const subject = 'Seus dados foram alterados!'

    const params = { htmlPath, variables, txtParams, textMsg, email, subject }

    return params
  }

  /**
   * @function
   * @description Returns email config for advanced-change-account event.
   * @param {String} _id - A User identifier (user with changed data)
   * @param {Object} admin - A User Object representation (Admin who changed User data)
   * @param {String} oldEmail - The User old email for notifify change
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsChangeEmailAccount = async (_id, admin, oldEmail) => {
    const user = await User.findOne({ _id })
    const htmlPath = 'mailer-templates/userChangedToOldMail.html'

    const variables = [
      { key: '___url', value: panel.default },
      { key: '___idAdmin', value: admin._id },
      { key: '___idUser', value: user._id },
      { key: '__email', value: oldEmail },
      {
        key: '__date',
        value: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
      },
      { key: '___idAdmin', value: admin._id },
      { key: '___idUser', value: user._id },
      {
        key: '__date',
        value: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
      },
      { key: '__url', value: panel.default }
    ]

    const txtParams = {
      _idAdmin: user.name,
      _idUser: user.name,
      email: admin._id,
      date: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
    }

    const textMsg = userChangedToOldMailTxtMsg

    const email = oldEmail

    const subject = 'Este e-mail foi desvinculado a sua conta!'

    const payload = { htmlPath, variables, txtParams, textMsg, email, subject }

    return payload
  }

  /**
   * @function
   * @description Returns email config to welcome a new user.
   * @param {String} user - A User created
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsWelcomeMsg = user => {
    const password = decryptAuth(user.password)

    const accessLevel = user.tagAdmin ? 'Administrador' : 'Autor'
    const accessLevelPlural = `${accessLevel}es` // Example: Adminitrador + es | Autor + es
    const deleteAccountLink = `${panel.default}/remove-account?uid=${user._id}`

    const htmlPath = 'assets/emails/newAccount.html'

    const variables = [
      { key: '__AccessLevel', value: accessLevelPlural },
      { key: '__email', value: user.email },
      { key: '__password', value: password },
      { key: '__notAcceptAccountLink', value: deleteAccountLink },
      { key: '__AccessLevel', value: accessLevel },
      { key: '__url', value: panel.default },
      { key: '__url', value: panel.default }
    ]

    const txtParams = {
      accessLevel,
      email: user.email,
      password: password,
      notAcceptAccountLink: deleteAccountLink,
      url: panel.default
    }

    const textMsg = newAccountTxtMsg

    const email = user.email

    const subject = 'Seja bem vindo a Coder Mind!'

    const payload = { htmlPath, variables, txtParams, textMsg, email, subject }

    return payload
  }

  /**
   * @function
   * @description Returns email config to confirm a new user email address.
   * @param {String} user - A User Object representation
   * @returns {Object} - A Object containing params for send the proposed email.
   */
  const getParamsChangeMyEmail = user => {
    const htmlPath = 'assets/emails/emailChangedMyAccount.html'

    const variables = [
      { key: '__username', value: user.name },
      { key: '___id', value: user._id },
      { key: '___id', value: user._id },
      { key: '__token', value: user.confirmEmailToken },
      { key: '__token', value: user.confirmEmailToken },
      { key: '__url', value: panel.default },
      { key: '__url', value: panel.default }
    ]

    const textParams = {
      username: user.name,
      _id: user._id,
      token: user.confirmEmailToken,
      url: panel.default
    }

    const textMsg = emailChangedMyAccountTxtMsg

    const email = user.confirmEmail

    const subject = 'Confirmação de e-mail'

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
    const { htmlPath, variables, textMsg, txtParams, email, subject } = params

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

    const { _id, admin, oldEmail, user } = payload

    let params = null
    switch (purpose) {
      case 'simple-change-account': {
        params = await getParamsChangeAccount(_id, admin)
        break
      }
      case 'advanced-change-account': {
        params = await getParamsChangeEmailAccount(_id, admin, oldEmail)
        break
      }
      case 'account-created': {
        params = await getParamsWelcomeMsg(user)
        break
      }
      case 'request-change-email': {
        params = await getParamsChangeMyEmail(user)
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
