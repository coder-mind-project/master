const { isAdmin } = require('../../config/authentication/accessLevel')

module.exports = app => {
  /**
   * @name Users
   * @description Users resources
   */
  app
    .route('/users')
    .all(app.config.authentication.passport.authenticate())
    .get(isAdmin(app.api.users.users.get))
    .post(isAdmin(app.api.users.users.save))

  app
    .route('/users/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.users.users.getOne)
    .delete(isAdmin(app.api.users.users.remove))
    .post(app.api.users.users.changeMyPassword)
    .patch(app.api.users.users.saveByMySelf)
    .put(isAdmin(app.api.users.users.save))

  app
    .route('/users/configs/:id')
    .all(app.config.authentication.passport.authenticate())
    .post(isAdmin(app.api.users.users.changePassword))
    .patch(isAdmin(app.api.users.users.restore))
    .put(app.api.users.users.remove)

  app
    .route('/users/emails/:id')
    .put(app.api.users.users.validateConfirmEmailToken)
    .delete(app.api.users.users.cancelChangeEmail)
    .all(app.config.authentication.passport.authenticate())
    .post(app.api.users.users.resendEmail)

  app
    .route('/users/img/:id')
    .all(app.config.authentication.passport.authenticate())
    .patch(app.api.users.users.saveProfileImage)
    .delete(app.api.users.users.removeProfileImage)
}
