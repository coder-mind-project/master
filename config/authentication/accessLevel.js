const { notAcceptableResource } = require('../api/httpResponses.js')()

module.exports = {
  isAdmin: middleware => {
    return async (req, res, next) => {
      const isAdmin = Boolean(req.user && req.user.user && req.user.user.tagAdmin)
      if (isAdmin) {
        middleware(req, res, next)
      } else {
        const stack = await notAcceptableResource({
          name: 'isNotAdmin',
          description: 'Resource not allowed for this user',
          problem: 'Current user is not admin',
          solution: 'Login with admin user'
        })
        return res.status(403).send(stack)
      }
    }
  }
}
