module.exports = app => {
  /**
   * @name Articles
   * @description Articles resources
   */
  app
    .route('/articles')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.articles.get)
    .post(app.api.articles.articles.create)
    .patch(app.api.articles.articles.existingArticlesByTitle)
    .put(app.api.articles.articles.changeStates)

  app
    .route('/articles/views')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.views.views.get)

  app
    .route('/articles/views/latest')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.views.views.getLatest)

  app
    .route('/articles/likes')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.likes.likes.get)

  app
    .route('/articles/likes/latest')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.likes.likes.getLatest)

  app
    .route('/articles/:id')
    .all(app.config.authentication.passport.authenticate())
    .put(app.api.articles.articles.save)
    .patch(app.api.articles.articles.changeState)
    .get(app.api.articles.articles.getOne)
    .delete(app.api.articles.articles.remove)

  app
    .route('/articles/images/:id')
    .all(app.config.authentication.passport.authenticate())
    .post(app.api.articles.articles.saveImage)
    .delete(app.api.articles.articles.removeImage)

  /**
   * @name Comments
   * @description Article comments resources
   */
  app
    .route('/comments')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.comments.get)
    .patch(app.api.articles.comments.comments.readAllComments)

  app
    .route('/comments/settings')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.settings.get)
    .post(app.api.articles.comments.settings.save)

  app
    .route('/comments/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.comments.getById)
    .patch(app.api.articles.comments.comments.readComment)
    .post(app.api.articles.comments.comments.answerComment)
    .put(app.api.articles.comments.comments.enableComment)
    .delete(app.api.articles.comments.comments.disableComment)

  app
    .route('/comments/history/:id')
    .all(app.config.authentication.passport.authenticate())
    .get(app.api.articles.comments.comments.getHistory)

  app
    .route('/comments/answers/:id')
    .all(app.config.authentication.passport.authenticate())
    .put(app.api.articles.comments.comments.editAnswer)
}
