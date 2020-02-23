# Coder Mind - Panel

Available Languages: 

 - [PT-BR](#pt-br)

URL repository: <https://github.com/allanalves23/Coder-Mind-Panel-API>
Doc version: 1.0
For API version: 1.0.4 (master) 

#### Contact

 - E-mail: allan.codermind@gmail.com
 - Owner: Coder Mind
___

### Sumário
 
 - [Ambiente](#ambiente)
 - [Dependências](#dependências)
	 - [Aplicação](#aplicação)
	 - [Desenvolvimento](#desenvolvimento)
  - [Base de dados](#banco)
	  - [MongoDB](#mysql)
		  - Schemas
	  - MySQL 
		  - Entidades
		  - Relacionamentos

## Ambiente

Entender sobre os ambientes de software são fundamentais para manter um software de qualidade, apis da Coder Mind possuem uma configuração baseada no **Node.JS**, um runtime monothread que permite um cenário full stack na linguagem **Javascript**.

Para gerênciar o servidor web é mantido uma dependência Node.JS denominado **Express.js** que permite um funcionamento de recursos através de implementação de middlewares.

Para a implementação do armazenamento de dados atualmente existem duas bases, o motivo por essa opção é referênte a escalabidade da aplicação ao longo do tempo,  mudanças sobre a estrutura e aos dados em si.
As tecnologias utilizadas para esse propósito são o **MongoDB** e o **MySQL**. Sendo a base MongoDB responsável por manter entidades que irão ter atributos (ou caracteristicas) fácilmente mutáveis e modelo não definido completamente, para a base MySQL será mantido alguns dados de configurações e entidades que não irão escalar ou ser mutadas, lembrando que isso não é extremamente garantido, mas precisa-se ter uma probabilidade extremamente baixa de que isso ocorra para assim ser incluído na base MySQL.

Quando uma coleção MongoDB chega numa versão considerada estável **não** ocorrerá a migração desses dados para a base MySQL. A não ser que haja necessidade de relacionamentos entre as entidades, porém isso precisará ser analisado pelo time de desenvolvimento.

Entendidades MySQL podem ter informações de documentos MongoDB, porém o propósito da existência desses dados será extritamente diferente para cada base.

Documentos MongoDB **não devem** ter informações de entidades MySQL, o motivo é basicamente para não mesclar informações de maneira descontrolada entre as bases.

Um bom estudo antes de gerar novas entidades / coleções é realizar algumas perguntas:

> Estará sendo feito um relacionamento entre coleção (MongoDB) e entidade (MySQL)?

Caso a resposta seja sim, então crie uma outra coleção e faça as relações nas consultas no MongoDB.

> Estará sendo criado uma coleção (MongoDB) / entidade (MySQL) para qual propósito?

Caso o propósito seja criar uma coleção característica de informações das regras de negócio como: um conjunto de usuários ou artigos, deverá ser criado na base MongoDB. Caso por exemplo deseja-se cadastrar informações de estatísticas de artigos para economizar processamento a cada consulta desses dados, poderá ser feito uma migração dos resultados dessa consulta através de um agendador, e assim armazenar estes resultados numa tabela MySQL.

Em resumo as principais tecnologias utilizadas são:
 
 - [Javascript](https://developer.mozilla.org/pt-BR/docs/Aprender/JavaScript)
	 - [Node.js](https://nodejs.org/pt-br/)
		 - [Express.js](https://expressjs.com/pt-br/)
- [MySQL](https://www.mysql.com)
- [MongoDB](https://www.mongodb.com)

## Dependências

Dependências podem ser bibliotecas, apis ou outros softwares que auxiliaram na executação deste documentado, dentre elas existem dois tipos principais: as **dependências da aplicação** e **dependências de desenvolvimento**.

### Aplicação

- **body-parser**: ^1.19.0
	- Responsável por realizar o parser do corpo das requisições para os middlewares conseguirem realizar a captura das informações enviadas.
- **consign**: ^0.1.6
	- Responsável por gerar um acesso aos middlewares através de um objeto compartilhável entre toda a aplicação, utilizando o sistema de módulos do Node.js é possível estruturar a aplicação de maneira mais organizada e intuitiva. 
- **cors**: ^2.8.5
	- Reponsável por gerênciar os domínios autorizados para o consumo da api, para saber mais o que é cors e como gerenciá-lo [clique aqui](https**://developer.mozilla.org/pt-BR/docs/Web/HTTP/Controle_Acesso_CORS).
- **express**: ^4.17.1
	- Framework responsável em manter o servidor HTTP.
- **jwt-simple**: ^0.5.6
	- Responsável pela geração de tokens JWT.
- **knex**: ^0.19.1
	- Responsável por manter toda a organização de geração de comandos DDL, DQL, DML do banco MySQL.
- **mongoose**: ^5.5.14
	- Responsável por manter toda a organização de geração de comandos no MongoDB.
- **multer**: ^1.4.1
	- Responsável por manter o armanzenamento de arquivos.
- **mysql**: ^2.17.1
	- Responsável por manter a conexão com o banco mysql, esta dependência é utilizada pelo KNEX para manter as conexões, utilizando pool connections.
- **node-schedule**: ^1.3.2
	- Responsável por implementar CRON Jobs.
- **nodemailer**: ^6.3.0
	- Responsável por envio de e-mails.
- **passport**: ^0.4.0
	- Responsável por gerenciar os tokens de autenticação dos usuários.
- **passport-jwt**: ^4.0.0
	- Responsável por gerenciar a estratégia de autenticação usando o JWT.
- **request**: ^2.88.0
	- Responsável por envio de requisições HTTP.
- **request-promise**: ^4.2.4
	- Extenção da dependencia **request** para realizar requisições HTTP com Promises.
- **sharp**: ^0.22.1
	- Responsável pela compressão de imagens.

### Desenvolvimento
- **nodemon**: ^1.19.1
	- Monitora mudanças da aplicação para resetar automaticamente a api durante o desenvolvimento.
- **eslint**: ^6.8.0
	- Monitora erros e predefine correções nos padrões de código durante o desenvolvimento.
- **eslint-config-standard**: ^14.1.0
- **eslint-plugin-import**: ^2.20.1
- **eslint-plugin-node**: ^11.0.0
- **eslint-plugin-promise**: ^4.2.1
- **eslint-plugin-standard**: ^4.0.1 

As dependências do eslint não descritas são padrões que estão sendo utilizadas no projeto:

Dentre esses padrões o principal é o style **Standard**:
https://standardjs.com/readme-ptbr.html 

Para consultar mais regras estabelicidas para o desenvolvimento, consulta o arquivo **.eslintrc.json**.

## Banco

Neste tópico será descrito detalhes de implementação sobre as **bases da dados** utilizadas pela aplicação.

Como dito em [tópicos anteriores](#ambiente) esta aplicação usa dois bancos de dados, o primeiro MySQL sendo um banco SQL que possui entidades com diversos tipos de finalidades, de manter informações que seriam custosas para se obter de outras formas até dados de configurações que são utilizadas para aplicar determinadas regras de negócios.
O segundo, o MongoDB é utilizado para manter as principais informações da aplicação, estas possuem também a característica de alta mutação na quantidade de informações referente as coleções deste base noSQL.

### MongoDB

Nesta atual versão a aplicação utiliza a dependencia do mongoose para manter as coleções e seus documentos, a seguir será apresentado todas as coleções com seus atributos explicados.

___

### Schemas 

Os schemas são parte importante para a geração de modelos dentro da aplicação, estes que permitem uma fácil interação com o código para realizar as principais operações dentro de um banco de dados.

 - [Artigo](#artigo)
 - [Tema](#tema)
 - [Categoria](#categoria)

### Artigo

**Descrição:** Representa um artigo.

| Atributo / Campo | Descrição | Tipo | Obrigatório | Único | Padrão |
|--|--|--|--|--|--|
| _id | Identificador do artigo | ObjectId | Sim | Sim | N/D |
| title | Título do artigo. | String | Sim | Não | N/D |
| shortDescription | Breve descrição do artigo. | String | Sim | Não | N/D |
| longDescription | Descrição aprofundada do artigo.| String | Não | Não | null |
| theme | Tema do artigo. | [Tema](#tema) | Sim | Não | N/D |
| category | Categoria do artigo. | [Categoria](#categoria) | Não | Não | N/D |
| customURL | URL personalizada do artigo. | String | Sim | Sim | N/D |
| author | Autor do artigo. | [Usuário](#usuário) | Sim | Não | N/D |
| textArticle | Conteúdo do artigo. | String | Sim | Não | N/D |
| youtube | Link para endereço do youtube sobre o artigo. | String | Não | Não | N/D |
| github | Link para endereço do github sobre o artigo. | String | Não | Não | N/D |
| smallImg | Caminho para a imagem (256x256 ou equivalente) do artigo. | String | Não | Não | N/D |
| mediumImg | Caminho para a imagem (1360x768 ou equivalente) do artigo. | String | Não | Não | N/D |
| bigImg | Caminho para a imagem (1920x1080 ou equivalente) do artigo. | String | Não | Não | N/D |
| published | Flag para indicar se o artigo está publicado. | Boolean | Sim | Não | false |
| boosted | Flag para indicar se o artigo está impulsionado na homepage. | Boolean | Sim | Não | false |
| deleted | Flag para indicar se o artigo está removido. (Veja mais aqui)[#specs] | Boolean | Sim | Não | false |
| inactivated | Flag para indicar se o artigo está inativo. | Boolean | Sim | Não | false |
| created_at | Indica a data que o artigo foi criado. | Date | Sim | Não | Data da criação |
| updatedAt | Indica a data que o artigo foi atualizado. | Date | Não | Não | Data da atualização |
| publishAt | Indica a data que o artigo foi publicado. | Date | Não | Não | null |


### Tema

**Descrição:** Representa um tema.

| Atributo / Campo | Descrição | Tipo | Obrigatório | Único | Padrão |
|--|--|--|--|--|--|
| _id | Identificador do tema | ObjectId | Sim | Sim | N/D |
| name | Nome do tema. | String | Sim | Sim | N/D |
| alias | Apelido / nome alternativo.| String | Não | Não | null |
| description | Descrição sobre o tema. | String | Não | Não | null |
| state | Estado do tema | String | Sim | Não | enum('active', 'inactive', 'removed') |


### Categoria

**Descrição:** Representa uma categoria.

| Atributo / Campo | Descrição | Tipo | Obrigatório | Único | Padrão |
|--|--|--|--|--|--|
| _id | Identificador da categoria| ObjectId | Sim | Sim | N/D |
| name | Nome da categoria| String | Sim | Sim | N/D |
| alias | Apelido / nome alternativo.| String | Não | Não | null |
| description | Descrição sobre a categoria. | String | Não | Não | null |
| Tema| Tema da categoria| [Tema](#tema)| Sim| Não | N/Ð|
| state | Estado da categoria | String | Sim | Não | enum('active', 'inactive', 'removed') |
