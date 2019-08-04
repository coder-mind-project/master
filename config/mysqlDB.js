const mysql = require('mysql')

//Configuração de referencias de conexão com o banco de dados
const {dbLocal, dbProduction} = require('../.env')

module.exports = app => {
    const connection = mysql.createPool({
        ...dbLocal.mysql
    })
    
    /* Realiza a conexão com o banco mysql */
    connection.getConnection((err) => {
        if(err) {
            const msg = 'Error: Connection in mysql database failed, make sure your database is online - Error Stack: '
            console.log('\x1b[41m%s\x1b[37m', msg + err.stack, '\x1b[0m')
        }
    })

    app.mysql = connection
}
