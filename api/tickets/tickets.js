const ticketReceivedTxtMsg = require('../../mailer-templates/mail-text-msg/ticketReceived')
const ticketAnsweredTxtMsg = require('../../mailer-templates/mail-text-msg/ticketAnswered')

/**
 *  @function
 *  @module Tickets
 *  @description Manage tickets.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing some functions for manage tickets.
 */
module.exports = app => {
  const { Ticket } = app.config.database.schemas.mongoose

  const { validateEmail, exists } = app.config.validation

  const { ticketError } = app.api.responses

  const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.smtp.smtpprovider

  /**
   * @function
   * @description Get tickets.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} limit - Limit tickets per page.
   * @middlewareParams {String} tid - String of ticket object id representation, see the docs for more details.
   * @middlewareParams {String} type - Type of ticket, see the docs for review all types.
   * @middlewareParams {Number} page - Current page.
   * @middlewareParams {Date} begin - Begin date of ticket create.
   * @middlewareParams {Date} end - End date of ticket create.
   * @middlewareParams {String} order - Order of tickets results. Default ascending, see the docs for reviews all types.
   *
   * @returns {Array<Ticket>} List of tickets, see the docs for more details.
   */
  const get = async (req, res) => {
    try {
      let limit = parseInt(req.query.limit) || 10
      const tid = req.query.tid || null
      const type = req.query.type || null
      const page = req.query.page || 1
      const begin = req.query.begin
        ? new Date(req.query.begin)
        : new Date(new Date().setFullYear(new Date().getFullYear() - 100))
      const end = req.query.end
        ? new Date(req.query.end)
        : new Date(new Date().setFullYear(new Date().getFullYear() + 100))
      const order = req.query.order || null

      if (limit > 100) limit = 10

      let count = await Ticket.aggregate([
        {
          $match: {
            $and: [
              {
                _id: app.mongo.Types.ObjectId.isValid(tid) ? app.mongo.Types.ObjectId(tid) : tid || { $ne: null }
              },
              { type: type || { $ne: null } },
              {
                createdAt: {
                  $gte: begin,
                  $lte: end
                }
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      Ticket.aggregate([
        {
          $match: {
            $and: [
              {
                _id: app.mongo.Types.ObjectId.isValid(tid) ? app.mongo.Types.ObjectId(tid) : tid || { $ne: null }
              },
              { type: type || { $ne: null } },
              {
                createdAt: {
                  $gte: begin,
                  $lte: end
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'adminId',
            foreignField: '_id',
            as: 'admin'
          }
        },
        {
          $project: {
            content: {
              readed: '$readed',
              type: '$type',
              dateOccurrence: '$dateOccurrence',
              adminId: '$adminId',
              userId: '$userId',
              email: '$email',
              msg: '$msg',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            },
            user: { $arrayElemAt: ['$user', 0] },
            admin: { $arrayElemAt: ['$admin', 0] },
            responses: '$responses'
          }
        },
        {
          $unwind: { path: '$responses', preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            content: 1,
            user: 1,
            admin: 1,
            response: '$responses',
            responseAdminId: { $toObjectId: '$responses.adminId' },
            responseUserId: { $toObjectId: '$responses.userId' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'responseAdminId',
            foreignField: '_id',
            as: 'response.admin'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'responseUserId',
            foreignField: '_id',
            as: 'response.user'
          }
        },
        {
          $group: {
            _id: '$_id',
            content: { $first: '$content' },
            user: { $first: '$user' },
            admin: { $first: '$admin' },
            responses: {
              $push: {
                $cond: {
                  if: { $anyElementTrue: [['$response.index']] },
                  then: {
                    index: '$response.index',
                    adminId: '$response.adminId',
                    userId: '$response.userId',
                    createdAt: '$response.createdAt',
                    msg: '$response.msg',
                    admin: { $arrayElemAt: ['$response.admin', 0] },
                    user: { $arrayElemAt: ['$response.user', 0] }
                  },
                  else: null
                }
              }
            }
          }
        },
        {
          $project: {
            content: 1,
            user: 1,
            admin: 1,
            responses: {
              $cond: {
                if: { $anyElementTrue: [[{ $arrayElemAt: ['$responses', 0] }]] },
                then: '$responses',
                else: null
              }
            }
          }
        },
        {
          $sort: { 'content.createdAt': !order || order === 'desc' ? -1 : 1 }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)
        .then(tickets => res.json({ tickets, count, limit }))
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Middleware to get only one ticket by id.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} tid - String of ticket object id representation, see the docs for more details.
   * @returns {Ticket} A ticket.
   */
  const getOne = async (req, res) => {
    try {
      const _id = req.params.id

      const { status, ticket, error } = await getById(_id)

      if (!status && typeof error === 'string') {
        throw {
          name: 'id',
          description: error
        }
      }

      return res.json(ticket)
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get a ticket by ID.
   * @param {String} _id
   *
   * @returns {Object} Contains indicators of operations and the ticket.
   */
  const getById = async _id => {
    try {
      const tickets = await Ticket.aggregate([
        {
          $match: {
            _id: app.mongo.Types.ObjectId.isValid(_id) ? app.mongo.Types.ObjectId(_id) : null
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'adminId',
            foreignField: '_id',
            as: 'admin'
          }
        },
        {
          $project: {
            content: {
              readed: '$readed',
              type: '$type',
              dateOccurrence: '$dateOccurrence',
              adminId: '$adminId',
              userId: '$userId',
              email: '$email',
              msg: '$msg',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            },
            user: { $arrayElemAt: ['$user', 0] },
            admin: { $arrayElemAt: ['$admin', 0] },
            responses: '$responses'
          }
        },
        {
          $unwind: { path: '$responses', preserveNullAndEmptyArrays: true }
        },
        {
          $project: {
            content: 1,
            user: 1,
            admin: 1,
            response: '$responses',
            responseAdminId: { $toObjectId: '$responses.adminId' },
            responseUserId: { $toObjectId: '$responses.userId' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'responseAdminId',
            foreignField: '_id',
            as: 'response.admin'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'responseUserId',
            foreignField: '_id',
            as: 'response.user'
          }
        },
        {
          $group: {
            _id: '$_id',
            content: { $first: '$content' },
            user: { $first: '$user' },
            admin: { $first: '$admin' },
            responses: {
              $push: {
                $cond: {
                  if: { $anyElementTrue: [['$response.index']] },
                  then: {
                    index: '$response.index',
                    adminId: '$response.adminId',
                    userId: '$response.userId',
                    createdAt: '$response.createdAt',
                    msg: '$response.msg',
                    admin: { $arrayElemAt: ['$response.admin', 0] },
                    user: { $arrayElemAt: ['$response.user', 0] }
                  },
                  else: null
                }
              }
            }
          }
        },
        {
          $project: {
            content: 1,
            user: 1,
            admin: 1,
            responses: {
              $cond: {
                if: { $anyElementTrue: [[{ $arrayElemAt: ['$responses', 0] }]] },
                then: '$responses',
                else: null
              }
            }
          }
        }
      ])

      if (tickets.length === 0) {
        throw 'Ticket não encontrado'
      }
      return { status: true, ticket: tickets[0] }
    } catch (error) {
      return { status: false, ticket: null, error }
    }
  }
  /**
   * @function
   * @description Get only tickets not readed.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} limit - Limit tickets per page.
   * @middlewareParams {String} order - Order of tickets results. Default ascending, see the docs for reviews all types.
   */
  const getOnlyNotReaded = async (req, res) => {
    try {
      let limit = parseInt(req.query.limit) || 5
      const order = req.query.order || null

      if (limit > 10) limit = 5

      const count = await Ticket.countDocuments({ readed: false })

      Ticket.aggregate([
        {
          $match: { readed: false }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'adminId',
            foreignField: '_id',
            as: 'admin'
          }
        },
        {
          $project: {
            content: {
              readed: '$readed',
              type: '$type',
              dateOccurrence: '$dateOccurrence',
              userId: '$userId',
              email: '$email',
              msg: '$msg',
              software: '$software',
              device: '$device',
              browser: '$browser',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            },
            user: { $arrayElemAt: ['$user', 0] },
            admin: { $arrayElemAt: ['$admin', 0] }
          }
        },
        {
          $sort: { 'content.createdAt': order === 'asc' ? 1 : -1 }
        }
      ])
        .limit(limit)
        .then(tickets => res.json({ count, tickets }))
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Save a ticket.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Object} Localizated in Body request, must contain different attributes according to with type attribute.
   */
  const save = async (req, res) => {
    try {
      const body = { ...req.body }

      exists(body.msg, {
        name: 'msg',
        description: 'É necessário descrever seu problema para enviar o ticket'
      })
      validateEmail(body.emailUser, {
        name: 'email',
        description: 'E-mail inválido, tente fornecer um e-mail válido'
      })

      const user = req.user && req.user.user ? req.user.user : null
      if (!user && body.type !== 'account-changed') {
        throw {
          name: 'unauthorized',
          description: 'Acesso negado'
        }
      }

      let op = null
      switch (body.type) {
        case 'account-changed': {
          op = await saveAdvancedAccountProblem(body)
          break
        }
        case 'simple-account-problem': {
          op = await saveSimpleAccountProblem(body, user)
          break
        }
        case 'bug-report': {
          op = await saveBugReport(body, user)
          break
        }
        case 'improvement-suggestion': {
          op = await saveImprovementSuggestion(body, user)
          break
        }
        default: {
          throw {
            name: 'ticketType',
            description: 'Informe um tipo de ticket válido'
          }
        }
      }

      return op.status ? res.status(201).send() : { name: 'ticketType', description: op.msg }
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Save a ticket like simple-account-problem.
   * @param {Object} body - A request body from save middleware.
   * @param {Object} user - A request user from save middleware.
   *
   * @returns {Object} A Object containing status of operation.
   */
  const saveSimpleAccountProblem = async (body, user) => {
    try {
      exists(body.code, {
        name: 'code',
        description: 'Código não informado, é necessário informar o código'
      })
      exists(body.date, {
        name: 'date',
        description: 'Data de alteração não informada'
      })

      const ticket = new Ticket({
        type: body.type,
        dateOccurrence: body.date,
        adminId: body.code,
        userId: user._id,
        email: body.emailUser,
        msg: body.msg
      })

      const response = await ticket.save()

      if (response._id) {
        const op = configEmailTicket(response)
        if (!op.status) throw { name: 'configMail', description: op.stack.msg || op.stack }
        const { htmlPath, variables, textMsg, params, email, subject } = op.payload
        await sendEmail(htmlPath, variables, textMsg, params, email, subject)
      }

      return { status: Boolean(response._id) }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Save a ticket like advanced-account-problem.
   * @param {Object} body - A request body from save middleware.
   *
   * @returns {Object} A Object containing status of operation.
   */
  const saveAdvancedAccountProblem = async body => {
    try {
      let date = body.date ? body.date.split('/') : null

      if (date) {
        date = `${date[1]}-${date[0]}-${date[2]}`
        date = new Date(new Date(date).setUTCHours(-1))
      }

      const ticket = new Ticket({
        type: body.type,
        dateOccurrence: date,
        adminId: body.firstCode,
        userId: body.secondCode,
        email: body.emailUser,
        msg: body.msg
      })

      const response = await ticket.save()

      if (response._id) {
        const op = configEmailTicket(response)
        if (!op.status) throw { name: 'configMail', description: op.stack.msg || op.stack }
        const { htmlPath, variables, textMsg, params, email, subject } = op.payload
        await sendEmail(htmlPath, variables, textMsg, params, email, subject)
      }

      return { status: Boolean(response._id) }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Save a ticket like bug-report.
   * @param {Object} body - A request body from save middleware.
   * @param {Object} user - A request user from save middleware.
   *
   * @returns {Object} A Object containing status of operation.
   */
  const saveBugReport = async (body, user) => {
    try {
      exists(body.software, {
        name: 'software',
        description: 'Informe o software que ocorreu o bug'
      })

      exists(body.device, {
        name: 'device',
        description: 'Informe o dispositivo que ocorreu o bug'
      })

      if (body.device === 'celphone - webapp' || body.device === 'computer') {
        exists(body.browser, {
          name: 'browser',
          description: 'Informe o browser / navegador em que ocorreu o bug'
        })
      }

      const ticket = new Ticket({
        type: body.type,
        dateOccurrence: body.date,
        userId: user._id,
        email: body.emailUser,
        msg: body.msg,
        software: body.software,
        device: body.device,
        browser: body.browser,
        anotherBrowser: body.anotherBrowser
      })

      const response = await ticket.save()

      if (response._id) {
        const op = configEmailTicket(response)
        if (!op.status) throw { name: 'configMail', description: op.stack.msg || op.stack }
        const { htmlPath, variables, textMsg, params, email, subject } = op.payload
        await sendEmail(htmlPath, variables, textMsg, params, email, subject)
      }

      return { status: Boolean(response._id) }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Save a ticket like improvement-suggestion.
   * @param {Object} body - A request body from save middleware.
   * @param {Object} user - A request user from save middleware.
   *
   * @returns {Object} A Object containing status of operation.
   */
  const saveImprovementSuggestion = async (body, user) => {
    try {
      exists(body.software, {
        name: 'software',
        description: 'Informe o local em que deseja a melhoria'
      })

      const ticket = new Ticket({
        type: body.type,
        userId: user._id,
        email: body.emailUser,
        msg: body.msg
      })

      const response = await ticket.save()

      if (response._id) {
        const op = configEmailTicket(response)
        if (!op.status) throw { name: 'configMail', description: op.stack.msg || op.stack }
        const { htmlPath, variables, textMsg, params, email, subject } = op.payload
        await sendEmail(htmlPath, variables, textMsg, params, email, subject)
      }

      return { status: Boolean(response._id) }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Send emails provided by Ticket module.
   * @param {String} htmlPath - Path of html template.
   * @param {Object} variables - A object containing variables of html template.
   * @param {Function} txtMsgFunction - A JS function returning string containing pure text template.
   * @param {Object} params - A object containing variables of pure text template.
   * @param {String} email - Email address destination.
   * @param {String} subject - Email subject.
   *
   * @returns {Object} A Object containing status of operation.
   */
  const sendEmail = async (htmlPath, variables, txtMsgFunction, params, email, subject) => {
    try {
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
        text: txtMsgFunction(params),
        html: htmlMsg
      }

      const info = await transporter.sendMail(mail)

      return { status: Boolean(info.messageId) }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Generate params to sendMail function.
   * @param {Ticket} ticket - Ticket model.
   *
   * @returns {Object} Params to sendMail function.
   */
  const configEmailTicket = (ticket, answer = null) => {
    try {
      const htmlPath = answer ? 'assets/emails/ticketAnswered.html' : 'assets/emails/ticketReceived.html'

      const variables = getEmailVariables(ticket, answer)

      const params = getEmailParams(ticket, answer)

      const textMsg = answer ? ticketAnsweredTxtMsg : ticketReceivedTxtMsg

      const email = ticket.email

      const subject = answer ? 'Seu ticket foi respondido!' : 'Recebemos seu ticket!'

      const payload = { htmlPath, variables, params, textMsg, email, subject }

      return { status: true, payload }
    } catch (error) {
      const stack = ticketError(error)
      return { status: false, stack }
    }
  }

  /**
   * @function
   * @description Generate email variables for configEmailTicket function.
   * @param {Ticket} ticket - Ticket model.
   * @param {String} answer - Determines if the ticket is answered or received.
   * Omit to define received ticket, set to define answered ticket.
   *
   * @returns {Array<Object>} Variables to configEmailTicket function.
   */
  const getEmailVariables = (ticket, answer) => {
    const isAnswer = Boolean(answer)

    const answered = [
      { key: '__ticket', value: ticket.id },
      { key: '__answer', value: `" ${answer} "` }
    ]

    const received = [
      { key: '___id', value: ticket._id },
      {
        key: '__createdAt',
        value: `${ticket.createdAt.toLocaleDateString('pt-BR')} ${ticket.createdAt.toLocaleTimeString('pt-BR')}`
      }
    ]

    return isAnswer ? answered : received
  }

  /**
   * @function
   * @description Generate email params for configEmailTicket function.
   * @param {Ticket} ticket - Ticket model.
   * @param {String} answer - Determines if the ticket is answered or received.
   * Omit to define received ticket, set to define answered ticket.
   *
   * @returns {Object} Params to configEmailTicket function.
   */
  const getEmailParams = (ticket, answer) => {
    const isAnswer = Boolean(answer)

    const received = {
      _id: ticket._id,
      createdAt: ticket.createdAt
    }

    const answered = {
      ticket: ticket.id,
      answer: `" ${answer} "`
    }

    return isAnswer ? answered : received
  }

  /**
   * @function
   * @description Push an answer in ticket responses.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - String of ticket object id representation, see the docs for more details.
   * @middlewareParams {Object} Localizated in Body request, must contain response and sendMail attributes.
   *
   * @returns {Object} The updated ticket.
   */
  const answerTicket = async (req, res) => {
    try {
      const _id = req.params.id
      const msg = req.body.response
      const send = req.body.sendEmail || false

      exists(msg, {
        name: 'response',
        description: 'É necessário informar uma resposta'
      })

      let ticket = await Ticket.findOne({ _id })

      if (!ticket) {
        throw {
          name: 'id',
          description: 'Ticket não encontrado'
        }
      }

      const response = {
        index: ticket.responses.length + 1,
        adminId: req.user.user._id,
        createdAt: new Date(),
        msg
      }

      const responses = ticket.responses

      responses.push(response)

      const r = await Ticket.updateOne({ _id }, { responses })

      if (r.nModified === 0) {
        throw {
          name: 'pushResponse',
          description: 'Houve um problema para salvar a sua resposta, por favor tente novamente mais tarde'
        }
      }

      const payload = await getById(_id)

      if (!payload.status && typeof payload.error === 'string') {
        throw {
          name: 'id',
          description: payload.error
        }
      }

      ticket = payload.ticket

      if (send) {
        const { htmlPath, variables, textMsg, params, email, subject } = configEmailTicket(ticket, msg)
        await sendEmail(htmlPath, variables, textMsg, params, email, subject)
      }

      return res.json(ticket)
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Set a flag to indicate that tickets has been readed.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - String of ticket object id representation, see the docs for more details.
   *
   * @returns {Object} The updated ticket.
   */
  const readTicket = (req, res) => {
    try {
      const _id = req.params.id

      if (!app.mongo.Types.ObjectId.isValid(_id)) {
        throw {
          name: 'ticket',
          description: 'Ticket não encontrado'
        }
      }

      Ticket.updateOne({ _id }, { readed: true }).then(async () => {
        const ticket = await Ticket.findOne({ _id })

        if (!ticket) {
          throw {
            name: 'ticket',
            description: 'Ticket não encontrado'
          }
        }

        return res.json(ticket)
      })
    } catch (error) {
      const stack = ticketError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { save, get, getOne, getOnlyNotReaded, answerTicket, readTicket }
}
