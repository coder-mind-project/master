module.exports = payload => {
  return ` Seja bem vindo a Coder Mind
    \n\n
    Um de nossos administradores registrou uma nova conta neste endereço de e-mail, e o que isto significa?
    \n
    Significa que você está sendo convidado para ser um de nossos ${payload.accessLevel} da nossa plataforma. Esse convite ficará disponível por 7 días e depois não será possível ter acesso a nossa plataforma em caso de não acesso durante esse tempo.
    \n
    Para prosseguir basta acessar com as credenciais abaixo:
    \n\n
    E-mail: ${payload.email}
    \n
    Senha: ${payload.password}
    \n\n
    Você pode acessar nosso painel no link: 
    \n
    https://painel.codermind.com.br
    \n\n
    Ao entrar em nossa plataforma pedimos que altere sua senha, esta é confidencial, não repasse-a para ninguém.
    \n\n
    Esperamos que goste da experiência, estamos ansiosos para tê-lo conosco!
    \n
    Caso não deseje ser um ${payload.accessLevel} da nossa plataforma? Copie o link abaixo e cole no seu navegador:
    \n
    ${payload.notAcceptAccountLink}
    \n\n
    © Coder Mind - 2021
    \n
    www.codermind.com.br
    \n\n\n\n
    `
}
