const jwt = require('jwt-simple')

const { authSecret, issuer } = require('../../config/environment')

module.exports = app => {
  const { User } = app.config.database.schemas.mongoose

  const definePlatformStats = (req, res) => {
    try {
      const _id = req.user.user._id
      const option = Boolean(req.body.option)

      User.updateOne({ _id }, { platformStats: option }).then(async response => {
        const payload = {
          iss: issuer,
          iat: req.user.iat,
          exp: req.user.exp,
          user: {
            ...req.user.user,
            platformStats: option
          }
        }

        const user = await User.findOne({ _id }, { password: 0 })

        res.json({
          token: jwt.encode(payload, authSecret),
          user
        })
      })
    } catch (error) {
      res.status(500).send(error)
    }
  }

  return { definePlatformStats }
}
