const { isAdmin } = require('../../config/authentication/accessLevel')

module.exports = app => {
  /**
   * @name Themes
   * @description Themes resources
   */
  app
    .route('/themes')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.themes.themes.get)
    .post(isAdmin(app.api.themes.themes.save))

  app
    .route('/themes/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.themes.themes.getOne)
    .delete(isAdmin(app.api.themes.themes.remove))
    .put(isAdmin(app.api.themes.themes.save))
}
