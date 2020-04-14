/**
 * @function
 * @module CommentSettings
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { User } = app.config.database.schemas.mongoose
  const { commentError } = app.api.responses

  /**
   * @function
   * @description Verify current user for resource access
   * @private
   * @param {Object} user User object representation
   */
  const verifyUser = async (user) => {
    const userInDb = await User.findOne({ _id: user._id, deletedAt: null })

    if (!userInDb) {
      throw {
        name: 'id',
        description: 'Usuário não encontrado'
      }
    }

    if (userInDb.id !== user._id) {
      throw {
        name: 'id',
        description: 'Acesso não autorizado'
      }
    }
  }

  /**
   * @function
   * @description Get current comment settings by user Identifier
   *
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Object} user - The user object representation
   * @middlewareParams {ttl} Date - Time to leave comment, formatted date like `unix timestamp`
   *
   * @returns {Object} The comment settings
   */
  const get = async (req, res) => {
    try {
      const { user } = req.user

      /**
       * @constant {Number} ttl Time to leave
       */
      const { ttl } = req.headers

      if (ttl && ttl >= Date.now()) return res.status(304).send()

      await verifyUser(user)

      const settings = await app.knex.select('userId', 'type', 'order', 'limit', 'notify').from('comment_settings').where('userId', user._id).first()

      settings.notify = Boolean(settings.notify)

      return res.json(settings)
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Save the comment settings by user Identifier
   *
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Object} user - The user object representation
   *
   * @returns {Object} The comment settings
   */
  const save = async (req, res) => {
    try {
      const { notify, limit, order, type } = req.body
      const { user } = req.user

      await verifyUser(user)

      const currentSettings = await app.knex.select().from('comment_settings').where('userId', user._id).first()

      if (!currentSettings) {
        await app.knex.insert({ notify, limit, order, type, userId: user._id }).into('comment_settings')
      } else {
        const updatedSettings = {
          limit: limit || currentSettings.limit,
          notify: notify || currentSettings.notify,
          order: order || currentSettings.order,
          type: type || currentSettings.type,
          updated_at: app.knex.fn.now()
        }

        await app.knex('comment_settings').where('userId', user._id).update(updatedSettings)
      }

      const settings = await app.knex.select('userId', 'type', 'order', 'limit', 'notify').from('comment_settings').where('userId', user._id).first()

      settings.notify = Boolean(settings.notify)

      return res.json(settings)
    } catch (error) {
      const stack = await commentError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { get, save }
}
