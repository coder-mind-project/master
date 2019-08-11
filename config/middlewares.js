/*  Aqui está presente configurações para acesso aos
    middlewares da aplicação
*/

const bodyParser = require('body-parser')
const cors = require('cors')

module.exports = app => {
    app.use(bodyParser.json({limit: '10mb'}))
    app.use(cors())
}