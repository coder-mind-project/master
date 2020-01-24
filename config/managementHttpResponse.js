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
    const errorArticle = error => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }

        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Informe um título para o artigo':
            case 'Tema não informado':
            case 'Breve descrição inválida':
            case 'Máximo permitido 150 caracteres':
            case 'Máximo permitido 300 caracteres':
            case 'Máximo permitido 300 caracteres':
            case 'Corpo do artigo inválido':
            case 'Já existe um artigo com este link personalizado, considere alterar-lo':{
                reformulatedError.code = 400
                break
            }
            case 'Autor não encontrado':
            case 'URL não definida':{
                reformulatedError.code = 404
                break
            }

        }

        reformulatedError.msg = error

        return reformulatedError
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
            case 'Acesso não autorizado':
            case 'Token inválido, solicite uma nova recuperação de senha':
            case 'Token expirado, solicite uma nova recuperação de senha':
            case 'Acesso não autorizado, seu e-mail de acesso foi alterado.':{
                reformulatedError.code = 401
                break
            }
            case 'Token não informado':{
                reformulatedError.code = 400
                break
            }
            case 'Usuário não encontrado':{
                reformulatedError.code = 404
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
            case 'Senha incorreta':
            case 'Senha incorreta, esqueceu sua senha?': {
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
            case 'Ja existe cadastro com essas informações':
            case 'Está Url customizada já esta associada a outro usuário, tente uma outra url':
            case 'É necessário informar sua senha para prosseguir':
            case 'Senha inválida':
            case 'Este e-mail já está cadastrado':
            case 'Emissor inválido!':{
                reformulatedError.code = 400
                break
            }
            case 'Acesso negado, somente administradores podem remover outros usuários':
            case 'Acesso negado, somente administradores podem alterar a senha de outros usuários':
            case 'Senha incorreta': {
                reformulatedError.code = 401
                break
            }
            case 'Token não reconhecido, se persistir reporte':
            case 'Token expirado, solicite uma nova troca de e-mail':
            case 'Este usuário não pode ser removido':{
                reformulatedError.code = 403
                break
            }
            case 'Usuário não encontrado':{
                reformulatedError.code = 404
                break
            }
            case 'Este usuário já foi removido':
            case 'Imagem já removida':
            case 'Este usuário já foi restaurado': {
                reformulatedError.code = 410
                break
            }
            case 'Já foi enviado um e-mail a pouco tempo, espere um pouco até enviar outro novamente. Verifique sua caixa de spam.':{
                reformulatedError.code = 429
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

    const notAcceptableResource = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Recurso não disponível para o usuário':{
                reformulatedError.code = 406
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError 
    }


    const errorRedeemPassword = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'Insira uma senha válida, de no mínimo 8 caracteres':
            case 'Confirmação de senha inválida, informe no mínimo 8 caracteres':
            case 'As senhas não conferem':{
                reformulatedError.code = 400
                break
            }
            case 'Ocorreu um erro ao alterar sua senha, se persistir reporte':{
                reformulatedError.code = 506
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError 
    }

    const ticketError = (error) => {
        const reformulatedError = {
            code: 500,
            msg: 'Ocorreu um erro desconhecido, se persistir reporte'
        }
        
        if( typeof error !== 'string' ) return reformulatedError
        if( error.trim() === '' ) return reformulatedError

        switch(error){
            case 'É necessário descrever seu problema para enviar o ticket':
            case 'E-mail inválido, tente fornecer um e-mail válido!':
            case 'Código não informado, é necessário informar o código.':
            case 'Data de alteração não informada.':
            case 'Este é um código inválido, caso esteja inserindo o código corretamente, nos envie um ticket de reporte de bugs':
            case 'Informe o software que ocorreu o bug':
            case 'Informe o dispositivo que ocorreu o bug':
            case 'Informe o browser / navegador em que ocorreu o bug':{
                reformulatedError.code = 400
                break
            }
            case 'Acesso negado':{
                reformulatedError.code = 401
                break
            }
        }

        reformulatedError.msg = error

        return reformulatedError 
    }

    return {errorTheme, errorCategory, errorArticle,
        errorManagementArticles, validateTokenManagement,
        signInError, userError, errorView, notAcceptableResource,
        errorRedeemPassword, ticketError}
} 