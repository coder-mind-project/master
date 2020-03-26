const nodemailer = require('nodemailer')
const { webApp } = require('../../.env')

module.exports = app => {
  const { Comment, Article, User } = app.config.database.schemas.mongoose

  const { validateLength } = app.config.validation

  const { SMTP_SERVER, PORT, SECURE, USER, PASSWORD } = app.config.smtp.smtpprovider

  const clientUrl = webApp.production

  const get = async (req, res) => {
    try {
      /* Options allowed for type attr:
                option  -   description

                'not-readed'    -   for not readed comments
                'only-readed'   -   for only readed comments
                'all'   -   for all comments
            */
      const type = req.query.type || 'not-readed'
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 100

      const user = req.user.user

      var result = null

      switch (type) {
        case 'all': {
          result = await getAllComments(user, page, limit)
          break
        }
        case 'not-readed': {
          result = await getNotReadedComments(user, page, limit)
          break
        }
        case 'only-readed': {
          result = await getOnlyReadedComments(user, page, limit)
          break
        }
      }

      if (!result) throw 'Ocorreu um erro desconhecido, se persistir reporte'

      if (!result.status) throw result.error

      const comments = result.comments
      const count = result.count

      return res.json({ comments, count, limit })
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  const getNotReadedComments = async (user, page, limit) => {
    try {
      let count = await Comment.aggregate([
        {
          $match: {
            $and: [{ readed: false }, { 'article.author._id': user._id }, { answerOf: null }]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $match: {
            $and: [{ readed: false }, { 'article.author._id': user._id }, { answerOf: null }]
          }
        },
        { $sort: { _id: -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  const getOnlyReadedComments = async (user, page, limit) => {
    try {
      let count = await Comment.aggregate([
        {
          $match: {
            $and: [{ readed: true }, { 'article.author._id': user._id }, { answerOf: null }]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $match: {
            $and: [{ readed: true }, { 'article.author._id': user._id }, { answerOf: null }]
          }
        },
        { $sort: { _id: -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  const getAllComments = async (user, page, limit) => {
    try {
      let count = await Comment.aggregate([
        {
          $match: {
            $and: [{ 'article.author._id': user._id }, { answerOf: null }]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $match: {
            $and: [{ 'article.author._id': user._id }, { answerOf: null }]
          }
        },
        { $sort: { _id: -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  const getOne = async _id => {
    try {
      const comment = await Comment.findOne({ _id })

      return { comment, status: true }
    } catch (error) {
      return { status: false, error }
    }
  }

  const getHistory = async (req, res) => {
    try {
      const _id = req.params.id
      const limit = parseInt(req.query.limit) || 10
      const page = parseInt(req.query.page) || 1

      if (!_id) throw 'Comentário não encontrado'

      const result = await getOne(_id)

      if (!result.status) throw 'Comentário não encontrado'

      const answers = await Comment.aggregate([
        {
          $match: {
            $and: [
              { answerOf: { $ne: null } },
              { 'answerOf._id': { $regex: `${result.comment._id}`, $options: 'i' } }
            ]
          }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      const comment = result.comment
      const count = answers.length

      return res.json({ answers, comment, count, limit })
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  const readComment = (req, res) => {
    try {
      const comment = { ...req.body }

      if (!comment._id) throw 'Comentário não encontrado'

      Comment.updateOne({ _id: comment._id }, comment).then(response => {
        if (response.nModified > 0) {
          return res.status(204).send()
        } else {
          return res.status(410).send('Comentário já esta marcado como lido')
        }
      })
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  const answerComment = (req, res) => {
    try {
      const comment = { ...req.body }
      const user = req.user.user

      validateLength(
        comment.answer,
        3000,
        'bigger',
        'Para o comentário é somente permitido 1000 caracteres'
      )

      const newComment = new Comment({
        userName: user.name,
        userEmail: user.email,
        comment: comment.answer,
        article: comment.article,
        confirmed: true,
        readed: false,
        answerOf: comment
      })

      newComment
        .save()
        .then(async () => {
          if (comment.confirmed) {
            await sendMailNotification(
              comment.userEmail,
              comment.userName,
              comment.article.title,
              comment.article.customURL,
              comment.article.author.name,
              comment.answer,
              comment.comment
            )
          }

          return res.status(201).send('Resposta salva com sucesso')
        })
        .catch(error => {
          throw error
        })
    } catch (error) {
      if (typeof error === 'string') return res.status(400).send(error)
      return res.status(500).send('Ocorreu um erro desconhecido, por favor tente mais tarde')
    }
  }

  const sendMailNotification = async (to, reader, article, urlArticle, author, answer, comment) => {
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
      from: `Mensageiro Coder Mind <${USER}>`,
      to,
      subject: 'Seu comentário foi respondido! - Coder Mind',
      text: `Olá ${reader}, seu comentário no artigo ${article} foi respondido pelo autor ${author}.\n
                    Sua pergunta: \n
                    ${comment}\n
                    Resposta do autor ${author}: \n
                    ${answer}\n
                    Você também pode acessar o artigo abaixo: \n
                    ${clientUrl}/artigos/${urlArticle}`,
      html: `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #444; height: 100vh;">
                    <div style="border: 1px solid #888; border-radius: 15px; padding: 15px; background-color: #fff;">
                        <h1>Coder Mind</h1>
                        <p>Olá <strong>${reader}</strong>, seu comentário no artigo <a href="${clientUrl}/artigos/${urlArticle}" style="color: #f50057; text-decoration: underline; font-weight: 600;">${article}</a> foi respondido pelo autor ${author}.</p>
                        <br>
                        <p>Sua pergunta: </p>
                        <blockquote>
                            ${comment}
                        </blockquote>
                        <p>Resposta do autor ${author}:</p>
                        <blockquote>
                            ${answer}
                        </blockquote>
                        <br>
                        <strong>Você também pode acessar o artigo pelo link:</strong>
                        <br>
                        <a href="${clientUrl}/artigos/${urlArticle}" style="color: #f50057; text-decoration: underline; font-weight: 600;">${clientUrl}/artigos/${urlArticle}</a>
                        <br>
                        <small>Sou um mensageiro digital, por favor não responda este e-mail. =D</small>
                        <br>
                        <small>Caso sinta dúvidas ou deseje reportar algum bug basta entrar em contato no link <a href="${clientUrl}/sobre#contact" style="color: #f50057; text-decoration: underline; font-weight: 600;">${clientUrl}/sobre#contact</a> 
                    </div>
                </div>
            `
    }

    const info = await transporter.sendMail(mail)

    return Boolean(info.messageId)
  }

  const commentsJob = async () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth, 31)

    // Estatísticas para cada usuário da plataforma

    // Obter o arrays de _ids dos usuários
    const users = await User.find({ deleted: false }, { _id: 1 })

    // Percorre o array obtendo as views e inserindo as views no banco SQL
    users.map(async user => {
      const userComments = await Comment.countDocuments({
        created_at: {
          $gte: firstDay,
          $lt: lastDay
        },
        'article.author._id': user.id
      })

      await app.knex('comments').insert({
        month: currentMonth + 1,
        count: userComments,
        year: currentYear,
        reference: user.id
      })
    })

    /* Estatísticas gerais de plataforma */
    const comments = await Comment.countDocuments({
      created_at: {
        $gte: firstDay,
        $lt: lastDay
      },
      answerOf: null
    })

    app
      .knex('comments')
      .insert({ month: currentMonth + 1, count: comments, year: currentYear })
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`**CRON** | comments updated at ${new Date()}`)
      })
  }

  const getStats = async _id => {
    try {
      const comments = await getCommentsStats(_id)
      return { status: true, comments }
    } catch (error) {
      return { status: error, comments: {} }
    }
  }

  const getCommentsStats = async _id => {
    let results = []

    if (_id) {
      results = await app.knex
        .select()
        .from('comments')
        .where('reference', _id)
        .orderBy('id', 'desc')
        .first()
    } else {
      results = await app.knex
        .select()
        .from('comments')
        .whereNull('reference')
        .orderBy('id', 'desc')
        .first()
    }

    return results
  }

  const getCommentsPerArticle = async (article, page, limit) => {
    try {
      if (!page) page = 1
      if (!limit || limit > 100) limit = 10

      const count = await Comment.find({
        'article._id': { $regex: `${article._id}`, $options: 'i' },
        answerOf: null
      }).countDocuments()
      const comments = await Comment.aggregate([
        {
          $match: {
            'article._id': { $regex: `${article._id}`, $options: 'i' },
            answerOf: null
          }
        },
        { $sort: { startRead: -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { status: true, comments, count }
    } catch (error) {
      return { status: false, comments: [], count: 0 }
    }
  }

  const getComments = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      let limit = parseInt(req.query.limit) || 10

      if (limit > 100) limit = 10

      const _id = req.params.id

      const article = await Article.findOne({ _id })

      const result = await getCommentsPerArticle(article, page, limit)

      if (result.status) {
        const comments = result.comments
        const count = result.count

        return res.json({ comments, count })
      } else {
        throw 'Ocorreu um erro ao encontrar os comentários'
      }
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  return {
    get,
    readComment,
    answerComment,
    getHistory,
    commentsJob,
    getStats,
    getCommentsPerArticle,
    getComments
  }
}
