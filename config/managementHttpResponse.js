/**
 *  Este aquivo contém funções responsáveis por personalizar mensagens de erro
 *  e também por alterar códigos HTTPresponse
 *  Saiba mais aqui: https://www.restapitutorial.com/httpstatuscodes.html
 * 
 */

module.exports = app => {
    
    /*  Responsável por verificar o código de erro
        devolvido pela api do mongoose
        Usado pela api de categories. Usado única e 
        exclusivamente para verificar o tipo de ocorrencia de erro
        ao persistir uma categoria. Para assim 
        gerar uma mensagem de precisão do erro ocorrido.
    */
    const errorTheme = error => {

        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) {
            
            if(error.name === 'CastError'){
                reformulatedError.code = 404
                reformulatedError.msg = 'Tema não encontrado'
            }
            
            return reformulatedError
        }
        
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Tema não informado':{
                reformulatedError.code = 400
                break
            }
            case 'Ja existe tema com este nome':{
                reformulatedError.code = 409
                break
            }
            case 'Tema não encontrado':{
                reformulatedError.code = 404
                break
            }
            case 'Este tema já foi excluído': {
                reformulatedError.code = 410
                break
            }
            case 'Acesso não autorizado, somente administradores podem remover temas':{
                reformulatedError.code = 401
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }


    /*  Responsável por verificar o código de erro
        devolvido pela api do mongoose
        Usado pela api de categories. Usado única e 
        exclusivamente para verificar o tipo de ocorrencia de erro
        ao persistir uma categoria. Para assim 
        gerar uma mensagem de precisão do erro ocorrido.
    */
    const errorCategory = error => {

        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) {
            
            if(error.name === 'CastError'){
                reformulatedError.code = 404
                reformulatedError.msg = 'Categoria não encontrada'
            }
            
            return reformulatedError
        }

        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Categoria não informada':{
                reformulatedError.code = 400
                break
            }
            case 'Ja existe categoria com este nome':{
                reformulatedError.code = 409
                break
            }
            case 'Categoria não encontrada':{
                reformulatedError.code = 404
                break
            }
            case 'Este categoria já foi excluída': {
                reformulatedError.code = 410
                break
            }
            case 'Acesso não autorizado, somente administradores podem remover categorias':{
                reformulatedError.code = 401
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }


    /*  Responsável por verificar o código de erro
        devolvido pela da api do mongoose
        Usado pela API de articles, porém pode ser usada em
        Qualquer outro caso que envolva URLs personalizadas.
    */
    const errorCustomURL = error => {
        let codeError = 500
        if(error.code && error.code === 11000){
            codeError = 400
            return {codeError, msg: 'O link personalizado informado já se encontra em uso, por favor informe outro'}
        }
        else
            return {codeError, msg: 'Ocorreu um erro desconhecido, se persistir reporte'}    
    }


    const errorManagementArticles = error => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Artigo não encontrado':{
                reformulatedError.code = 404
                break
            }
            case 'Esse artigo esta excluído, não é possível publicá-lo':
            case 'Esse artigo já está publicado':
            case 'Este artigo não está publicado, publique-o primeiro':
            case 'Este artigo está inativo, não é possível impulsioná-lo':
            case 'Este artigo já está impulsionado':
            case 'Este artigo não está publicado, considere removê-lo':
            case 'Este artigo já está ativo':
            case 'Artigos publicados não podem ser removidos, considere inativar o artigo':
            case 'Nenhum método definido, consulte a documentação': {
                reformulatedError.code = 400
                break
            }
            case 'Operação realizada com sucesso, porém nada foi alterado':{
                reformulatedError.code = 200
                break
            }
            case 'Este artigo está excluído, não é possível impulsioná-lo':
            case 'Esse artigo esta excluído, não é possível inativá-lo':{
                reformulatedError.code = 410
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }

    const validateTokenManagement = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Acesso não autorizado':{
                reformulatedError.code = 401
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }

    const signInError = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'E-mail inválido':
            case 'É necessário informar uma senha':
            case 'Não encontramos um cadastro com estas credenciais':
            case 'Captcha inválido':{
                reformulatedError.code = 400
                break
            }
            case 'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema':
            case 'Senha incorreta': {
                reformulatedError.code = 401

            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }

    const userError = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ){
            
            if(error.name === 'CastError'){
                reformulatedError.code = 404
                reformulatedError.msg = 'Usuário não encontrado'
            }
            
            return reformulatedError
        }

        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Nome inválido':
            case 'E-mail inválido':
            case 'Genero inválido':
            case 'Tipo de usuário inválido':
            case 'CPF inválido':
            case 'Número de telefone inválido':
            case 'Número de celular inválido':
            case 'Ja existe cadastro com essas informações':{
                reformulatedError.code = 400
                break
            }
            case 'Acesso negado, somente administradores podem remover outros usuários':
            case 'Acesso negado, somente administradores podem alterar a senha de outros usuários': {
                reformulatedError.code = 401
                break
            }
            case 'Usuário não encontrado':{
                reformulatedError.code = 404
                break
            }
            case 'Este usuário já foi removido':
            case 'Imagem já removida': {
                reformulatedError.code = 410
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError
    }
    

    const errorView = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Artigo não encontrado':{
                reformulatedError.code = 400
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError 
    }


    return {errorTheme, errorCategory, errorCustomURL,
        errorManagementArticles, validateTokenManagement,
        signInError, userError, errorView}
} 