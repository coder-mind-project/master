/**
 * @function
 * @module Categories
 * @description Provide some middlewares functions.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some middleware functions.
 */
module.exports = app => {
  const { exists, validateLength } = app.config.validation

  const { Category, Theme } = app.config.database.schemas.mongoose

  const { categoryError } = app.config.api.httpResponses

  /**
   * @function
   * @description Save a category
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @returns {Object} A Category Object representation
   *
   * @middlewareParams {String} id - Category identifier
   */
  const save = async (req, res) => {
    const category = { ...req.body }
    const _id = req.params.id || null

    try {
      /* Data validations */
      exists(category.name, {
        name: 'name',
        description: 'Nome da categoria não informado'
      })

      exists(category.themeId, {
        name: 'themeId',
        description: 'Tema não informado'
      })

      if (!app.mongo.Types.ObjectId.isValid(category.themeId)) {
        throw {
          name: 'themeId',
          description: 'Identificador do tema inválido'
        }
      }

      const themeExists = await Theme.countDocuments({ _id: category.themeId, state: 'active' })

      if (!themeExists) {
        throw {
          name: 'themeId',
          description: 'Este tema não consta em nossa base de dados ou encontra-se inativo'
        }
      }

      validateLength(category.name, 30, 'bigger', {
        name: 'name',
        description: 'Categoria muito grande, máximo permitido são 30 caracteres'
      })

      if (category.alias) {
        validateLength(category.alias, 30, 'bigger', {
          name: 'alias',
          description: 'Apelido muito grande, máximo permitido são 30 caracteres'
        })
      }

      if (category.description) {
        validateLength(category.description, 100, 'bigger', {
          name: 'name',
          description: 'Descrição muito grande, máximo permitido são de 100 caracteres'
        })
      }
      /* End data validations */

      if (!_id) {
        // Create a new category
        const result = await new Category(category).save()
        if (result._id) return res.status(201).send(result)
        throw result
      } else {
        // Update a category
        await Category.updateOne({ _id }, category)

        const result = await Category.findOne({ _id })

        if (!result) {
          throw {
            name: 'categories',
            description: 'Categoria não encontrada'
          }
        }

        if (result.state === 'removed') {
          throw {
            name: 'categories',
            description: 'Esta categoria foi excluída'
          }
        }

        return res.json(result)
      }
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Gets some categories
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {Number} limit - Limit categories per page
   * @middlewareParams {String} query - Keyword to search for categories
   * @middlewareParams {Number} page - Current page
   *
   * @returns {Object} A object containing count, limit and Categories Objects representations
   */
  const get = async (req, res) => {
    try {
      let limit = parseInt(req.query.limit) || 10
      const query = req.query.query || ''
      const page = parseInt(req.query.page) || 1

      if (limit > 100) limit = 10

      let count = await Category.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [{ name: { $regex: `${query}`, $options: 'i' } }, { alias: { $regex: `${query}`, $options: 'i' } }]
              },
              {
                state: 'active'
              }
            ]
          }
        }
      ]).count('id')

      count = count.length > 0 ? count.reduce(item => item).id : 0

      Category.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [{ name: { $regex: `${query}`, $options: 'i' } }, { alias: { $regex: `${query}`, $options: 'i' } }]
              },
              {
                state: 'active'
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'themes',
            localField: 'themeId',
            foreignField: '_id',
            as: 'themes'
          }
        },
        {
          $project: {
            name: 1,
            alias: 1,
            description: 1,
            state: 1,
            theme: { $arrayElemAt: ['$themes', 0] }
          }
        }
      ])
        .skip(page * limit - limit)
        .limit(limit)
        .then(categories => res.json({ categories, count, limit }))
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Remove a category
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Category identifier
   */
  const remove = async (req, res) => {
    try {
      const _id = req.params.id

      const state = {
        state: 'removed'
      }

      const category = await Category.findOne({ _id })

      if (!category) {
        throw {
          name: 'categories',
          description: 'Categoria não encontrada'
        }
      }

      if (category.state === 'removed') {
        throw {
          name: 'categories',
          description: 'Esta categoria já foi excluída'
        }
      }

      Category.updateOne({ _id }, state).then(() => res.status(204).send())
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Get a category by Id
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Category identifier
   *
   * @returns {Object} A Category Object representation
   */
  const getOne = async (req, res) => {
    try {
      const _id = req.params.id
      const categories = await Category.aggregate([
        {
          $match: { _id: app.mongo.Types.ObjectId(_id) }
        },
        {
          $lookup: {
            from: 'themes',
            localField: 'themeId',
            foreignField: '_id',
            as: 'themes'
          }
        },
        {
          $project: {
            name: 1,
            alias: 1,
            description: 1,
            state: 1,
            theme: { $arrayElemAt: ['$themes', 0] }
          }
        },
        {
          $limit: 1
        }
      ])

      if (!categories.length) {
        throw {
          name: 'id',
          description: 'Categoria não encontrada'
        }
      }

      const category = categories[0]

      if (category.state === 'removed') {
        throw {
          name: 'categories',
          description: 'Esta categoria foi excluída'
        }
      }

      return res.json(category)
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @function
   * @description Gets categories by theme
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Category identifier
   *
   * @returns {Array<Category>} An Array containing categories
   */
  const getByTheme = async (req, res) => {
    const themeId = req.params.id

    try {
      if (!themeId) {
        throw {
          name: 'themeId',
          description: 'Identificador do tema não encontrado'
        }
      }

      Category.aggregate([
        {
          $lookup: {
            from: 'themes',
            localField: 'themeId',
            foreignField: '_id',
            as: 'themes'
          }
        },
        {
          $match: {
            $and: [
              {
                themeId: app.mongo.Types.ObjectId(themeId)
              },
              {
                state: 'active'
              }
            ]
          }
        },
        {
          $project: {
            name: 1,
            alias: 1,
            description: 1,
            state: 1,
            theme: { $arrayElemAt: ['$themes', 0] }
          }
        }
      ]).then(categories => res.json(categories))
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  /**
   * @deprecated since version 2.0
   * @function
   * @description Sets 'active' state in category
   * @param {Object} req - Request object provided by Express.js
   * @param {Object} res - Response object provided by Express.js
   *
   * @middlewareParams {String} id - Category identifier
   */
  const active = async (req, res) => {
    try {
      const _id = req.params.id

      if (!_id) throw 'Categoria não encontrada'

      const state = {
        state: 'active'
      }

      Category.updateOne({ _id }, state).then(() => res.status(204).send())
    } catch (error) {
      const stack = await categoryError(error)
      return res.status(stack.code).send(stack)
    }
  }

  return { save, get, getOne, remove, active, getByTheme }
}
