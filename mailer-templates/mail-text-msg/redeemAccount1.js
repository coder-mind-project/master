module.exports = (user, url, token) => {
    return `
        Recuperação de senha
        \n\n
        Olá ${user}, tudo bem? Vimos que você solicitou a recuperação de sua senha.
        \n\n
        Para recuperar sua senha basta clicar no link abaixo ou copiar o código e acessar a recuperação de senha por código na tela de login.
        \n\n
        Link: ${url}/redeem-account?token=${token}
        \n
        ou
        \n
        Código: ${token}
        \n\n
        Procedimento
        \n\n
        Existem duas maneiras de recuperar sua senha.
        \n
        1º método - Clicando no link :
        \n\n
        1 - Clique no link deste e-mail, em seguida será aberto uma página com dois campos de senha.
        \n
        2 - Insira sua nova senha no primeiro campo.
        \n
        3 - Repita essa nova senha no segundo campo.
        \n
        4 - Clique no botão escrito "Confirmar".
        \n
        5 - Aguarde um pouquinho.
        \n
        6 - E pronto! Sua nova senha já esta funcionando, o site irá redirecionar automaticamente para a página de login e assim basta incluir seu e-mail com sua nova senha.
        \n\n
        2º método - copiando o código :
        \n\n
        1 - Selecione o código e clique com o botão direito do mouse e selecione a opção "copiar" ou selecione o código e pressione as teclas "ctrl" e "c" do seu teclado.
        \n
        2 - Agora com o código copiado entre na tela de login do painel da coder mind.
        \n
        3 - Selecione a opção "Esqueceu seu e-mail/senha?".
        \n
        4 - Selecione a opção "Eu tenho o código".
        \n
        5 - Cole o código copiado no campo de texto, clique no campo com o botão esquerdo do mouse no campo de texto e em seguida clique com o botão direito e selecione a opção colar, ou clique com o botão esquerdo no campo de texto e pressione as teclas "ctrl" e "v" do seu teclado.
        \n
        6 - Clique em "Confirmar"
        \n
        7 - Aguarde um pouquinho.
        \n
        8 - Ao autenticar seu código será aberto uma página com dois campos de senha.
        \n
        9 - Insira sua nova senha no primeiro campo.
        \n
        10 - Repita essa nova senha no segundo campo.
        \n
        11 - Clique no botão escrito "Confirmar".
        \n
        12 - Aguarde um pouquinho novamente.
        \n
        13 - E pronto! Sua nova senha já esta funcionando, o site irá redirecionar automaticamente para a página de login e assim basta incluir seu e-mail com sua nova senha.
    `
}