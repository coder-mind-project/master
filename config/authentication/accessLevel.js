const { notAcceptableResource } = require('../api/httpResponses.js')()

module.exports = {
  isAdmin: middleware => {
    return async (req, res, next) => {
      const isAdmin = Boolean(req.user && req.user.user && req.user.user.tagAdmin)
      if (isAdmin) {
        middleware(req, res, next)
      } else {
        const error = await notAcceptableResource('Resource not allowed for this user')
        return res.status(403).send(error.msg)
      }
    }
  }
}
