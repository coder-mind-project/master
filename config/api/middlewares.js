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

/* Lista de origins permitidos para consumo da api */
/*  
    Adicione somente mais origins em casos de novas
    aplicações que irão consumir a mesma
*/

//const whiteList = ['https://painel.codermind.com.br', 'https://codermind.com.br']

/*      
    Configurações de acesso aos middlewares via cors
    Saiba mais em: https://www.npmjs.com/package/cors

    Ao omitir este valor no parametro da função cors será permitido
    Acesso de qualquer origin
*/

const options = {
    origin: (origin, callback) => {
        if(whiteList.indexOf(origin) !== -1){
            callback(null, true)
        }else{
            callback(new Error('Not allowed by CORS'))
        }
    }
}


module.exports = app => {
    app.use(bodyParser.json({limit: '10mb'}))
    //use options param
    app.use(cors())
}