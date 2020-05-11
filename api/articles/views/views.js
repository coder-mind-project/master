/**
 * @function
 * @module Views
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { View, User } = app.config.database.schemas.mongoose
  const { articleError } = app.api.responses

  /**
   * @function
   * @description Get the last views by `article` or `author`
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `type` - Search type, allowed: by userId (`user`) and articleId (`article`).
   * @middlewareParams {Number} `limit` - Current view limit by request.
   * @middlewareParams {String} `id` - Article or User identifier.
   *
   * @returns {Object} A object containing the `limit` and latest `views`.
   */
  const getLatest = async (req, res) => {
    try {
      const { user } = req.user
      let { limit, type, id } = req.query

      const validTypes = ['user', 'article']
      const isValidType = validTypes.find(currentType => currentType === type)

      if (!isValidType) {
        throw {
          name: 'type',
          description: 'Tipo inválido'
        }
      }

      const idIsValid = app.mongo.Types.ObjectId.isValid(id)

      if (!idIsValid) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      if (!user.tagAdmin && user._id !== id) {
        throw {
          name: 'forbidden',
          description: 'Acesso não autorizado'
        }
      }

      limit = parseInt(limit) || 10

      if (limit > 100) limit = 10

      let count = await View.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $project: {
            accessCount: 1,
            reader: 1,
            article: { $arrayElemAt: ['$article', 0] },
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $match: {
            'article.userId': type === 'user' ? app.mongo.Types.ObjectId(user._id) : { $ne: null }
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const views = await View.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $project: {
            accessCount: 1,
            reader: 1,
            article: { $arrayElemAt: ['$article', 0] },
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $match: {
            'article.userId': type === 'user' ? app.mongo.Types.ObjectId(user._id) : { $ne: null }
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ]).limit(limit)

      return res.json({ views, count, limit })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get the views
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} `page` - Current page.
   * @middlewareParams {Number} `limit` - Current limit per page.
   * @middlewareParams {String} `aid` - The Article identifier.
   * @middlewareParams {String | Date} `db` - Date start for filter views.
   * @middlewareParams {String | Date} `de` - Date end for filter views.
   * @middlewareParams {String} `order` - The views list ordination by createdAt field, allowed: `asc` and `desc`. Default value = `desc`.
   *
   * @returns {Object} A object containing the `limit` and latest `views`.
   */
  const get = async (req, res) => {
    try {
      let { page, limit, aid, db, de, order } = req.query
      const { user } = req.user

      limit = parseInt(limit) || 10
      page = parseInt(page) || 1

      db = db ? new Date(db) : new Date(new Date().setFullYear(new Date().getFullYear() - 100)) // Hundred years ago
      de = de ? new Date(de) : new Date(new Date().setFullYear(new Date().getFullYear() + 100)) // Hundred years later

      if (limit > 100) limit = 10
      if (page < 1) page = 1

      if (aid) {
        const isValidId = app.mongo.Types.ObjectId.isValid(aid)
        if (!isValidId) {
          throw {
            name: 'aid',
            description: 'Identificador inválido'
          }
        }
      }

      let count = await View.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $project: {
            accessCount: 1,
            reader: 1,
            articleId: 1,
            article: { $arrayElemAt: ['$article', 0] },
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $match: {
            articleId: aid ? app.mongo.Types.ObjectId(aid) : { $ne: null },
            createdAt: {
              $gte: db,
              $lte: de
            },
            'article.userId': app.mongo.Types.ObjectId(user._id)
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const views = await View.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $project: {
            accessCount: 1,
            reader: 1,
            articleId: 1,
            article: { $arrayElemAt: ['$article', 0] },
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $match: {
            articleId: aid ? app.mongo.Types.ObjectId(aid) : { $ne: null },
            createdAt: {
              $gte: db,
              $lte: de
            },
            'article.userId': app.mongo.Types.ObjectId(user._id)
          }
        },
        {
          $sort: {
            createdAt: order === 'asc' ? 1 : -1
          }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return res.json({ views, count, limit })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  const getStats = async _id => {
    /* Obtem a quantidade de visualizações mais atualizada da base de dados SQL */
    try {
      const views = _id
        ? await app.knex.select().from('views').where('reference', _id).orderBy('id', 'desc').first()
        : await app.knex.select().from('views').whereNull('reference').orderBy('id', 'desc').first()
      return { status: true, views }
    } catch (error) {
      return { status: error, views: {} }
    }
  }

  const viewsJob = async () => {
    /* Responsável por migrar as informações de quantidade de visualizações da base NOSQL para SQL */

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth, 31)

    // Estatísticas para cada usuário da plataforma

    // Obter o arrays de _ids dos usuários
    const users = await User.find({ deleted: false }, { _id: 1 })

    // Percorre o array obtendo as views e inserindo as views no banco SQL
    users.map(async user => {
      const userViews = await View.countDocuments({
        startRead: {
          $gte: firstDay,
          $lt: lastDay
        },
        'article.author._id': user.id
      })

      await app
        .knex('views')
        .insert({ month: currentMonth + 1, count: userViews, year: currentYear, reference: user.id })
    })

    /* Estatísticas gerais de plataforma */
    const views = await View.countDocuments({
      startRead: {
        $gte: firstDay,
        $lt: lastDay
      }
    })

    app
      .knex('views')
      .insert({ month: currentMonth + 1, count: views, year: currentYear })
      .then(() => {
        console.log(`**CRON** | views updated at ${new Date()}`)
      })
  }

  const getViewsPerArticle = async (article, page, limit) => {
    /* Obtem as estatisticas de visualização por um artigo especifico */
    try {
      if (!page) page = 1
      if (!limit || limit > 100) limit = 10

      const count = await View.find({ 'article._id': article._id }).countDocuments()
      const views = await View.aggregate([
        {
          $match: {
            'article._id': article._id
          }
        },
        { $sort: { startRead: -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { status: true, views, count }
    } catch (error) {
      return { status: false, views: [], count: 0 }
    }
  }

  const getChartViews = async (user = null, limit = 10) => {
    try {
      const viewsByArticle = await getViewsByArticle(user, limit)
      const viewsByAuthor = await getViewsByAuthor(user, limit)

      const data = {
        byArticle: viewsByArticle,
        byAuthor: viewsByAuthor
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const getViewsByArticle = async (user, limit) => {
    const views = user
      ? await View.aggregate([
          {
            $match: {
              'article.author._id': user
            }
          },
          {
            $group: {
              _id: '$article._id',
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'articles',
              localField: '_id',
              foreignField: '_id',
              as: 'article'
            }
          }
        ]).limit(limit)
      : await View.aggregate([
          { $match: {} },
          {
            $group: {
              _id: '$article._id',
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'articles',
              localField: '_id',
              foreignField: '_id',
              as: 'article'
            }
          }
        ]).limit(limit)

    const data = await views.map(elem => {
      return {
        _id: elem._id,
        title: elem.article[0].title,
        article: elem.article[0],
        quantity: elem.count
      }
    })

    const chartData = {
      articles: [],
      articleId: [],
      views: [],
      originalData: data
    }

    for (let i = 0; i < data.length; i++) {
      chartData.articles.push(data[i].title)
      chartData.articleId.push(data[i]._id)
      chartData.views.push(data[i].quantity)
    }

    return chartData
  }

  const getViewsByAuthor = async (user, limit) => {
    const views = user
      ? await View.aggregate([
          {
            $group: {
              _id: { $toObjectId: '$article.author._id' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'author'
            }
          }
        ]).limit(limit)
      : await View.aggregate([
          {
            $group: {
              _id: { $toObjectId: '$article.author._id' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'author'
            }
          }
        ]).limit(limit)

    const data = await views.map(elem => {
      return {
        _id: elem._id,
        name: elem.author[0].name,
        author: elem.author[0],
        quantity: elem.count
      }
    })

    const chartData = {
      authors: [],
      authorId: [],
      views: [],
      originalData: data
    }

    for (let i = 0; i < data.length; i++) {
      chartData.authors.push(data[i].author.name)
      chartData.authorId.push(data[i]._id)
      chartData.views.push(data[i].quantity)
    }

    return chartData
  }

  return { get, getLatest, getStats, viewsJob, getViewsPerArticle, getChartViews }
}
