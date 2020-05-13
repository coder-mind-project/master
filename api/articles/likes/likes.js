/**
 * @function
 * @module Likes
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { Like, User } = app.config.database.schemas.mongoose
  const { articleError } = app.api.responses

  /**
   * @function
   * @description Get the last likes by `article` or `author`
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `type` - Search type, allowed: by userId (`user`) and articleId (`article`).
   * @middlewareParams {Number} `limit` - Current like limit by request.
   * @middlewareParams {String} `id` - Article or User identifier.
   *
   * @returns {Object} A object containing the `limit` and latest `likes`.
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

      let count = await Like.aggregate([
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
            active: 1,
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

      const likes = await Like.aggregate([
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
            active: 1,
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

      return res.json({ likes, count, limit })
    } catch (error) {
      const stack = await articleError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get likes count by article Id or user Id
   * @private
   *
   * @param {String} type - Type of search, allowed: `user` and `article`
   * @param {String} userId - The user Identifier on ObjectId format
   * @param {String} articleId - The article Identifier on ObjectId format
   *
   * @returns {Object} A object containing the `status` of operation, the likes `count`and `error` stack if occurs.
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

      let count = await Like.aggregate([
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
            active: 1,
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
   * @description Get likes count in MySQL database [`likes` table]
   * @private
   *
   * @param {String} userId - The user Identifier on ObjectId format
   *
   * @returns {Object} A object containing the `status` of operation, the likes `count`and `error` stack if occurs.
   */
  const getCount = async userId => {
    try {
      let count = userId
        ? await app.knex.select().from('likes').where('reference', userId).orderBy('id', 'desc').first()
        : await app.knex.select().from('likes').whereNull('reference').orderBy('id', 'desc').first()

      count = count || 0
      return { status: true, count, error: null }
    } catch (error) {
      return { status: false, count: {}, error }
    }
  }

  /**
   * @function
   * @description Synchronize likes count (by user and general) between MongoDB and MySQL databases
   * @private
   */
  const synchronizeLikes = async () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth, 31)

    /** @description The Users `_id` list  */
    const users = await User.find({ deletedAt: null }, { _id: 1 })

    /** @description Iterate the Users list getting the likes count on MongoDB and added on MySQL database */
    const usersCount = users.map(async user => {
      let count = await Like.aggregate([
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
            active: 1,
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
      /** @description Insert likes per user */
      await app.knex('likes').insert(data)

      /** @description Insert general likes (including all users) */
      const totalLikes = await Like.countDocuments({
        createdAt: {
          $gte: firstDay,
          $lt: lastDay
        }
      })

      await app.knex('likes').insert({ month: currentMonth + 1, count: totalLikes, year: currentYear })

      // eslint-disable-next-line no-console
      console.log(`**CRON** | likes updated at ${new Date()}`)
    })
  }

  const getLikesByArticle = async (user, limit) => {
    const likes = user
      ? await Like.aggregate([
          {
            $match: {
              'article.author._id': user
            }
          },
          {
            $group: {
              _id: { $toObjectId: '$article._id' },
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
      : await Like.aggregate([
          { $match: {} },
          {
            $group: {
              _id: { $toObjectId: '$article._id' },
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

    const data = await likes.map(elem => {
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
      likes: [],
      originalData: data
    }

    for (let i = 0; i < data.length; i++) {
      chartData.articles.push(data[i].title)
      chartData.articleId.push(data[i]._id)
      chartData.likes.push(data[i].quantity)
    }

    return chartData
  }

  return { getLatest, getCount, synchronizeLikes }
}
