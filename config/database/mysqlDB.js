const knex = require('knex')
const config = require('../../knexfile.js')

/**
 * @module Knex
 * @description Provide Mysql Connection into app consign Object.
 * @param {Object} app - A app Object provided by consign.
 */
module.exports = app => {
  const { local, development, production } = config
  const connection = knex(development)
  app.knex = connection
}
