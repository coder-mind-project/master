module.exports = payload => {
    return `
        E-mail desvinculado da conta\n\n
        Olá tudo bem? Um de nossos administradores alterou seus dados cadastrais dentro de nossa plataforma e seu e-mail foi alterado!\n\n
        Infelizmente você não possui mais acesso com as credênciais antigas.\n\n
        Caso a mudança foi feita com seu consentimento pode desconsiderar o restante de nossa mensagem, seu novo acesso estará disponível no novo e-mail cadastrado!\n\n
        Caso esta mudança não foi devidamente autorizada você pode entrar com um ticket no site da plataforma acessando o link abaixo:\n\n
        Copie o link e cole no seu navegador para solicitar o envio do ticket:\n
        Link: https://painel.codermind.com.br/ticket?aid=${payload._idAdmin}&uid=${payload._idUser}=&mail=${payload.email}&date=${payload.date}\n\n
        Para a recuperação de sua conta, é necessário enviar informações obrigatórias (descritas abaixo), ao clicar no link não é necessário informar diretamente pois nós ja trabalhamos de preencher os essas informações  para você, porém certifique-se que as informações obrigatórias estejam presentes.\n\n
        \n
        Primeiro código: ${payload._idAdmin}
        \n
        Segundo código: ${payload._idUser}
        \n
        Data de alteração: ${payload.date}
        \n\n
        Como funciona a recuperação de conta?\n\n
        Será necessário o envio do ticket, explique seu problema e envie as informações obrigatórias:\n\n
        \n
        Primeiro código
        \n
        Segundo código
        \n
        Data de alteração
        \n\n
        É importante descrever o máximo possível seu problema, com o máximo de informações possíveis de sua conta, pois isso garante a autenticidade. \n
        Ao enviar o ticket o suporte será acionado e será feito uma análise manual do seu problema.\n
        Caso constate que a troca de e-mail foi indevida, retornaremos o contato neste e-mail mesmo para lhe passar suas novas credenciais de acesso.\n\n
        Caso contrário também retornaremos o contato incluindo o motivo da não recuperação.\n\n
        `
}