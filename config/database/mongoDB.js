const mongoose = require('mongoose')

const { dbProduction } = require('../../config/environment')

const url = dbProduction.mongo.url

/**
 * @function
 * @description Allow connection with MongoDB database.
 */
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .catch(e => {
    const msg = `Error: Connection in mongo database failed, make sure your database is online - Stack: ${e}`
    // eslint-disable-next-line no-console
    console.log('\x1b[41m%s\x1b[37m', msg, '\x1b[0m')
  })
