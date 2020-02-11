const knex = require('knex')
const config = require('../knexfile.js')

module.exports = app => {
    const {development, production} = config
    const connection = knex(development)
    app.knex = connection
}
