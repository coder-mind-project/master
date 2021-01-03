const { dbProduction } = require('./config/environment')

/**
 * @module knexfile
 * @description MySQL connection settings
 */
module.exports = {
  production: { ...dbProduction.mysql }
}
