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

  /**
   * @function
   * @description Get views count by article Id or user Id
   * @private
   *
   * @param {String} type - Type of search, allowed: `user` and `article`
   * @param {String} userId - The user Identifier on ObjectId format
   * @param {String} articleId - The article Identifier on ObjectId format
   *
   * @returns {Object} A object containing the `status` of operation, the views `count`and `error` stack if occurs.
   */
  const getCountRealTime = async (type, userId, articleId) => {
    try {
      const validTypes = ['user', 'article']
      const isValidType = validTypes.find(currentType => currentType === type)

      if (!isValidType) {
        throw new Error(`The first parameter: "type" is ${type}, expected ${validTypes.toString()}`)
      }

      if (type === 'user' && !app.mongo.Types.ObjectId.isValid(userId)) {
        throw new Error(`type of userId is ${typeof userId}, expected String on ObjectId format`)
      }

      if (type === 'article' && !app.mongo.Types.ObjectId.isValid(articleId)) {
        throw new Error(`type of articleId is ${typeof articleId}, expected String on ObjectId format`)
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
            'article.userId': type === 'user' ? app.mongo.Types.ObjectId(userId) : { $ne: null },
            articleId: type === 'article' ? app.mongo.Types.ObjectId(articleId) : { $ne: null }
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      return { status: true, count, error: null }
    } catch (error) {
      return { status: false, count: 0, error }
    }
  }

  /**
   * @function
   * @description Get views count in MySQL database [`views` table]
   * @private
   *
   * @param {String} userId - The user Identifier on ObjectId format
   *
   * @returns {Object} A object containing the `status` of operation, the views `count`and `error` stack if occurs.
   */
  const getCount = async userId => {
    try {
      let count = userId
        ? await app.knex.select().from('views').where('reference', userId).orderBy('id', 'desc').first()
        : await app.knex.select().from('views').whereNull('reference').orderBy('id', 'desc').first()

      count = count || 0
      return { status: true, count, error: null }
    } catch (error) {
      return { status: false, count: {}, error }
    }
  }

  /**
   * @function
   * @description Synchronize views count (by user and general) between MongoDB and MySQL databases
   * @private
   */
  const synchronizeViews = async () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth, 31)

    /** @description The Users `_id` list  */
    const users = await User.find({ deletedAt: null }, { _id: 1 })

    /** @description Iterate the Users list getting the views count on MongoDB and added on MySQL database */
    const usersCount = users.map(async user => {
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
            'article.userId': app.mongo.Types.ObjectId(user._id),
            createdAt: {
              $gte: firstDay,
              $lt: lastDay
            }
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      return { month: currentMonth + 1, count, year: currentYear, reference: user.id }
    })

    Promise.all(usersCount).then(async data => {
      /** @description Insert views per user */
      await app.knex('views').insert(data)

      /** @description Insert general views (including all users) */
      const totalViews = await View.countDocuments({
        createdAt: {
          $gte: firstDay,
          $lt: lastDay
        }
      })

      await app.knex('views').insert({ month: currentMonth + 1, count: totalViews, year: currentYear })

      // eslint-disable-next-line no-console
      console.log(`**CRON** | views updated at ${new Date()}`)
    })
  }

  return { get, getLatest, getCount, synchronizeViews }
}
