const { panel } = require('../../.env')
const rp = require('request-promise')
const nodemailer = require('nodemailer')

const redeemAccountTextMsg = require('../../mailer-templates/mail-text-msg/redeemAccount1.js')
const fs = require('fs')

module.exports = app => {

     // Validações de dados
    const { validateEmail, exists, validateCpf, isEqual, validatePassword } = app.config.validation
    
     // Mongoose Model para usuarios
    const { User } = app.config.database.schemas.mongoose

     // Configurações extras
    const { encryptAuth, encryptToken, decryptToken } = app.config.secrets

    const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.mailer


    const { validateTokenManagement, errorRedeemPassword } = app.config.api.httpResponses

    const { secret_key, uri } = app.config.captcha


    const redeemPerEmail = async (req, res) => {
        try {

            const request = {...req.body}

            const url = `${uri}?secret=${secret_key}&response=${request.response}`
            
            await rp({method: 'POST', uri: url, json: true}).then( response => {
                if(!response.success) throw 'Captcha inválido'
            })
            
            validateEmail(request.email, 'E-mail inválido')

            const user = await User.findOne({email: request.email, deleted: false})

            if(!user) return res.status(200).send('Solicitação enviada com sucesso, caso este endereço de e-mail esteja cadastrado, você receberá uma mensagem contendo mais instruções.')

            const payload = {
                generatedAt: Date.now(),
                expireAt: Date.now() + (1000 * 60 * 60 * 12),
                user: user._id
            }

            const token = await encryptToken(JSON.stringify(payload))

            await User.updateOne({ _id: user._id },{ token })

            const htmlMsg = fs.readFileSync('mailer-templates/redeemAccount1.html', 'utf8').replace('\n', '').replace('__user', user.name).replace('__token', token).replace('__token', token).replace('__url', panel.default).replace('__url', panel.default)

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
                to: request.email,
                subject: 'Recuperação de senha',
                text: redeemAccountTextMsg(user.name, panel.default, token),
                html: htmlMsg,
            }
            
            const info = await transporter.sendMail(mail)

            if(info.messageId) return res.status(200).send('Solicitação enviada com sucesso, caso este endereço de e-mail esteja cadastrado, você receberá uma mensagem contendo mais instruções.')
            else throw 'Ocorreu um erro ao enviar o e-mail'

        } catch (error) {
            error = await errorRedeemPassword(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const redeemPerMoreInformations = async (req, res) => {
        try {
            const request = {...req.body}

            const url = `${uri}?secret=${secret_key}&response=${request.response}`
            
            await rp({method: 'POST', uri: url, json: true}).then( response => {
                if(!response.success) throw 'Captcha inválido'
            })

            validateEmail(request.email, 'É necessário fornecer um endereço de e-mail válido para contato')

            const result = await countAcceptPoints(request)

            if(!result.status) throw result.error
            
            const user = result.user
            
            if(result.value < 8){
                storeRedeemRequest(request).then(() => res.status(200).send('Informações enviadas com sucesso, agora é com a gente! Iremos analisar as informações, aguarde por um feedback no e-mail fornecido.'))
            }else{
                const payload = {
                    generatedAt: Date.now(),
                    expireAt: Date.now() + (1000 * 60 * 60 * 12),
                    user: user._id
                }

                const token = await encryptToken(JSON.stringify(payload))

                await User.updateOne({ _id: user._id },{ token })

                const htmlMsg = fs.readFileSync('mailer-templates/redeemAccount1.html', 'utf8').replace('\n', '').replace('__user', user.name).replace('__token', token).replace('__token', token).replace('__url', panel.default).replace('__url', panel.default)

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
                    to: user.email,
                    subject: 'Recuperação de conta',
                    text: redeemAccountTextMsg(user.name, panel.default, token),
                    html: htmlMsg,
                }
                
                const info = await transporter.sendMail(mail)

                if(info.messageId) return res.status(200).send(`Verificamos suas informações, entre no seu endereço de email: ${user.email} , as próximas instruções estarão por lá =D`)
                else throw 'Ocorreu um erro ao enviar o e-mail'
            }
        } catch (error) {
            error = await errorRedeemPassword(error)
            return res.status(error.code).send(error.msg)
        }
    }

    const countAcceptPoints = async (data) => {
        try {
            const {cpf, celphone, publicProfile, dateBegin} = {...data}
            const user = await User.findOne({cpf})

            if(!user) return {status: true, value: 0, user: null}

            let value = 5
            
            if(user.celphone === celphone) value+=2
            if(user.publicProfile === Boolean(publicProfile === 'yes')) value+=1
            
            if(!dateBegin) return {status: true, value, user}

            const tolerance = (1000 * 60 * 60 * 24 * 30) // 30 days of tolerance
            const correct = Date(dateBegin)
            const correctAnswer = Date(user.created_at)
            
            const diff = correct - correctAnswer
            
            if(diff >= tolerance - tolerance * 2 && diff <= tolerance) value+=1

            return {status: true, value, user}
        } catch (error) {
            return {status: false, error}
        }
    }

    const storeRedeemRequest = (request) => {
        request = {
            contact_email: request.email,
            cpf: request.cpf,
            celphone: request.celphone,
            public_profile: request.publicProfile,
            date_begin: request.dateBegin,
            msg: request.msg
        }

        return app.knex.insert(request).into('redeem_account_requests')
    }

    const validateToken = async (req, res) => {
        try {
            const token = req.body.token

            if(!token) throw 'Token não informado'

            const payload = JSON.parse(await decryptToken(token))

            if(payload.generatedAt > Date.now()) throw 'Token inválido, solicite uma nova recuperação de senha'

            if(payload.expireAt < Date.now()) throw 'Token expirado, solicite uma nova recuperação de senha'

            const _id = payload.user

            const user = await User.findOne({_id, deleted: false},{ _id: 1, name: 1, token: 1})

            if(!user) throw 'Usuário não encontrado'

            if(user.token !== token) throw 'Token inválido, solicite uma nova recuperação de senha'

            res.status(200).send(user)
        } catch (error) {
            error = await validateTokenManagement(error)
            res.status(error.code).send(error.msg) 
        }
    }

    const changePassword = async (req, res) => {
        try {
            const payload = {...req.body}
            
            validatePassword(payload.firstField, 8, 'Insira uma senha válida, de no mínimo 8 caracteres')
            validatePassword(payload.secondField, 8, 'Confirmação de senha inválida, informe no mínimo 8 caracteres')
            
            isEqual(payload.firstField, payload.secondField, 'As senhas não conferem')

            const password = await encryptAuth(payload.firstField)
            const _id = payload.user

            const response = await User.updateOne({_id, deleted: false}, {password, token: null})
            
            if(response.nModified){
                return res.status(200).send('Senha alterada com sucesso, você já pode realizar um novo login')
            }else{
                throw 'Ocorreu um erro ao alterar sua senha, se persistir reporte'
            }

        } catch (error) {
            error = await errorRedeemPassword(error)
            return res.status(error.code).send(error.msg)
        }
    }

    return { redeemPerEmail, redeemPerMoreInformations, validateToken, changePassword }
}