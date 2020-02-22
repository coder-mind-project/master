/**
 * @function
 * @module Themes
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { exists, validateLength } = app.config.validation

  const { Theme } = app.config.database.schemas.mongoose

  const { errorTheme } = app.config.api.httpResponses

  /**
   * @function
   * @description Save a theme
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A Theme Object representation
   *
   * @middlewareParams {String} id - Identifier of theme
   */
  const save = async (req, res) => {
    const theme = { ...req.body }

    const _id = req.params.id || null

    try {
      /** Data validations */
      exists(theme.name, {
        name: 'name',
        description: 'Tema não informado'
      })

      validateLength(theme.name, 30, 'bigger', {
        name: 'name',
        description: 'Tema muito grande, máximo permitido 30 caracteres'
      })

      if (theme.alias) {
        validateLength(theme.alias, 30, 'bigger', {
          name: 'alias',
          description: 'Apelido muito grande, máximo permitido 30 caracteres'
        })
      }

      if (theme.description) {
        validateLength(theme.description, 100, 'bigger', {
          name: 'description',
          description: 'Descrição muito grande, máximo permitido 100 caracteres'
        })
      }
      /** Ending data validations */

      if (!_id) {
        // Create a new theme
        const result = await new Theme(theme).save()

        if (result._id) return res.status(201).send(result)
        throw result
      } else {
        // Update a theme
        await Theme.updateOne({ _id }, theme).then(() => {
          Theme.findOne({ _id }).then(theme => {
            return res.json(theme)
          })
        })
      }
    } catch (error) {
      const stack = await errorTheme(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Gets some themes
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} limit - Limit themes per page
   * @middlewareParams {String} query - Keyword to search for themes
   * @middlewareParams {Number} page - Current page
   *
   * @returns {Object} A object containing count, limit and Themes Objects representations
   */
  const get = async (req, res) => {
    try {
      var limit = parseInt(req.query.limit) || 10
      const query = req.query.query || ''
      const page = parseInt(req.query.page) || 1

      if (limit > 100) limit = 10

      let count = await Theme.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { name: { $regex: `${query}`, $options: 'i' } },
                  { alias: { $regex: `${query}`, $options: 'i' } }
                ]
              },
              {
                state: 'active'
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      Theme.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { name: { $regex: `${query}`, $options: 'i' } },
                  { alias: { $regex: `${query}`, $options: 'i' } }
                ]
              },
              {
                state: 'active'
              }
            ]
          }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)
        .then(themes => res.json({ themes, count, limit }))
    } catch (error) {
      const stack = await errorTheme(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove a theme
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Identifier of theme
   */
  const remove = async (req, res) => {
    try {
      const user = req.user.user

      if (!user.tagAdmin) throw 'Acesso não autorizado, somente administradores podem remover temas'

      const _id = req.params.id

      const theme = await Theme.findOne({ _id })

      if (!theme) throw 'Tema não encontrado'
      if (theme.state === 'removed') throw 'Este tema já foi excluído'

      const state = {
        state: 'removed'
      }

      Theme.updateOne({ _id }, state).then(() => res.status(204).send())
    } catch (error) {
      const stack = await errorTheme(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get a theme by Id
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Identifier of theme
   *
   * @returns {Object} A Theme Object representation
   */
  const getOne = (req, res) => {
    const _id = req.params.id
    Theme.findOne({ _id })
      .then(theme => res.json(theme))
      .catch(async error => {
        const stack = await errorTheme(error)
        return res.status(stack.code).send(stack)
      })
  }

  /**
   * @deprecated since version 2.0
   * @function
   * @description Sets 'active' state in theme
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Identifier of theme
   */
  const active = async (req, res) => {
    try {
      const _id = req.params.id

      const theme = await Theme.findOne({ _id, state: 'active' })

      if (!theme) throw 'Tema não encontrado'

      const state = {
        state: 'active'
      }

      Theme.updateOne({ _id }, state).then(() => res.status(204).send())
    } catch (error) {
      const stack = await errorTheme(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { save, get, getOne, remove, active }
}
