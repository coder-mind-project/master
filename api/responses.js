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
  const themeError = stack => {
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
          case 'Este tema já foi excluído':
          case 'Este tema foi excluído': {
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
  const categoryError = stack => {
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
          case 'Descrição muito grande, máximo permitido são de 100 caracteres':
          case 'Identificador do tema inválido': {
            reformulatedError.code = 400
            break
          }
          case 'Categoria não encontrada':
          case 'Identificador do tema não encontrado': {
            reformulatedError.code = 404
            break
          }
          case 'Esta categoria já foi excluída':
          case 'Esta categoria foi excluída':
          case 'Este tema não consta em nossa base de dados ou encontra-se inativo': {
            reformulatedError.code = 410
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

  /**
   * @function
   * @description Manage error responses for Auth module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Auth
   */
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

  /**
   * @function
   * @description Manage authentication responses for RedeemAccount module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule RedeemAccount
   */
  const redeemAccountError = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    const { name, description } = { ...stack }

    switch (description) {
      case 'Captcha inválido':
      case 'E-mail inválido':
      case 'É necessário fornecer um endereço de e-mail válido para contato':
      case 'Token não informado':
      case 'Identificador inválido':
      case 'Senha inválida, é necessário pelo menos 8 caracteres':
      case 'Senha de confirmação inválida, é necessário pelo menos 8 caracteres':
      case 'As senhas não coincidem': {
        reformulatedError.code = 400
        break
      }
      case 'Este usuário já realizou autenticação, para remover a conta se autentique e exclua manualmente': {
        reformulatedError.code = 403
        break
      }
      case 'Usuário não encontrado': {
        reformulatedError.code = 404
        break
      }
      case 'Token inválido, solicite uma nova recuperação de senha': {
        reformulatedError.code = 410
        break
      }
    }

    pending = name
    reformulatedError.msg = description

    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  /**
   * @function
   * @description Manage error responses for Articles module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Article
   */
  const articleError = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    switch (stack.name) {
      case 'CastError': {
        if (stack.kind === 'ObjectId') {
          pending = stack.path
          reformulatedError.msg = 'Identificador inválido'
        }

        reformulatedError.code = 400
        break
      }
      case 'ValidationError': {
        const errors = Object.keys(stack.errors)
        if (!errors.length) {
          pending = 'InternalError'
        } else {
          const { path, value } = stack.errors[errors[0]]
          pending = path
          reformulatedError.msg = `O valor '${value}' não é um valor enumerável válido`

          reformulatedError.code = 400
        }
        break
      }
      default: {
        const { name, description } = stack

        switch (description) {
          case 'É necessário incluir um titulo ao artigo':
          case 'É necessário adicionar um tema antes de incluir uma categoria':
          case 'É necessário incluir um endereço personalizado válido': {
            reformulatedError.code = 400
            break
          }
          case 'Não é possível alterar o artigo de outro autor': {
            reformulatedError.code = 403
            break
          }
          default: {
            reformulatedError.code = 500
          }
        }

        pending = name
        reformulatedError.msg = description
      }
    }

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

  /**
   * @function
   * @description Manage error responses for Users module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Users
   */
  const userError = stack => {
    let pending = ''
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    switch (stack.name) {
      case 'ValidationError': {
        const { errors } = { ...stack }

        if (errors) {
          if (errors.email && errors.email.kind === 'unique') {
            pending = 'email'
            reformulatedError.msg = 'Este e-mail já esta associado a uma outra conta, tente outro endereço de e-mail'
          } else if (errors.customUrl && errors.customUrl.kind === 'unique') {
            pending = 'customUrl'
            reformulatedError.msg = 'Esta url personalizada já está cadastrada'
          } else {
            if (errors.cellphone && errors.cellphone.kind === 'unique') {
              pending = 'cellphone'
              reformulatedError.msg = 'Este número de telefone já esta associado a uma outra conta, tente outro número'
            } else {
              pending = 'MongoDB'
              reformulatedError.msg = 'Existe alguma restrição não mapeada, por favor reporte este problema'
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
          case 'Identificador inválido':
          case 'Nome inválido':
          case 'É necessário informar um nome':
          case 'E-mail inválido':
          case 'Genero inválido':
          case 'Gênero inválido':
          case 'É necessário informar um genero':
          case "Tipo de usuário inválido, escolha entre 'author' e 'admin'":
          case 'Tipo de usuário inválido':
          case 'Número de celular inválido':
          case 'Número de telefone inválido':
          case 'Ja existe cadastro com essas informações':
          case 'Url personalizada inválida':
          case 'Está Url customizada já esta associada a outro usuário, tente uma outra url':
          case 'É necessário informar sua senha para prosseguir':
          case 'Senha inválida':
          case 'Senha não informada':
          case 'Este e-mail já está cadastrado':
          case 'Emissor inválido!':
          case 'A senha precisa ter no mínimo 8 caracteres':
          case 'Informe uma senha de pelo menos 8 caracteres':
          case 'Senha inválida, é necessário pelo menos 8 caracteres':
          case 'Senha de confirmação inválida, é necessário pelo menos 8 caracteres':
          case 'As senhas não coincidem':
          case 'Senha não confere, esqueceu sua senha?':
          case 'Este endereço de e-mail já está cadastrado': {
            reformulatedError.code = 400
            break
          }
          case 'Acesso negado, somente administradores podem alterar a senha de outros usuários':
          case 'Senha incorreta':
          case 'Emissor inválido': {
            reformulatedError.code = 401
            break
          }
          case 'Token não reconhecido, se persistir reporte':
          case 'Token expirado, solicite uma nova troca de e-mail':
          case 'Acesso negado, somente administradores podem remover outros usuários':
          case 'Este usuário não pode ser removido':
          case 'Recurso não disponível para este usuário':
          case 'Não permitido para acessar este recurso': {
            reformulatedError.code = 403
            break
          }
          case 'Usuário não encontrado':
          case 'Imagem não encontrada':
          case 'Não existe pendência de troca de e-mail': {
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
          default: {
            reformulatedError.code = 500
          }
        }

        pending = name
        reformulatedError.msg = description
      }
    }

    reformulatedError[pending] = 'pending'
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

  /**
   * @function
   * @description Manage error responses for AccessLevel module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule AccessLevel
   */
  const notAcceptableResource = stack => {
    const reformulatedError = {
      code: 500,
      msg: 'Ocorreu um erro desconhecido, se persistir reporte'
    }

    const { description, problem, solution } = stack
    switch (description) {
      case 'Recurso não disponível para o usuário':
      case 'Resource not allowed for this user': {
        reformulatedError.code = 403
        break
      }
    }

    reformulatedError.msg = description
    reformulatedError.problem = problem
    reformulatedError.solution = solution

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
          case 'É necessário informar uma resposta': {
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
        reformulatedError[name === 'msg' ? 'message' : 'msg'] = description
      }
    }
    reformulatedError[pending] = 'pending'
    return reformulatedError
  }

  /**
   * @function
   * @description Manage error responses for Comments module
   * @param {Object} stack - A raw Error stack
   * @returns {Object} - A refined Error stack
   *
   * @forModule Comments
   */
  const commentError = stack => {
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
          case 'Tipo de comentário inválido':
          case 'Tipo de comentários inválido':
          case 'Tipo de respostas inválido':
          case 'Ordem de respostas inválida':
          case 'Ordem de comentários inválido':
          case 'Identificador inválido':
          case 'É necessário informar alguma resposta': {
            reformulatedError.code = 400
            break
          }
          case 'Acesso não autorizado': {
            reformulatedError.code = 403
            break
          }
          case 'Comentário não encontrado':
          case 'Usuário não encontrado':
          case 'Resposta não encontrada':
          case 'Somente respostas podem ser editadas':
          case 'Este usuário não possui configurações de comentário definida': {
            reformulatedError.code = 404
            break
          }
          case 'Este comentário já esta marcado como lido':
          case 'Não existem comentários não lidos':
          case 'Este comentário já esta desabilitado':
          case 'Este comentário já esta habilitado':
          case 'Somente respostas habilitadas podem ser editadas': {
            reformulatedError.code = 410
            break
          }
          default: {
            reformulatedError.code = 500
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
    themeError,
    categoryError,
    authError,
    redeemAccountError,
    commentError,
    articleError,
    errorArticle,
    errorManagementArticles,
    userError,
    errorView,
    notAcceptableResource,
    ticketError
  }
}
