module.exports = app => {

    const { Ticket } = app.config.mongooseModels

    const { validateEmail, exists } = app.config.validation

    const { ticketError } = app.config.managementHttpResponse

    const save = (req, res) => {
        try {
            const body = {...req.body}

            exists(body.msg, 'É necessário descrever seu problema para enviar o ticket')
            validateEmail(body.emailUser, 'E-mail inválido, tente fornecer um e-mail válido!')
            
            if(body.type === 'account-changed'){
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

                ticket.save().then( response => {
                    return res.status(204).send()
                })
            }

        } catch (error) {
            error = ticketError(error)
            return res.status(error.code).send(error.msg)
        }
    }

    return {save}
}