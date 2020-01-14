const {notAcceptableResource} = require('./managementHttpResponse.js')()

module.exports = {
    
    isAdmin: (middleware) => {
        return async (req, res, next) => {
            const isAdmin = Boolean(req.user && req.user.user && req.user.user.tagAdmin)
            if(isAdmin){
                middleware(req, res, next)
            }else{
                const error = await notAcceptableResource('Recurso não disponível para o usuário') 
                return res.status(406).send(error.msg)
            }
        }
    }

}