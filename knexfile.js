//Configuração de referencias de conexão com o banco de dados
const { dbLocal, dbProduction} = require('./.env')

module.exports = {
  development: {...dbLocal.mysql},
  production: {...dbProduction.mysql}
}
