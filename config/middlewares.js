/*  Aqui está presente configurações para acesso aos
    middlewares da aplicação
*/

/* Lista de origins permitidos para consumo da api */
/*  
    Adicione somente mais origins em casos de novas
    aplicações que irão consumir a mesma
*/
//const whiteList = ['http://localhost:3001']

/*      
    Configurações de acesso aos middlewares via cors
    Saiba mais em: https://www.npmjs.com/package/cors

    Ao omitir este valor no parametro da função cors será permitido
    Acesso de qualquer origin
*/

const bodyParser = require('body-parser')
const cors = require('cors')

module.exports = app => {
    app.use(bodyParser.json({limit: '10mb'}))
    //use options param
    app.use(cors())
}