//Configuração de referencias de conexão com o banco de dados
const { dbLocal, dbProduction, dbDevelopment } = require('./.env')

module.exports = {
  development: {...dbDevelopment.mysql},
  production: {...dbProduction.mysql},
  local: {...dbLocal.mysql}
}
