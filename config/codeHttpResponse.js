module.exports = app => {
    const errorTheme = error => {
        let codeError = 500
        if(typeof error === 'string'){
            switch(error){
                case 'Ja existe tema com este nome':{
                    codeError = 400
                    break
                }
                case 'Tema não encontrado [Code: 1]':{
                    codeError = 400
                    break
                }
            }
        }
        return codeError
    }

    const errorURL = error => {
        let codeError = 500
        if(error.code && error.code === 11000){
            codeError = 400
            return {codeError, msg: 'O link personalizado informado já se encontra em uso, por favor informe outro'}
        }
        else
            return {codeError, msg: 'Ocorreu um erro desconhecido, se persistir reporte'}    
    }

    return {errorTheme, errorURL}
} 