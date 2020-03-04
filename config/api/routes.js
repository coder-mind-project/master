const multer = require('../serialization/multer')
const { isAdmin } = require('../authentication/accessLevel')

/**
 *  @function
 *  @module Routes
 *  @description Provide routes to access resources.
 *  @param {Object} app - A app Object provided by consign.
 */
module.exports = app => {
  /**
   * @name Public
   * @description Access to static resources
   */
  app.use('/public', app.express.static('public'))

  /**
   * @name Authentication
   * @description Authentication resources
   */
  app
    .route('/auth')
    .post(app.api.auth.auth.signIn)
    .patch(app.api.auth.redeemAccount.redeemPerEmail)
    .put(app.api.auth.redeemAccount.redeemPerMoreInformations)

  app
    .route('/auth/logged')
    .post(app.api.auth.auth.validateToken)
    .all(app.config.authentication.passport.authenticate())
    .patch(isAdmin(app.api.users.users.validateAdminPassword))
    .put(app.api.users.users.validateUserPassword)

  app
    .route('/auth/rescue')
    .post(app.api.auth.redeemAccount.validateToken)
    .patch(app.api.auth.redeemAccount.changePassword)

  /**
   * @name Articles
   * @description Articles resources
   */
  app
    .route('/articles')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.articles.get)
    .post(app.api.articles.articles.save)
    .put(app.api.articles.articles.save)

  app
    .route('/articles/:url')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.articles.getOne)

  app
    .route('/articles/management/:id')
    .all(app.config.authentication.passport.authenticate())
    .delete(app.api.articles.articles.remove)
    .patch(app.api.articles.articles.management)
    .get(app.api.articles.articles.getOneById)

  app
    .route('/articles/img/:id')
    .all(app.config.authentication.passport.authenticate())
    .post(multer.single('smallImg'), app.api.articles.articles.pushImage)
    .patch(multer.single('mediumImg'), app.api.articles.articles.pushImage)
    .put(multer.single('bigImg'), app.api.articles.articles.pushImage)
    .delete(app.api.articles.articles.removeImage)

  app
    .route('/articles/stats/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.stats.stats.get)

  app
    .route('/articles/comments/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.getComments)

  /**
   * @name Users
   * @description Users resources
   */
  app
    .route('/users')
    .all(app.config.authentication.passport.authenticate())
    .get(isAdmin(app.api.users.users.get))
    .post(isAdmin(app.api.users.users.save))
    .patch(isAdmin(app.api.users.users.changePassword))

  app
    .route('/users/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.users.users.getOne)
    .delete(app.api.users.users.remove)
    .post(app.api.users.users.changeMyPassword)
    .patch(app.api.users.users.updateExtraInfo)
    .put(app.api.users.users.save)

  app
    .route('/users/configs/:id')
    .all(app.config.authentication.passport.authenticate())
    .patch(isAdmin(app.api.users.users.restore))
    .put(app.api.users.users.remove)

  app
    .route('/users/emails/:id')
    .all(app.config.authentication.passport.authenticate())
    .patch(app.api.users.users.cancelChangeEmail)
    .post(app.api.users.users.resendMail)

  app
    .route('/users/img/:id')
    .all(app.config.authentication.passport.authenticate())
    .patch(multer.single('profilePhoto'), app.api.users.users.configProfilePhoto)
    .delete(app.api.users.users.removeProfilePhoto)

  app
    .route('/users/settings')
    .patch(app.api.users.users.confirmEmail)
    .post(app.api.users.users.cancelChangeEmail)

  app.route('/users/settings/:id').delete(app.api.users.users.removePermanently)

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
    .route('/categories/theme/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.categories.categories.getByTheme)

  /**
   * @name Comments
   * @description Comments resources
   */
  app
    .route('/comments')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.get)
    .patch(app.api.articles.comments.readComment)
    .post(app.api.articles.comments.answerComment)

  app
    .route('/comments/history/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.getHistory)

  /**
   * @name Views
   * @description Views resources
   */
  app
    .route('/views')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.views.getViews)

  /**
   * @name Likes
   * @description Likes resources
   */
  app
    .route('/likes')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.likes.getLastLikes)

  /**
   * @name Statistics
   * @description Statistics resources
   */
  app
    .route('/stats')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.stats.countStats.get)

  app
    .route('/stats/sincronization')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.stats.countStats.lastSincronization)
    .post(isAdmin(app.api.stats.countStats.sincronizeManually))

  app
    .route('/stats/articles')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.stats.countStats.getArticleStatsForChart)

  app
    .route('/stats/authors')
    .all(app.config.authentication.passport.authenticate())
    .patch(app.api.users.stats.definePlatformStats)

  /**
   * @name Tickets
   * @description Tickets resources
   */
  app
    .route('/tickets')
    .all(app.config.authentication.passport.authenticate())
    .post(app.api.tickets.tickets.save)
    .get(isAdmin(app.api.tickets.tickets.get))

  app.route('/tickets/unauthenticated').post(app.api.tickets.tickets.save)

  app
    .route('/tickets/notifications')
    .all(app.config.authentication.passport.authenticate())
    .get(isAdmin(app.api.tickets.tickets.getOnlyNotReaded))

  app
    .route('/tickets/:id')
    .all(app.config.authentication.passport.authenticate())
    .put(isAdmin(app.api.tickets.tickets.answerTicket))
    .patch(isAdmin(app.api.tickets.tickets.readTicket))
    .get(isAdmin(app.api.tickets.tickets.getById))
}
