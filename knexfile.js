/**
 * @module knexfile
 * @description MySQL connection settings
 */
const { dbLocal, dbProduction, dbDevelopment } = require('./.env')

module.exports = {
  development: { ...dbDevelopment.mysql },
  production: { ...dbProduction.mysql },
  local: { ...dbLocal.mysql }
}
