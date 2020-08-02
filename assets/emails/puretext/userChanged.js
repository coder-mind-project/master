module.exports = payload => {
  return `
        Alteração de informações\n\n
        Olá ${payload.username}, tudo bem? Um de nossos administradores alterou seus dados cadastrais dentro de nossa plataforma.\n\n
        Vamos lhe enviar as principais informações mais recentes da nossa base de dados:\n\n
        Nome completo: ${payload.username}\n
        Telefone de contato: ${payload.cellphone}\n
        E-mail: ${payload.email}\n
        Perfil: ${payload.accessLevel}\n\n
        Caso seu e-mail ou senha esteja diferente ao antigo, basta logar com as novas credênciais informadas.\n\n
        Se seus dados foram alterados sem sua permissão por favor entre em contato com o nosso suporte dentro do painel, acessando a opção "Fale Conosco" localizada ao clicar no seu avatar no menu superior. Em seguida informe a data da alteração junto com código abaixo:\n\n
        Código: ${payload._idUserAdmin}\n
        Data de alteração: ${payload.changeDate}\n\n
    `
}
