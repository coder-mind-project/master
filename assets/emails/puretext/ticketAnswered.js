module.exports = payload => {
    return `
        Seu ticket foi respondido\n\n
        ​Olá, tudo bem? Seu ticket ${payload.ticket} foi respondido:\n
        \n
        ${payload.answer}
        \n\n
        Esta é uma mensagem automática, caso queira mandar mais alguma mensagem ou respondê-la, basta clicar no botão acima.\n\n
        Caso não queira responder, basta não clicar no botão de resposta. Esperamos ter te ajudado =D\n
    `
}