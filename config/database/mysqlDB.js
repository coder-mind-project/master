const knex = require('knex')
const config = require('../../knexfile.js')

const logger = (message) => {
  // eslint-disable-next-line no-console
  console.log(`Database settings - Migrations - ${new Date()} - ${message}`)
}

/**
 * @module Knex
 * @description Provide Mysql Connection into app consign Object.
 * @param {Object} app - A app Object provided by consign.
 */
module.exports = app => {
  const { local, development, production } = config
  const connection = knex(development)
  app.knex = connection
  migrate(connection)
}

const migrate = async (connection) => {
  let migrationsExecuted = 0
  await connection.migrate.latest()
    .then((action) => {
      const migrationsToExecute = action[1]
      migrationsToExecute.forEach(migration => {
        logger(`Running ${migration}...`)
        migrationsExecuted++
      })
    })
    .then(
      () => logger(`Database updated. - ${migrationsExecuted} migrations executed.`)
    )
}
