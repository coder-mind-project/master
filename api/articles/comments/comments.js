const MyDate = require('../../../config/Date')

/**
 * @function
 * @module Comments
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { Comment, Article, User } = app.config.database.schemas.mongoose
  const { validateLength, exists } = app.config.validation
  const { commentError } = app.api.responses
  const { sendEmail } = app.api.articles.emails

  /**
   * @function
   * @description Get comments
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} `limit` - Limit comments per page
   * @middlewareParams {String} `type` - Comment type, allowed: `all`, `not-readed` and `only-readed`
   * @middlewareParams {Number} `page` - Current page
   * @middlewareParams {String} `order` - Order result list, ordered by `createdAt` attribute
   * @middlewareParams {String} `query` - Keyword to search comment by `userName`, `userEmail`, `article name` or `message`
   *
   * @returns {Object} A object containing count, limit and Comments Objects representation
   */
  const get = async (req, res) => {
    try {
      const { type, order, query } = req.query

      const page = parseInt(req.query.page) || 1
      const limit = !parseInt(req.query.limit) || parseInt(req.query.limit) > 100 ? 10 : parseInt(req.query.limit)

      const user = req.user.user

      let result = null

      switch (type) {
        case 'all': {
          // Get all comments (except comment answers)
          result = await getAllComments(user, page, limit, order, query)
          break
        }
        case 'not-readed': {
          // Get not readed comments (except comment answers)
          result = await getNotReadedComments(user, page, limit, order, query)
          break
        }
        case 'only-readed': {
          // Get only readed comments (except comment answers)
          result = await getOnlyReadedComments(user, page, limit, order, query)
          break
        }
        case 'disabled':
        case 'enabled': {
          result = await getCommentsByState(user, page, limit, order, query, type)
        }
      }

      if (!result) {
        throw {
          name: 'type',
          description: 'Tipo de comentário inválido'
        }
      }

      if (!result.status) {
        throw {
          name: 'internal-error',
          description: 'Ocorreu um erro interno, se persistir reporte'
        }
      }

      const { comments, count } = result

      return res.json({ comments, count, limit })
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get not readed comments (except answers)
   * @param {Object} user - User object representation (provided from jwt passport)
   * @param {Number} page - Current page
   * @param {Number} limit - Limit comments per page
   * @param {String} order - Result list order
   * @param {String} query - Keyword to filter results
   *
   * @returns {Object} A object containing status operation, count, limit and Comments Object representation
   */
  const getNotReadedComments = async (user, page, limit, order = 'desc', query = '') => {
    try {
      let count = await Comment.aggregate([
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
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            readedAt: 1,
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            readedAt: 1,
            article: {
              title: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { readedAt: null },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'answerOf',
            foreignField: '_id',
            as: 'answerOf'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: { $arrayElemAt: ['$answerOf', 0] },
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            isAuthor: { $eq: ['$userId', '$article.author._id'] },
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { readedAt: null },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        },
        { $sort: { createdAt: order === 'asc' ? 1 : -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  /**
   * @function
   * @description Get only readed comments (except answers)
   * @param {Object} user - User object representation (provided from jwt passport)
   * @param {Number} page - Current page
   * @param {Number} limit - Limit comments per page
   * @param {String} order - Result list order
   * @param {String} query - Keyword to filter results
   *
   * @returns {Object} A object containing status operation, count, limit and Comments Object representation
   */
  const getOnlyReadedComments = async (user, page, limit, order = 'desc', query = '') => {
    try {
      let count = await Comment.aggregate([
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
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            readedAt: 1,
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            readedAt: 1,
            article: {
              title: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { readedAt: { $ne: null } },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'answerOf',
            foreignField: '_id',
            as: 'answerOf'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: { $arrayElemAt: ['$answerOf', 0] },
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            isAuthor: { $eq: ['$userId', '$article.author._id'] },
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { readedAt: { $ne: null } },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        },
        { $sort: { createdAt: order === 'asc' ? 1 : -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  /**
   * @function
   * @description Get all comments (except answers)
   * @param {Object} user - User object representation (provided from jwt passport)
   * @param {Number} page - Current page
   * @param {Number} limit - Limit comments per page
   * @param {String} order - Result list order
   * @param {String} query - Keyword to filter results
   *
   * @returns {Object} A object containing status operation, count, limit and Comments Object representation
   */
  const getAllComments = async (user, page, limit, order = 'desc', query = '') => {
    try {
      let count = await Comment.aggregate([
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
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            article: {
              title: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'answerOf',
            foreignField: '_id',
            as: 'answerOf'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: { $arrayElemAt: ['$answerOf', 0] },
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            isAuthor: { $eq: ['$userId', '$article.author._id'] },
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        },
        { $sort: { createdAt: order === 'asc' ? 1 : -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }

  /**
   * @function
   * @description Get comments by `state` (except answers)
   * @param {Object} user - User object representation (provided from jwt passport)
   * @param {Number} page - Current page
   * @param {Number} limit - Limit comments per page
   * @param {String} order - Result list order
   * @param {String} query - Keyword to filter results
   * @param {String} type - The Comment `state` option
   *
   * @returns {Object} A object containing status operation, count, limit and Comments Object representation
   */
  const getCommentsByState = async (user, page, limit, order = 'desc', query = '', type) => {
    try {
      let count = await Comment.aggregate([
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
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            userName: 1,
            userEmail: 1,
            message: 1,
            state: 1,
            answerOf: 1,
            article: {
              title: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { state: type },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      const comments = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'answerOf',
            foreignField: '_id',
            as: 'answerOf'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: { $arrayElemAt: ['$answerOf', 0] },
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            isAuthor: { $eq: ['$userId', '$article.author._id'] },
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              smallImg: 1,
              mediumImg: 1,
              largeImg: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            }
          }
        },
        {
          $match: {
            $and: [
              {
                'article.author._id': app.mongo.Types.ObjectId.isValid(user._id)
                  ? app.mongo.Types.ObjectId(user._id)
                  : null
              },
              { answerOf: null },
              { state: type },
              {
                $or: [
                  { userName: { $regex: `${query}`, $options: 'i' } },
                  { userEmail: { $regex: `${query}`, $options: 'i' } },
                  { message: { $regex: `${query}`, $options: 'i' } },
                  { 'article.title': { $regex: `${query}`, $options: 'i' } }
                ]
              }
            ]
          }
        },
        { $sort: { createdAt: order === 'asc' ? 1 : -1 } }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return { comments, status: true, count, limit }
    } catch (error) {
      return { status: false, error, count: 0, limit }
    }
  }
  /**
   * @function
   * @description Get a comment by identifier
   * @param {String} _id The comment identifier (ID)
   * @param {Boolean} isAnswer Indicates preference for comment answers, default = `false`
   *
   * @returns {Object} A object containing status operation and Comment Object representation
   */
  const getOne = async (_id, isAnswer = false) => {
    try {
      if (!app.mongo.Types.ObjectId.isValid(_id)) {
        throw {
          name: '_id',
          description: 'Identificador inválido'
        }
      }

      const comments = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'answerOf',
            foreignField: '_id',
            as: 'answerOf'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: { $arrayElemAt: ['$answerOf', 0] },
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'article.author',
            foreignField: '_id',
            as: 'article.author'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              author: { $arrayElemAt: ['$article.author', 0] }
            }
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            }
          }
        },
        {
          $match: {
            $and: [
              { _id: app.mongo.Types.ObjectId.isValid(_id) ? app.mongo.Types.ObjectId(_id) : null },
              { answerOf: isAnswer ? { $ne: null } : null }
            ]
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'answerOf',
            as: 'answers'
          }
        },
        {
          $project: {
            _id: 1,
            userEmail: 1,
            userName: 1,
            userId: 1,
            isAuthor: { $eq: ['$userId', '$article.author._id'] },
            message: 1,
            state: 1,
            confirmedAt: 1,
            readedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            answerOf: 1,
            article: {
              _id: 1,
              title: 1,
              customURL: 1,
              author: {
                _id: 1,
                name: 1,
                tagAdmin: 1,
                tagAuthor: 1,
                customUrl: 1,
                profilePhoto: 1
              }
            },
            answers: {
              _id: 1,
              confirmedAt: 1,
              readedAt: 1,
              answerOf: 1,
              userName: 1,
              userEmail: 1,
              userId: 1,
              articleId: 1,
              message: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
        }
      ])

      const comment = Array.isArray(comments) ? comments[0] : {}

      return { comment, status: true }
    } catch (error) {
      return { status: false, error }
    }
  }

  /**
   * @function
   * @description Middleware for get a comment by identifier / ID
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A object containing the Comment Object representation
   */
  const getById = async (req, res) => {
    try {
      const { id } = req.params

      const { comment, status, error } = await getOne(id)

      if (!status) {
        throw error
      }

      if (!comment) {
        throw {
          name: 'id',
          description: 'Comentário não encontrado'
        }
      }

      return res.json(comment)
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Middleware for get the answers history comment
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Comment identifier / ID
   *
   *  @returns {Object} A object containing count, limit and the Comment answers
   */
  const getHistory = async (req, res) => {
    try {
      const { id } = req.params

      const limit = !parseInt(req.query.limit) || parseInt(req.query.limit) > 100 ? 10 : parseInt(req.query.limit)
      const page = parseInt(req.query.page) || 1
      const order = req.query.order || 'asc'
      const state = req.query.state || null

      if (!app.mongo.Types.ObjectId.isValid(id)) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const count = await Comment.countDocuments({
        answerOf: id,
        state: state === 'disabled' || state === 'enabled' ? state : { $ne: null }
      })

      const answers = await Comment.aggregate([
        {
          $lookup: {
            from: 'articles',
            localField: 'articleId',
            foreignField: '_id',
            as: 'article'
          }
        },
        {
          $addFields: {
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $addFields: {
            isAuthor: { $eq: ['$userId', '$article.author'] }
          }
        },
        {
          $project: {
            article: 0
          }
        },
        {
          $match: {
            answerOf: app.mongo.Types.ObjectId(id),
            state: state === 'disabled' || state === 'enabled' ? state : { $ne: null }
          }
        },
        {
          $sort: { createdAt: order === 'desc' ? -1 : 1 }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)

      return res.json({ answers, count, limit })
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Sets 'Read' state for the Comment
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Comment identifier / ID
   *
   * @returns {Object} A object containing count, limit and the Comment answers
   */
  const readComment = async (req, res) => {
    try {
      const { id } = req.params

      if (!app.mongo.Types.ObjectId.isValid(id)) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const found = await Comment.findOne({ _id: id })

      if (!found) {
        throw {
          name: 'id',
          description: 'Comentário não encontrado'
        }
      }

      const readedState = { readedAt: MyDate.setTimeZone('-3') }

      const { nModified } = await Comment.updateOne({ _id: id, readedAt: null }, readedState)

      if (!nModified) {
        throw {
          name: 'id',
          description: 'Este comentário já esta marcado como lido'
        }
      }

      return res.status(204).send()
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Sets 'Read' state for all not readed comment by author
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   */
  const readAllComments = async (req, res) => {
    try {
      const { user } = req.user

      const { comments } = await getNotReadedComments(user, 1, Number.MAX_SAFE_INTEGER)

      if (!comments || !comments.length) {
        throw {
          name: 'gone',
          description: 'Não existem comentários não lidos'
        }
      }

      const ops = comments.map(async comment => {
        return Comment.updateOne({ _id: comment._id }, { readedAt: MyDate.setTimeZone('-3') })
      })

      await Promise.all(ops).then(() => res.status(204).send())

      throw { name: 'error', description: 'Ocorreu um erro ao marcar os comentários como lido' }
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Allow the user answer the reader comment
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `answer` - Comment answer
   * @middlewareParams {String} `id` - Comment identifier / ID
   * @middlewareParams {String} `notify` - Flag to send email to reader. The values possible are `yes` and `no` (default)
   *
   * @returns {Object} A object containing the new created answer
   */
  const answerComment = async (req, res) => {
    try {
      const { answer } = req.body

      const answerOf = req.params.id

      // Send email flag
      const sendNotification = req.query.notify || 'no'

      const { user } = req.user

      exists(answer, { name: 'answer', description: 'É necessário informar alguma resposta' })
      validateLength(answer, 10000, 'bigger', {
        name: 'answer',
        description: 'Para o comentário é somente permitido 10000 caracteres'
      })

      // Get the articleId in answered comment(root comment)
      const root = await getOne(answerOf)
      const articleId = root.status && root.comment ? root.comment.article._id : null

      if (!articleId) {
        throw {
          name: 'id',
          description: 'Comentário não encontrado'
        }
      }

      const comment = new Comment({
        userName: user.name,
        userEmail: user.email,
        userId: user._id,
        message: answer,
        articleId,
        answerOf
      })

      const createdAnswer = await comment.save().then(newAnswer => {
        if (sendNotification === 'yes') {
          const payload = {
            comment: root.comment,
            answer: newAnswer
          }

          sendEmail('answer-sent', payload)
        }

        return newAnswer
      })

      return res.status(201).send(createdAnswer)
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Edit the specific answer
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `answer` - The new Comment answer
   * @middlewareParams {String} `id` - Comment identifier / ID
   *
   * @returns {Object} A object containing the edited comment answer
   */
  const editAnswer = async (req, res) => {
    try {
      const { id } = req.params
      const { answer } = req.body
      const { user } = req.user

      exists(answer, { name: 'answer', description: 'É necessário informar alguma resposta' })
      validateLength(answer, 10000, 'bigger', {
        name: 'answer',
        description: 'Para o comentário é somente permitido 10000 caracteres'
      })

      const { comment, status, error } = await getOne(id, true)

      if (!status) {
        throw error
      }

      if (!comment) {
        throw {
          name: 'id',
          description: 'Resposta não encontrada'
        }
      }

      // Only answers can be edited
      if (!comment.answerOf) {
        throw {
          name: 'answerOf',
          description: 'Somente respostas podem ser editadas'
        }
      }

      // Not allowed edit answers not enabled
      if (comment.state !== 'enabled') {
        throw {
          name: 'state',
          description: 'Somente respostas habilitadas podem ser editadas'
        }
      }

      // Only comment author allowed to edit answers
      if (comment.userId.toString() !== user._id) {
        throw {
          name: 'forbidden',
          description: 'Acesso não autorizado'
        }
      }

      await Comment.updateOne({ _id: id }, { message: answer })

      // Update the `message` field to send in response
      comment.message = answer

      return res.json(comment)
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Disable a comment
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` - Comment identifier / ID
   */
  const disableComment = async (req, res) => {
    try {
      const { id } = req.params

      if (!app.mongo.Types.ObjectId.isValid(id)) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const comment = await Comment.findOne({ _id: id })

      if (!comment) {
        throw {
          name: 'id',
          description: 'Comentário não encontrado'
        }
      }

      if (comment.state === 'disabled') {
        throw {
          name: 'id',
          description: 'Este comentário já esta desabilitado'
        }
      }

      await Comment.updateOne({ _id: id }, { state: 'disabled' })

      return res.status(204).send()
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Enable a comment
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} `id` - Comment identifier / ID
   */
  const enableComment = async (req, res) => {
    try {
      const { id } = req.params

      if (!app.mongo.Types.ObjectId.isValid(id)) {
        throw {
          name: 'id',
          description: 'Identificador inválido'
        }
      }

      const comment = await Comment.findOne({ _id: id })

      if (!comment) {
        throw {
          name: 'id',
          description: 'Comentário não encontrado'
        }
      }

      if (comment.state === 'enabled') {
        throw {
          name: 'id',
          description: 'Este comentário já esta habilitado'
        }
      }

      await Comment.updateOne({ _id: id }, { state: 'enabled' })

      return res.status(204).send()
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Job for count article comments in current month (general and per user stats)
   */
  const commentsJob = async () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth, 31)

    // Users (authors and admins) list
    const users = await User.find({ deletedAt: null }, { _id: 1 })

    // Insert comments quantity per User in MySQL database
    users.map(async user => {
      let userComments = await Comment.aggregate([
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
            _id: 1,
            answerOf: 1,
            createdAt: 1,
            article: { $arrayElemAt: ['$article', 0] }
          }
        },
        {
          $match: {
            $and: [
              { 'article.author': app.mongo.Types.ObjectId(user.id) },
              { answerOf: null },
              {
                createdAt: {
                  $gte: firstDay,
                  $lt: lastDay
                }
              }
            ]
          }
        }
      ]).count('id')

      userComments = userComments.length > 0 ? userComments.reduce(item => item).id : 0

      await app.knex('comments').insert({
        month: currentMonth + 1,
        count: userComments,
        year: currentYear,
        reference: user.id
      })
    })

    /* Estatísticas gerais de plataforma */
    const comments = await Comment.countDocuments({
      createdAt: {
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

  // ===================================================================== //
  // Comment statistics below
  // Refactor later

  /**
   * @function
   * @needsUpdate
   */
  const getStats = async _id => {
    try {
      const comments = await getCommentsStats(_id)
      return { status: true, comments }
    } catch (error) {
      return { status: error, comments: {} }
    }
  }

  /**
   * @function
   * @needsUpdate
   */
  const getCommentsStats = async _id => {
    let results = []

    if (_id) {
      results = await app.knex.select().from('comments').where('reference', _id).orderBy('id', 'desc').first()
    } else {
      results = await app.knex.select().from('comments').whereNull('reference').orderBy('id', 'desc').first()
    }

    return results
  }

  /**
   * @function
   * @needsUpdate
   */
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

  /**
   * @function
   * @needsUpdate
   */
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

  // End comment statistics
  // ========================================================= //

  return {
    get,
    readComment,
    readAllComments,
    answerComment,
    editAnswer,
    getById,
    getHistory,
    commentsJob,
    getStats,
    getCommentsPerArticle,
    getComments,
    disableComment,
    enableComment
  }
}
