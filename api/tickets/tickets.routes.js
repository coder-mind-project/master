const { isAdmin } = require('../../config/authentication/accessLevel')

module.exports = app => {
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
    .get(isAdmin(app.api.tickets.tickets.getOne))
}
