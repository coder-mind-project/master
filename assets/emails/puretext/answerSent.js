module.exports = payload => `
Olá ${payload.user} tudo bem? =D

O autor ${payload.author} respondeu seu comentário no artigo ${payload.article} ! ;)

Clique no link abaixo para visualizar a resposta de nosso autor

${payload.url}

`
