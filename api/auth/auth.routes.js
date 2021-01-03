module.exports = app => {
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
    .patch(app.api.users.users.validateUserPassword)

  app
    .route('/auth/rescue')
    .post(app.api.auth.redeemAccount.validateToken)
    .patch(app.api.auth.redeemAccount.changePassword)
    .delete(app.api.auth.redeemAccount.removeAccount)
}
