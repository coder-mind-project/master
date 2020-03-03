/**
 *  @function
 *  @module httpResponses
 *  @description Provide methods that return ideal response by error.
 *  @param {Object} app - A app Object provided by consign.
 *  @returns {Object} Containing some functions for manage errors.
 */
module.exports = app => {
  /**
   * @function
   * @description Manage error responses for Theme module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Theme
   */
  const errorTheme = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    switch (stack.name) {
      case 'ValidationError': {
        const { errors } = { ...stack }

        if (errors.name) {
          pending = 'name'
          switch (errors.name.kind) {
            case 'unique': {
              reformulatedError.msg = 'Este tema já está cadastrado'
              break
            }
            default: {
              reformulatedError.msg = 'Nome do tema não informado'
            }
          }
        }

        reformulatedError.code = 400
        break
      }
      case 'CastError': {
        if (stack.kind === 'ObjectId') {
          pending = 'id'
          reformulatedError.msg = 'Identificador inválido'
        }

        reformulatedError.code = 400
        break
      }
      default: {
        const { name, description } = { ...stack }

        switch (description) {
          case 'Nome do tema não informado':
          case 'Ja existe tema com este nome': {
            reformulatedError.code = 400
            break
          }
          case 'Tema não encontrado': {
            reformulatedError.code = 404
            break
          }
          case 'Este tema já foi excluído': {
            reformulatedError.code = 410
            break
          }
          case 'Acesso não autorizado, somente administradores podem remover temas': {
            reformulatedError.code = 401
            break
          }
          default: {
            reformulatedError.code = 400
          }
        }

        pending = name
        reformulatedError.msg = description
      }
    }

    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  /**
   * @function
   * @description Manage error responses for Category module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Category
   */
  const errorCategory = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    switch (stack.name) {
      case 'ValidationError': {
        const { errors } = { ...stack }

        if (errors.name) {
          pending = 'name'
          switch (errors.name.kind) {
            case 'unique': {
              reformulatedError.msg = 'Esta categoria já está cadastrada'
              break
            }
            default: {
              reformulatedError.msg = 'Nome da categoria não informado'
            }
          }
        }

        reformulatedError.code = 400
        break
      }
      case 'CastError': {
        if (stack.kind === 'ObjectId') {
          pending = 'id'
          reformulatedError.msg = 'Identificador inválido'
        }

        reformulatedError.code = 400
        break
      }
      default: {
        const { name, description } = { ...stack }

        switch (description) {
          case 'Nome da categoria não informado':
          case 'Tema não informado':
          case 'Categoria muito grande, máximo permitido são 30 caracteres':
          case 'Apelido muito grande, máximo permitido são 30 caracteres':
          case 'Descrição muito grande, máximo permitido são de 100 caracteres': {
            reformulatedError.code = 400
            break
          }
          case 'Categoria não encontrada':
          case 'Identificador do tema não encontrado': {
            reformulatedError.code = 404
          }
        }

        pending = name
        reformulatedError.msg = description
      }
    }

    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  const authError = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    const { name, description } = { ...stack }

    switch (description) {
      case 'Captcha inválido':
      case 'É necessário informar um e-mail ou username':
      case 'É necessário informar uma senha':
      case 'Descrição muito grande, máximo permitido são de 100 caracteres': {
        reformulatedError.code = 400
        break
      }
      case 'Sua conta esta suspensa, em caso de reinvidicação entre em contato com o administrador do sistema':
      case 'E-mail ou senha inválidos': {
        reformulatedError.code = 401
        break
      }
    }

    pending = name
    reformulatedError.msg = description

    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  const errorArticle = error => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    if (typeof error !== 'string') return reformulatedError
    if (error.trim() === '') return reformulatedError

    switch (error) {
      case 'Informe um título para o artigo':
      case 'Tema não informado':
      case 'Breve descrição inválida':
      case 'Máximo permitido 150 caracteres':
      case 'Máximo permitido 300 caracteres':
      case 'Corpo do artigo inválido':
      case 'Já existe um artigo com este link personalizado, considere alterar-lo': {
        reformulatedError.code = 400
        break
      }
      case 'Autor não encontrado':
      case 'URL não definida': {
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

    if (typeof error !== 'string') return reformulatedError
    if (error.trim() === '') return reformulatedError

    switch (error) {
      case 'Artigo não encontrado': {
        reformulatedError.code = 404
        break
      }
      case 'Esse artigo já está publicado':
      case 'Este artigo não está publicado, publique-o primeiro':
      case 'Este artigo está inativo, não é possível impulsioná-lo':
      case 'Este artigo já está impulsionado':
      case 'Este artigo não está publicado, considere removê-lo':
      case 'Este artigo já está ativo':
      case 'Nenhum método definido, consulte a documentação':
      case 'O id não foi reconhecido, forneça um identificador válido': {
        reformulatedError.code = 400
        break
      }
      case 'Artigos publicados não podem ser removidos, considere inativar o artigo':
      case 'Esse artigo esta excluído, não é possível publicá-lo':
      case 'Este artigo está excluído, não é possível impulsioná-lo':
      case 'Esse artigo esta excluído, não é possível inativá-lo': {
        reformulatedError.code = 410
        break
      }
    }

    reformulatedError.msg = error

    return reformulatedError
  }

  const userError = error => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    if (typeof error !== 'string') {
      if (error.name === 'CastError') {
        reformulatedError.code = 404
        reformulatedError.msg = 'Usuário não encontrado'
      }

      return reformulatedError
    }

    if (error.trim() === '') return reformulatedError

    switch (error) {
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
      case 'Emissor inválido!':
      case 'A senha precisa ter no mínimo 8 caracteres':
      case 'Senha não confere, esqueceu sua senha?': {
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
      case 'Este usuário não pode ser removido': {
        reformulatedError.code = 403
        break
      }
      case 'Usuário não encontrado': {
        reformulatedError.code = 404
        break
      }
      case 'Este usuário já foi removido':
      case 'Imagem já removida':
      case 'Este usuário já foi restaurado': {
        reformulatedError.code = 410
        break
      }
      case 'Já foi enviado um e-mail a pouco tempo, espere um pouco até enviar outro novamente. Verifique sua caixa de spam.': {
        reformulatedError.code = 429
        break
      }
    }

    reformulatedError.msg = error

    return reformulatedError
  }

  const errorView = error => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    if (typeof error !== 'string') return reformulatedError
    if (error.trim() === '') return reformulatedError

    switch (error) {
      case 'Artigo não encontrado': {
        reformulatedError.code = 400
        break
      }
    }

    reformulatedError.msg = error

    return reformulatedError
  }

  const notAcceptableResource = error => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    if (typeof error !== 'string') return reformulatedError
    if (error.trim() === '') return reformulatedError

    switch (error) {
      case 'Recurso não disponível para o usuário': {
        reformulatedError.code = 403
        break
      }
    }

    reformulatedError.msg = error

    return reformulatedError
  }

  const errorRedeemPassword = error => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    if (typeof error !== 'string') return reformulatedError
    if (error.trim() === '') return reformulatedError

    switch (error) {
      case 'Insira uma senha válida, de no mínimo 8 caracteres':
      case 'Confirmação de senha inválida, informe no mínimo 8 caracteres':
      case 'As senhas não conferem':
      case 'E-mail inválido':
      case 'Captcha inválido':
      case 'CPF inválido':
      case 'Número de telefone inválido':
      case 'É necessário fornecer um endereço de e-mail válido para contato': {
        reformulatedError.code = 400
        break
      }
      case 'Não encontramos uma conta com este e-mail, tem certeza que seu e-mail está certo?': {
        reformulatedError.code = 404
        break
      }
      case 'Ocorreu um erro ao enviar o e-mail': {
        reformulatedError.code = 500
        break
      }
      case 'Ocorreu um erro ao alterar sua senha, se persistir reporte': {
        reformulatedError.code = 506
        break
      }
    }

    reformulatedError.msg = error

    return reformulatedError
  }

  /**
   * @function
   * @description Manage error responses for Ticket module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Ticket
   */
  const ticketError = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    switch (stack.name) {
      case 'CastError': {
        if (stack.kind === 'ObjectId') {
          pending = 'id'
          reformulatedError.msg = 'Identificador inválido'
        }

        reformulatedError.code = 400
        break
      }
      default: {
        const { name, description } = { ...stack }
        switch (description) {
          case 'É necessário descrever seu problema para enviar o ticket':
          case 'E-mail inválido, tente fornecer um e-mail válido':
          case 'Código não informado, é necessário informar o código':
          case 'Data de alteração não informada':
          case 'Este é um código inválido, caso esteja inserindo o código corretamente, nos envie um ticket de reporte de bugs':
          case 'Informe o software que ocorreu o bug':
          case 'Informe o dispositivo que ocorreu o bug':
          case 'Informe o browser / navegador em que ocorreu o bug':
          case 'Informe o local em que deseja a melhoria':
          case 'Informe um tipo de ticket válido':
          case 'É necessário informar uma reposta': {
            reformulatedError.code = 400
            break
          }
          case 'Acesso negado': {
            reformulatedError.code = 401
            break
          }
          case 'Ticket não encontrado': {
            reformulatedError.code = 404
            break
          }
        }
        pending = name
        reformulatedError.msg = description
      }
    }

    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  return {
    errorTheme,
    errorCategory,
    authError,
    errorArticle,
    errorManagementArticles,
    userError,
    errorView,
    notAcceptableResource,
    errorRedeemPassword,
    ticketError
  }
}
