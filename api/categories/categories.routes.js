const { isAdmin } = require('../../config/authentication/accessLevel')

module.exports = app => {
  /**
   * @name Categories
   * @description Categories resources
   */
  app
    .route('/categories')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.categories.categories.get)
    .post(isAdmin(app.api.categories.categories.save))

  app
    .route('/categories/:id')
    .all(app.config.authentication.passport.authenticate())
    .delete(isAdmin(app.api.categories.categories.remove))
    .get(app.api.categories.categories.getOne)
    .put(isAdmin(app.api.categories.categories.save))

  app
    .route('/categories/themes/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.categories.categories.getByTheme)

  app
    .route('/categories/:query/themes/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.categories.categories.getByThemeWithFilter)
}
