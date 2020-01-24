const ticketReceivedTxtMsg = require('../../mailer-templates/mail-text-msg/ticketReceived')

module.exports = app => {

    const { Ticket } = app.config.mongooseModels

    const { validateEmail, exists } = app.config.validation

    const { ticketError } = app.config.managementHttpResponse

    const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.mailer

    const save = async (req, res) => {
        try {
            const body = {...req.body}

            exists(body.msg, 'É necessário descrever seu problema para enviar o ticket')
            validateEmail(body.emailUser, 'E-mail inválido, tente fornecer um e-mail válido!')
            
            let op = null

            const user = req.user && req.user.user ? req.user.user : null
            if(!user && type !== 'account-changed') throw 'Acesso negado'

            switch(body.type){
                case 'account-changed':{
                    op = await sendAdvancedAccountProblem(body)
                    if(!op.status) throw 'Ocorreu um erro ao enviar o ticket, por favor tente novamente mais tarde'
                    break
                }
                case 'simple-account-problem':{
                    op = await sendSimpleAccountProblem(body, user)
                    if(!op.status) throw op.msg || 'Ocorreu um erro ao enviar o ticket, por favor tente novamente mais tarde'
                    break
                }
                case 'bug-report':{
                    op = await sendBugReport(body, user)
                    if(!op.status) throw op.msg || 'Ocorreu um erro ao enviar o ticket, por favor tente novamente mais tarde'
                    break

                }
            }
            
            if(op.status) return res.status(204).send()

        } catch (error) {
            error = ticketError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const sendSimpleAccountProblem = async (body, user) => {
        try {
            exists(body.code, 'Código não informado, é necessário informar o código.')
            exists(body.date, 'Data de alteração não informada.')
            
            const ticket = new Ticket({
                type: body.type,
                dateOccurrence: body.date,
                adminId: body.code,
                userId: user._id,
                email: body.emailUser,
                msg: body.msg 
            })

            const response = await ticket.save()

            if(response._id){
                const { htmlPath, variables, textMsg, params, email, subject } = await configEmailTicketReceived(response) 
                await sendEmail(htmlPath, variables, textMsg, params, email, subject)
            }

            return {status: Boolean(response._id)}
        } catch (error) {
            let msg = typeof error === 'string' ? error : 'Ocorreu um erro ao enviar o ticket, por favor tente novamente mais tarde'
            
            if(typeof error !== 'string' && error.errors && error.errors.adminId && error.errors.adminId.name === 'CastError') msg = 'Este é um código inválido, caso esteja inserindo o código corretamente, nos envie um ticket de reporte de bugs'
            
            return {status: false, msg}
        }
    }

    const sendAdvancedAccountProblem = async (body) => {
        let date = body.date ? body.date.split('/') : null

        if(date) {
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

        if(response._id){
            const { htmlPath, variables, textMsg, params, email, subject } = await configEmailTicketReceived(response) 
            await sendEmail(htmlPath, variables, textMsg, params, email, subject)
        }

        return {status: Boolean(response._id)}
    }

    const sendBugReport = async (body, user) => {
        try {

            exists(body.software, 'Informe o software que ocorreu o bug')
            exists(body.device, 'Informe o dispositivo que ocorreu o bug')
            if(body.device === 'celphone - webapp' || body.device === 'computer') exists(body.browser, 'Informe o browser / navegador em que ocorreu o bug')
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

            if(response._id){
                const { htmlPath, variables, textMsg, params, email, subject } = await configEmailTicketReceived(response) 
                await sendEmail(htmlPath, variables, textMsg, params, email, subject)
            }

            return {status: Boolean(response._id)}
        } catch (error) {
            let msg = typeof error === 'string' ? error : 'Ocorreu um erro ao enviar o ticket, por favor tente novamente mais tarde'
            
            return {status: false, msg}
        }
    }

    const sendEmail = async (htmlPath, variables, txtMsgFunction, params, email, subject) => {
        let htmlMsg = app.fs.readFileSync(htmlPath, 'utf8')

        variables.forEach( variable => {
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
            from: `"Agente Coder Mind" <${USER}>`,
            to: email,
            subject: subject,
            text: txtMsgFunction(params),
            html: htmlMsg,
        }
        
        const info = await transporter.sendMail(mail)

        return Boolean(info.messageId)
    }

    const configEmailTicketReceived = (ticket) => {
        const htmlPath = 'mailer-templates/ticketReceived.html'

        const variables = [
            {key: '___id', value: ticket._id},
            {key: '__createdAt', value: `${ticket.createdAt.toLocaleDateString('pt-BR')} ${ticket.createdAt.toLocaleTimeString('pt-BR')}`}
            // {key: '__changeDate', value: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`}
        ]

        const params = {
            _id: ticket._id, 
            createdAt: ticket.createdAt
            // changeDate: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
        }

        const textMsg = ticketReceivedTxtMsg

        const email = ticket.email

        const subject = 'Recebemos seu ticket!'

        const payload = {htmlPath, variables, params, textMsg, email, subject}

        return payload
    }

    return {save}
}