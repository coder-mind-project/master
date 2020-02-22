module.exports = app => {
  // Validação de dados
  const { exists, validateLength } = app.config.validation

  // Mongoose model para temas
  const { Theme } = app.config.database.schemas.mongoose

  // Responsável por gerar Mensagens de erro Personalizadas
  const { errorTheme } = app.config.api.httpResponses

  const save = async (req, res) => {
    /* Responsável por persistir temas */

    const theme = { ...req.body }

    try {
      exists(theme.name, 'Tema não informado')
      validateLength(theme.name, 30, 'bigger')
      validateLength(theme.alias, 30, 'bigger')
      validateLength(theme.description, 100, 'bigger')
    } catch (msg) {
      return res.status(400).send(msg)
    }

    try {
      if (!theme._id) {
        delete theme._id
        const newTheme = new Theme(theme)

        await newTheme
          .save()
          .then(response => res.status(201).send(response))
          .catch(error => {
            if (error.code === 11000) throw 'Ja existe tema com este nome'
            else throw 'Ocorreu um erro desconhecido, se persistir reporte'
          })
      } else {
        const _id = theme._id

        await Theme.updateOne({ _id }, theme)
          .then(() => res.status(204).send())
          .catch(error => {
            if (error.code === 11000) throw 'Ja existe tema com este nome'
            else throw 'Ocorreu um erro desconhecido, se persistir reporte'
          })
      }
    } catch (error) {
      error = await errorTheme(error)
      return res.status(error.code).send(error.msg)
    }
  }

  const get = async (req, res) => {
    /*  Responsável por obter os temas por filtros de
            palavras chave. Ocorrendo a possibilidade de limitar
            por páginação e também obtendo a quantidade total de registros
            por filtragem

        */

    try {
      var limit = parseInt(req.query.limit) || 10
      const query = req.query.query || ''
      const page = req.query.page || 1

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
      return res
        .status(500)
        .send('Ops, ocorreu um erro ao recuperar as informações. Tente atualizar a página')
    }
  }

  const remove = async (req, res) => {
    /* Responsável por remover o tema */

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
      error = await errorTheme(error)
      return res.status(error.code).send(error.msg)
    }
  }

  const getOne = (req, res) => {
    /* Responsável por obter o tema pelo ID */

    const _id = req.params.id
    Theme.findOne({ _id })
      .then(theme => res.json(theme))
      .catch(async error => {
        error = await errorTheme(error)
        return res.status(error.code).send(error.msg)
      })
  }

  const active = async (req, res) => {
    /* Responsável restaurar uma categoria excluída */
    // Não implementado

    try {
      const _id = req.params.id

      const theme = await Theme.findOne({ _id, state: 'active' })

      if (!theme) throw 'Tema não encontrado'

      const state = {
        state: 'active'
      }

      Theme.updateOne({ _id }, state).then(() => res.status(204).send())
    } catch (error) {
      error = await errorTheme(error)
      return res.status(error.code).send(error.msg)
    }
  }

  return { save, get, getOne, remove, active }
}
