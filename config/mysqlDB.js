const knex = require('knex')

//Configuração de referencias de conexão com o banco de dados
const {dbLocal, dbProduction} = require('../.env')

module.exports = app => {

    const connection = knex(dbProduction.mysql);

    app.knex = connection
}
