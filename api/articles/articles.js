const Image = require('../../config/serialization/images.js')
const MyDate = require('../../config/Date')

/**
 * @function
 * @module Articles
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { Article } = app.config.database.schemas.mongoose
  const { exists } = app.config.validation
  const { errorManagementArticles, articleError } = app.api.responses

  const { getLikesPerArticle } = app.api.articles.likes.likes
  const { getViewsPerArticle } = app.api.articles.views.views
  const { getCommentsPerArticle } = app.api.articles.comments

  /**
   * @function
   * @description Create an article
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A object containing the article created
   */
  const create = async (req, res) => {
    try {
      const { title } = req.body
      const { user } = req.user

      exists(title, {
        name: 'title',
        description: 'É necessário incluir um titulo ao artigo'
      })

      const article = new Article({
        title,
        userId: user._id
      })

      const result = await article.save()

      const createdArticle = {
        ...result._doc,
        author: user
      }
      delete createdArticle.userId

      return res.status(201).send(createdArticle)
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Validate article fields for save him
   * @param {Object} article - Article object candidate
   * @param {String} id - The Article ObjectId
   * @param {Object} user - The user that change the article, generally its provided by request
   *
   * @returns {Object} Formated/validated article object
   */
  const validateFields = async (article, id, user) => {
    if (Object.prototype.hasOwnProperty.call(article, 'title') && !article.title) {
      throw {
        name: 'title',
        description: 'É necessário incluir um titulo ao artigo'
      }
    }

    if (Object.prototype.hasOwnProperty.call(article, 'customUri') && !article.customUri) {
      throw {
        name: 'customUri',
        description: 'É necessário incluir um endereço personalizado válido'
      }
    }

    const currentArticle = await Article.findOne({ _id: id })

    if (user._id !== currentArticle.userId) {
      throw {
        name: 'forbidden',
        description: 'Não é possível alterar o artigo de outro autor'
      }
    }

    if (article.categoryId && !currentArticle.themeId) {
      throw {
        name: 'categoryId',
        description: 'É necessário adicionar um tema antes de incluir uma categoria'
      }
    }

    if (article.customUri) article.customUri = article.customUri.replace(/ /g, '')
    delete article.userId
    delete article.state
    delete article.logoImg
    delete article.secondaryImg
    delete article.headerImg

    return article
  }

  /**
   * @function
   * @description Save an article
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A object containing the article updated
   */
  const save = async (req, res) => {
    try {
      const { id } = req.params
      const { user } = req.user
      let article = req.body

      article = await validateFields(article, id, user)

      await Article.updateOne({ _id: id }, article)

      return res.status(204).send()
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get a list of articles
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `order` - Ordination of article results
   * @middlewareParams {String} `type` - Define between user articles and all articles.
   * It will depend of user level access, for more information @see https://docs.codermind.com.br/docs/master/about.html
   * @middlewareParams {String} `query` - Keyword to filter articles, will be filtered by `title`, `description` and `content`
   * @middlewareParams {String} `page` - Current article list page
   * @middlewareParams {String} `limit` - Current article limit on page
   * @middlewareParams {String} `tId` - Theme identifier, used for filter by specified theme
   * @middlewareParams {String} `cId` - Category identifier, used for filter by specified category
   *
   * @returns {Object} A object containing the `articles`, `count` and `limit` defined
   */
  const get = async (req, res) => {
    try {
      const { user } = req.user

      let { limit, page, query, tId, cId, type, order } = req.query

      order = order || 'desc'
      type = type || 'personal'
      query = query || ''
      page = parseInt(page) || 1
      limit = parseInt(limit) || 6

      if (page < 1) page = 1
      if (limit > 100) limit = 6

      let count = await Article.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { title: { $regex: `${query}`, $options: 'i' } },
                  { description: { $regex: `${query}`, $options: 'i' } },
                  { content: { $regex: `${query}`, $options: 'i' } }
                ]
              },
              {
                themeId: tId && app.mongo.Types.ObjectId.isValid(tId) ? app.mongo.Types.ObjectId(tId) : { $ne: -1 },
                categoryId: cId && app.mongo.Types.ObjectId.isValid(cId) ? app.mongo.Types.ObjectId(cId) : { $ne: -1 }
              },
              {
                state: { $ne: 'removed' },
                userId: type === 'all' && user.tagAdmin ? { $ne: null } : app.mongo.Types.ObjectId(user._id)
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      Article.aggregate([
        {
          $lookup: {
            from: 'themes',
            localField: 'themeId',
            foreignField: '_id',
            as: 'theme'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $match: {
            $and: [
              {
                $or: [
                  { title: { $regex: `${query}`, $options: 'i' } },
                  { description: { $regex: `${query}`, $options: 'i' } },
                  { content: { $regex: `${query}`, $options: 'i' } }
                ]
              },
              {
                themeId: tId && app.mongo.Types.ObjectId.isValid(tId) ? app.mongo.Types.ObjectId(tId) : { $ne: -1 },
                categoryId: cId && app.mongo.Types.ObjectId.isValid(cId) ? app.mongo.Types.ObjectId(cId) : { $ne: -1 }
              },
              {
                state: { $ne: 'removed' },
                userId: type === 'all' && user.tagAdmin ? { $ne: null } : app.mongo.Types.ObjectId(user._id)
              }
            ]
          }
        },
        {
          $project: {
            themeId: 0,
            categoryId: 0,
            userId: 0
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            state: 1,
            theme: { $arrayElemAt: ['$theme', 0] },
            category: { $arrayElemAt: ['$category', 0] },
            author: { $arrayElemAt: ['$author', 0] },
            logoImg: 1,
            secondaryImg: 1,
            headerImg: 1,
            contentType: 1,
            content: 1,
            socialVideoType: 1,
            socialVideo: 1,
            socialRepositoryType: 1,
            socialRepository: 1,
            customUri: 1,
            removedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            inactivatedAt: 1,
            publishedAt: 1,
            boostedAt: 1
          }
        },
        {
          $project: {
            'author.password': 0,
            'author.confirmEmail': 0,
            'author.confirmEmailToken': 0,
            'author.lastEmailTokenSendAt': 0
          }
        },
        { $sort: { createdAt: order === 'asc' ? 1 : -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)
        .then(articles => res.json({ articles, count, limit }))
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  const getOneById = async (req, res) => {
    const _id = req.params.id
    const article = await getById(_id)

    if (article && article.error) return res.status(500).send()

    if (article && article._id) return res.json(article)
    else return res.status(404).send('Nenhum artigo encontrado')
  }

  const getById = _id => {
    /* Obtem o artigo pelo ID */

    try {
      return Article.findOne({ _id })
    } catch (error) {
      return { error: true }
    }
  }

  const getOne = async (req, res) => {
    /* Middleware responsável por obter o artigo pela URL customizada */
    const customURL = req.params.url

    const article = await getByCustomURL(customURL)

    if (article && article.error) {
      return res.status(500).send('Ocorreu um erro desconhecido, se persistir reporte')
    }

    if (!req.user.user.tagAdmin && article.author._id !== req.user.user._id) {
      return res.status(403).send('Este artigo não é seu, acesso negado')
    }

    if (article && article._id) return res.json(article)
    else return res.status(404).send('Nenhum artigo encontrado')
  }

  const getByCustomURL = customURL => {
    /* Obtém o artigo pela URL customizada */

    try {
      return Article.findOne({ customURL })
    } catch (error) {
      return { error: true }
    }
  }

  const remove = async (req, res) => {
    /* Remove o artigo */

    const id = req.params.id

    try {
      if (!id) throw 'Artigo não encontrado'

      const article = await Article.findOne({ _id: id })

      if (!article._id) throw 'Artigo não encontrado'
      if (article.published) {
        throw 'Artigos publicados não podem ser removidos, considere inativar o artigo'
      }

      const change = {
        deleted: true
      }

      Article.updateOne({ _id: id }, change).then(() => res.status(204).send())
    } catch (error) {
      const stack = await errorManagementArticles(error)
      return res.status(stack.code).send(stack.msg)
    }
  }

  const management = async (req, res) => {
    /*
            Realiza o gerenciamento de artigos
            Isto é, realiza a publicação, impulsionamento, inativação e
            ativação dos artigos respectivamente.
        */

    const id = req.params.id
    const operation = req.query.op || 'Operação não identificada'

    try {
      if (!id) throw 'Artigo não encontrado'

      let result = false

      switch (operation) {
        case 'publish':
          result = await publish(id)
          break
        case 'boost':
          result = await boost(id)
          break
        case 'inactive':
          result = await inactive(id)
          break
        case 'active':
          result = await active(id)
          break
        default:
          throw 'Nenhum método definido, consulte a documentação'
      }

      if (!result._id) throw result

      return res.json(result)
    } catch (error) {
      const stack = await errorManagementArticles(error)
      return res.status(stack.code).send(stack.msg)
    }
  }

  const pushImage = async (req, res) => {
    /* Realiza o envio da(s) imagem(ns) do artigo */

    try {
      const _id = req.params.id

      if (!_id) throw 'Artigo não encontrado'

      let path = ''

      switch (req.method) {
        case 'POST': {
          path = 'smallImg'
          break
        }
        case 'PATCH': {
          path = 'mediumImg'
          break
        }
        case 'PUT': {
          path = 'bigImg'
          break
        }
      }

      if (!path) {
        throw 'Verbo não aceitável para este recurso, é razoável consultar a documentação'
      }

      const article = await Article.findOne({ _id })

      if (!article) throw 'Artigo não encontrado'

      const currentDirectory = article[path] || ''
      const size = parseInt(req.query.size) || 512

      if (req.file) {
        Image.compressImage(req.file, size, currentDirectory).then(async newPath => {
          const change = {
            [path]: newPath
          }
          await Article.updateOne({ _id }, change)

          return res.status(200).send(newPath)
        })
      } else {
        throw 'Ocorreu um erro ao salvar a imagem, se persistir reporte'
      }
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  const removeImage = async (req, res) => {
    /* Realiza a remoção da(s) imagem(ns) do artigo */

    const _id = req.params.id
    const path = req.query.path

    try {
      if (path !== 'smallImg' && path !== 'mediumImg' && path !== 'bigImg') {
        throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
      }

      const article = await Article.findOne({ _id })
      if (!article) throw 'Artigo não encontrado'

      if (!article[path]) throw 'Este artigo não possui imagem'

      Image.removeImage(article[path]).then(async resp => {
        if (resp) {
          const update = await Article.updateOne({ _id }, { [path]: '' })
          if (update.nModified > 0) return res.status(204).send()
          else {
            throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
          }
        } else {
          throw 'Ocorreu um erro ao remover a imagem, se persistir reporte'
        }
      })
    } catch (msg) {
      return res.status(400).send(msg)
    }
  }

  const publish = async _id => {
    /*  Habilita a flag de publish do artigo
            e desabilita todas as outras
        */

    try {
      const article = await Article.findOne({ _id })

      if (!article._id) throw 'Artigo não encontrado'
      if (article.deleted) {
        throw 'Esse artigo esta excluído, não é possível publicá-lo'
      }
      if (article.published) throw 'Esse artigo já está publicado'

      const change = {
        published: true,
        boosted: false,
        deleted: false,
        inactivated: false,
        publishAt: MyDate.setTimeZone('-3')
      }

      const updatedArticle = await Article.updateOne({ _id }, change).then(async () => {
        return await Article.findOne({ _id })
      })

      return updatedArticle
    } catch (error) {
      if (typeof error !== 'string' && error.name === 'CastError') {
        return 'O id não foi reconhecido, forneça um identificador válido'
      }

      return error
    }
  }

  const boost = async _id => {
    /*  Habilita as flags de publish e boosted do artigo
            e desabilita todas as outras
        */

    try {
      const article = await Article.findOne({ _id })

      if (!article._id) throw 'Artigo não encontrado'
      if (article.inactivated) {
        throw 'Este artigo está inativo, não é possível impulsioná-lo'
      }
      if (article.deleted) {
        throw 'Este artigo está excluído, não é possível impulsioná-lo'
      }
      if (article.boosted) throw 'Este artigo já está impulsionado'
      if (!article.published) {
        throw 'Este artigo não está publicado, publique-o primeiro'
      }

      const change = {
        published: true,
        boosted: true,
        deleted: false,
        inactivated: false
      }

      const updatedArticle = await Article.updateOne({ _id }, change).then(async () => {
        return await Article.findOne({ _id })
      })

      return updatedArticle
    } catch (error) {
      if (typeof error !== 'string' && error.name === 'CastError') {
        return 'O id não foi reconhecido, forneça um identificador válido'
      }

      return error
    }
  }

  const inactive = async _id => {
    /* Habilita a flag de inativo do artigo e desabilita todas as outras */

    try {
      const article = await Article.findOne({ _id })

      if (!article._id) throw 'Artigo não encontrado'
      if (article.deleted) {
        throw 'Esse artigo esta excluído, não é possível inativá-lo'
      }
      if (!article.published) {
        throw 'Este artigo não está publicado, considere removê-lo'
      }

      const change = {
        published: true,
        boosted: false,
        deleted: false,
        inactivated: true
      }

      const updatedArticle = await Article.updateOne({ _id }, change).then(async () => {
        return await Article.findOne({ _id })
      })

      return updatedArticle
    } catch (error) {
      if (typeof error !== 'string' && error.name === 'CastError') {
        return 'O id não foi reconhecido, forneça um identificador válido'
      }

      return error
    }
  }

  const active = async _id => {
    /*  Reseta todas as flags do artigo, dando o status identico a artigos
            recém criados
        */

    try {
      const article = await Article.findOne({ _id })

      if (!article._id) throw 'Artigo não encontrado'
      if (article.active) throw 'Este artigo já está ativo'

      const change = {
        published: false,
        boosted: false,
        deleted: false,
        inactivated: false
      }

      const updatedArticle = await Article.updateOne({ _id }, change).then(async () => {
        return await Article.findOne({ _id })
      })

      return updatedArticle
    } catch (error) {
      if (typeof error !== 'string' && error.name === 'CastError') {
        return 'O id não foi reconhecido, forneça um identificador válido'
      }

      return error
    }
  }

  /**
   * @function
   * @description Get statistics about a specific article
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` - String of article object id representation, see the docs for more details.
   * @middlewareParams {Number} `vlimit` - Limit views per page.
   * @middlewareParams {Number} `climit` - Limit comments per page.
   * @middlewareParams {Number} `vpage` - Current page of views.
   * @middlewareParams {Number} `cpage` - Current page of comments.
   *
   * @returns {Object} Containing statistics about views, likes and comments about the article.
   */
  const getStatistics = async (req, res) => {
    const _id = req.params.id

    try {
      const viewsPage = parseInt(req.query.vpage) || 1
      const commentsPage = parseInt(req.query.cpage) || 1
      const viewsLimit = parseInt(req.query.vlimit) || 10
      const commentsLimit = parseInt(req.query.climit) || 10

      const article = await Article.findOne({ _id })

      const views = await getViewsPerArticle(article, viewsPage, viewsLimit)
      const likes = await getLikesPerArticle(article)
      const comments = await getCommentsPerArticle(article, commentsPage, commentsLimit)

      return res.json({ likes, views, comments })
    } catch (error) {
      return res.status(500).send('Ocorreu um erro ao obter as estatísticas, tente novamente mais tarde')
    }
  }

  return {
    create,
    get,
    getOneById,
    getOne,
    save,
    management,
    remove,
    pushImage,
    removeImage,
    getStatistics
  }
}
