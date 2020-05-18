const { dbLocal, dbProduction, dbDevelopment } = require('./config/environment')

/**
 * @module knexfile
 * @description MySQL connection settings
 */
module.exports = {
  development: { ...dbDevelopment.mysql },
  production: { ...dbProduction.mysql },
  local: { ...dbLocal.mysql }
}
