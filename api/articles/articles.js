const MyDate = require('../../config/Date')

const { s3, bucket, getBucketKeyFromUrl } = require('../../config/aws/s3')
const multer = require('../../config/serialization/multers3')

const uploadImg = multer.single('image')

const { articleData } = require('../../config/environment')

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
   * @middlewareParams {Number} `page` - Current article list page
   * @middlewareParams {Number} `limit` - Current article limit on page
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

      const articles = await Article.aggregate([
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

      return res.json({ articles, count, limit })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get the article by Id or customUri
   * @param {String} value The Article ObjectId representation in string format or customUri
   * @param {String} key Search method selector, possible value to `customUri` and `id`
   *
   * @returns A Object containing operation `status`, found `article` and if occurs the `error`
   */
  const getArticle = async (value, key) => {
    try {
      if (key !== 'customUri' && key !== 'id') {
        throw new Error(`The key parameter is '${key}', expected 'customUri' or 'id'`)
      }

      const articles = await Article.aggregate([
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
            _id: key === 'id' ? app.mongo.Types.ObjectId(value) : { $ne: null },
            customUri: key === 'customUri' ? value : { $ne: null }
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
        }
      ]).limit(1)

      const article = Array.isArray(articles) && articles.length ? articles[0] : null

      return { status: true, article, error: null }
    } catch (error) {
      return { status: false, article: null, error }
    }
  }

  /**
   * @function
   * @description Middleware to get the article by Id
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `type` Type of search method, allowed between two possibilities: by `id` and `customUri`.
   *
   * @returns The Article object representation
   */
  const getOne = async (req, res) => {
    try {
      const { id } = req.params
      const { user } = req.user
      let { type } = req.query

      type = type !== 'customUri' ? 'id' : type

      const idIsValid = app.mongo.Types.ObjectId.isValid(id)

      if (!idIsValid && type === 'id') {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const { status, article, error } = await getArticle(id, type)

      if (!status) throw error

      if (!article) {
        throw {
          name: 'id',
          description: 'Artigo não encontrado'
        }
      }

      if (!user.tagAdmin && user._id !== article.author._id) {
        throw {
          name: 'forbidden',
          description: 'Acesso não autorizado, somente administradores podem visualizar artigos de outros autores'
        }
      }

      return res.json(article)
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove the article (sets the `removed` state to article)
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` the article id
   */
  const remove = async (req, res) => {
    try {
      const { id } = req.params
      const { user } = req.user

      const article = await Article.findOne({ _id: id })

      if (!article) {
        throw {
          name: 'id',
          description: 'Artigo não encontrado'
        }
      }

      if (!user.tagAdmin && user._id !== article.userId) {
        throw {
          name: 'forbidden',
          description: 'Acesso não autorizado'
        }
      }

      if (article.publishedAt) {
        throw {
          name: 'publishedAt',
          description: 'Este artigo já foi publicado uma vez, não é possível removê-lo'
        }
      }

      if (article.state === 'removed') {
        throw {
          name: 'state',
          description: 'Este artigo já foi removido'
        }
      }

      await Article.updateOne(
        { _id: id },
        {
          state: 'removed',
          removedAt: MyDate.setTimeZone('-3'),
          customUri: articleData.defaultUri
        }
      )

      return res.status(204).send()
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  const validateState = async (id, user, state) => {
    const validStates = ['boosted', 'inactivated', 'published']
    const isValidState = validStates.find(currentState => state === currentState)

    if (state === 'removed') {
      throw {
        name: 'state',
        description: 'Para remover o artigo, utilize o método DELETE'
      }
    }

    if (!isValidState) {
      throw {
        name: 'state',
        description: 'Estado inválido'
      }
    }

    const article = await Article.findOne({ _id: id })

    if (!article) {
      throw {
        name: 'id',
        description: 'Artigo não encontrado'
      }
    }

    if (!user.tagAdmin && user._id !== article.userId) {
      throw {
        name: 'forbidden',
        description: 'Acesso não autorizado'
      }
    }

    if (article.state === state) {
      throw {
        name: 'state',
        description: 'Este artigo já possui este estado aplicado'
      }
    }

    /**
     * Begin limit boosted articles validation
     * @description Hard coded solution, limit boosted articles per author (not admin) user.
     * @temporary
     */

    if (user.tagAuthor) {
      const countBoostedArticles = await Article.countDocuments({ userId: user._id, state: 'boosted' })

      if (countBoostedArticles > 1) {
        throw {
          name: 'state',
          description: 'Limite de artigos impulsionados atingido'
        }
      }
    }

    /** End limit boosted articles validation */

    const stateTimestamp = `${state}At`

    return { article, stateTimestamp }
  }

  /**
   * @function
   * @description Change the Article current state. For remove the article, see `remove` resource.
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` the article id
   * @middlewareParams {String} `state` the wanted state, allowed: `boosted`, `inactivated` and `published`
   */
  const changeState = async (req, res) => {
    try {
      const { id } = req.params
      const { user } = req.user
      const { state } = req.query

      const { article, stateTimestamp } = await validateState(id, user, state)

      await Article.updateOne({ _id: id }, { state, [stateTimestamp]: MyDate.setTimeZone('-3') })

      return res.status(204).send()
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Send the article image
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` the article id
   * @middlewareParams {String} `type` the article image type, allowed: `logo`, `secondary` and `header`
   */
  const saveImage = async (req, res) => {
    try {
      const { id } = req.params
      const { type } = req.query

      const acceptbleImagesType = ['logo', 'secondary', 'header']
      const isValidType = acceptbleImagesType.find(currentType => currentType === type)

      if (!isValidType) {
        throw {
          name: 'type',
          description: 'Tipo de imagem inválido'
        }
      }

      const article = await Article.findOne({ _id: id })

      if (!article) {
        throw {
          name: 'id',
          description: 'Artigo não encontrado'
        }
      }

      uploadImg(req, res, async err => {
        if (err) {
          const stack = {
            code: 422,
            name: 'uploadStream',
            description: 'Ocorreu um erro ao salvar a imagem'
          }

          return res.status(stack.code).send(stack)
        }

        if (!req.file) {
          const stack = {
            code: 400,
            name: 'image',
            description: 'É necessário selecionar uma imagem'
          }

          return res.status(stack.code).send(stack)
        }

        const imgKey = `${type}Img`
        const imgValue = req.file.location

        if (article[imgKey]) {
          const { status, key, error } = getBucketKeyFromUrl(article[imgKey])
          if (!status) return

          s3.deleteObject({ Bucket: bucket, Key: key }, (err, data) => {
            if (err) {
              // eslint-disable-next-line no-console
              console.log(`Error on remove S3 object, Object key: ${key}\nStack: ${err}`)
            }
          })
        }

        await Article.updateOne({ _id: id }, { [imgKey]: imgValue })

        return res.json({ [imgKey]: imgValue })
      })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove the article image, specified by `type`
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` the article id
   * @middlewareParams {String} `type` the article image type, allowed: `logo`, `secondary` and `header`
   */
  const removeImage = async (req, res) => {
    try {
      const { id } = req.params
      const { type } = req.query

      const acceptbleImagesType = ['logo', 'secondary', 'header']
      const isValidType = acceptbleImagesType.find(currentType => currentType === type)

      if (!isValidType) {
        throw {
          name: 'type',
          description: 'Tipo de imagem inválido'
        }
      }

      const article = await Article.findOne({ _id: id })

      if (!article) {
        throw {
          name: 'id',
          description: 'Artigo não encontrado'
        }
      }

      const articleImageKey = `${type}Img`

      if (!article[articleImageKey]) {
        throw {
          name: articleImageKey,
          description: 'Imagem ja removida'
        }
      }

      const { status, key, error } = getBucketKeyFromUrl(article[articleImageKey])
      if (!status) throw error

      s3.deleteObject({ Bucket: bucket, Key: key }, async (err, data) => {
        if (err) {
          const stack = {
            code: 422,
            name: 'removeObject',
            description: 'Ocorreu um erro ao remover a imagem'
          }

          return res.status(stack.code).send(stack)
        }

        await Article.updateOne({ _id: id }, { [articleImageKey]: null })

        return res.status(204).send()
      })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
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
    getOne,
    save,
    changeState,
    remove,
    saveImage,
    removeImage,
    getStatistics
  }
}
