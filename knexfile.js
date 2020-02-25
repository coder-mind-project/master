const { dbLocal, dbProduction, dbDevelopment } = require('./.env')

/**
 * @module knexfile
 * @description MySQL connection settings
 */
module.exports = {
  development: { ...dbDevelopment.mysql },
  production: { ...dbProduction.mysql },
  local: { ...dbLocal.mysql }
}
