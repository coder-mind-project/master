const mongoose = require('mongoose')

//Configuração de referencias de conexão com o banco de dados
const {dbLocal, dbProduction} = require('../.env')

const config = dbLocal

const url = config.mongo.url
const user = config.mongo.user
const pass = config.mongo.pass
const dbName = config.mongo.dbName

/* Realiza a conexão com o banco mongoDB */
mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    dbName,
    user,
    pass
}).catch(e => {
        const msg = `Error: Connection in mongo database failed, make sure your database is online - Stack: ${e}`
        console.log('\x1b[41m%s\x1b[37m', msg, '\x1b[0m')
    })

