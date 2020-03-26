module.exports = payload => {
    return `
        Recebemos seu ticket\n\n
        Esta é uma mensagem automática, indicando que recebemos o seu ticket. Agora basta esperar por uma resposta do nosso suporte!\n\n
        Segue abaixo o código de seu ticket:\n\n
        Código:${payload._id}\n
        Ticket gerado em: ${payload.createdAt}\n\n
        Caso o código seja solicitado informe o código acima. Agradecemos seu contato, já já retoremos contato ;).
    `
}