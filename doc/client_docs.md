# Coder Mind - Panel

Available Languages: 

 - [PT-BR](#pt-br)

Just click in your preference and enjoy!

URL production: <https://cm-gestao-v1.allanalves23.top>
Need release for development? [Contact us](mailto:allan.codermind@gmail.com) 
Doc version: 1.0
For API version: 1.0.4 (master) 

#### Contact

 - E-mail: allan.codermind@gmail.com
 - Owner: Coder Mind

## PT-BR

### Sumário:

 - [Autenticação](#autenticação)
 - [Recursos (endpoints)](#recursos)
 - [Tipagens / Schemas](#schemas)
 - [Respostas HTTP](#respostas)

## Autenticação

Para se autenticar é necessário existir um cadastro na base de dados do usuário referido, ou seja, é preciso garantir que exista um usuário cadastrado na base de dados primária,

Recurso para realizar a autenticação: **/auth**
Exemplo, com a URL ficaria: https://mysite.com/auth

Para fornecer as credenciais para autenticação basta fornecer um conjunto de **username e senha** ou **email e senha** dentro de um objeto com a formatação abaixo:

#### Fornecendo um conjunto e-mail e senha
| Campos | Valores |
|--|--|
| user | "email@exemplo.com" |
| password| "12345678" |


#### Fornecendo um conjunto username e senha
| Campos | Valores |
|--|--|
| user | "username" |
| password| "12345678" |

Qualquer uma das opções é valida, basta garantir que as credenciais estejam corretas.

O retorno da requisição em caso de sucesso terá algo como:

    {
	    token: "um-jwt-token",
	    user: {...}
    }

##### Para saber mais sobre a tipagem do atributo "user" [clique aqui](#usuário)!

O valor do atributo token deverá ser adicionado no cabeçalho HTTP das requisições no seguinte formato de acordo com [padrão JWT](https://jwt.io):
 
| chave / identificador | valor |
|--|--|
| Authorization | bearer "token-jwt" |

Detalhes: 

 1. Deverá existir um espaço entre o **bearer**  e o **token jwt**
 2. O token jwt deverá estar sem as aspas mencionadas no exemplo acima.

Para mais detalhes sobre o padrão JWT [acesse aqui](https://codermind.com.br/artigos/jwt-json-web-tokens)

Se tudo foi feito corretamente você já estará apto a acessar a grande maioria dos recursos desta api.

## Recursos

Os recursos estarão separados por funcionalidades:

 - [Artigos](#artigos)
 - [Temas](#temas)
 - [Categorias](#categorias)

## Artigos

### /articles
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Sim|Sim|Não|Não|Não|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna uma listagem de artigos, esta listagem possuí nível de implementação a nível de acesso, isto é, para usuários não administradores somente serão retornados artigos que são devidamente deste usuário. Para administradores pode ser retornado todos os artigos cadastrados da plataforma, esta funcionalidade possui paginação.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| limit | query | Limitação de artigos por página, máximo 100 artigos por página. | Não | Integer | 10 |
| query | query | Palavra chave para obter um filtro dos artigos, esta palavra será procurado entre os atributos **title** e **shortDescription** do artigo. Ao não informar, será retornado sem o aplique do filtro. Para mais detalhes do schema de Artigo, [clique aqui](#artigo).| Não | String | String vazia |
| page | query | Página corrente da listagem de artigos. | Não | Integer | 1 |
| type | query | Define o tipo de listagem de artigos, informando o tipo 'all' todos os artigos serão retornados, informando o tipo 'perUser' retorna somente os artigos do usuário corrente, este parâmetro só tem efeito quando o usuário da requisição é administrador. | Não | enum('all', 'perUser') | "perUser" |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Um Array de Artigos. | [Artigo](#artigo) |
|500| Um Erro.| [Erro interno](#crítico)|
___
**POST**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**:  Cadastra um novo artigo.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| title | body | Título do Artigo. | Sim | String | N/D |
| theme | body | Tema do Artigo. | Sim | [Tema](#tema) | N/D |
| category | body | Categoria do Artigo. | Não | [Categoria](#categoria) | null |
| shortDescription | body | Breve descrição sobre o Artigo (com limitação máxima de 150 caracteres). | Sim | String | N/D |
| longDescription | body | Descrição longa sobre o Artigo, deverá ser utilizado quando a breve descrição não for o suficiente para descrevê-lo (com limitação máxima de 300 caracteres). | Não | String | null |
| textArticle | body | Corpo do artigo, aqui há todo o artigo redigido pelo autor. (Este registro possui a tipagem em string, porém as informações possuem sintaxe HTML). | Sim | String | N/D
| author | body | Autor do Artigo. | Sim | [Usuário](#usuário) | N/D
| customURL | body | Url customizada do Artigo (esta informação servirá como um localizador do artigo). | Sim | String | N/D |
| youtube | body | URL de video no youtube sobre o artigo (**Deverá ser informado o link completo** para se obter o efeito desejado dentro da plataforma). | Não | String | null |
| github | body | URL de repositório no github sobre o artigo (**Deverá ser informado o link completo** para se obter o efeito desejado dentro da plataforma). | Não | String | null |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 201 | Artigo recém criado. | [Artigo](#artigo) |
| 400 | Regras de negócio infringidas (Ex: "Já existe um artigo com esta url personalizada, considere alterar-la").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|
___
**PUT**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**:  Atualiza um artigo.
##### ** Atualmente, o identificador ( semelhante à ID ) para atualizar o artigo deverá estar contida no corpo de requisição, a mesma deverá ter exclusivamente o par chave "_id" (sem as aspas) , isso será alterado em atualizações posteriores.**

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| _id | body | ID (Identificador) do artigo. **Jamais modifique este valor, ele deverá ser constante**. | Sim | String | N/D |
| title | body | Título do Artigo. | Sim | String | N/D |
| theme | body | Tema do artigo | Sim | [Tema](#tema) | N/D |
| category | body | Categoria do Artigo. | Não | [Categoria](#categoria) | null |
| shortDescription | body | Breve descrição sobre o artigo (com limitação máxima de 150 caracteres) | Sim | String | N/D |
| longDescription | body | Descrição longa sobre o artigo, deverá ser utilizado quando a breve descrição não for o suficiente para descrevê-lo (com limitação máxima de 300 caracteres). | Não | String | null |
| textArticle | body | Corpo do artigo, aqui há todo o artigo redigido pelo autor. (Este registro possui a tipagem em string, porém as informações possuem sintaxe HTML). | Sim | String | N/D
| author | body | Autor do Artigo. | Sim | [Usuário](#usuário) | N/D
| customURL | body | Url customizada do artigo (esta informação servirá como um localizador do artigo). | Sim | String | N/D |
| youtube | body | URL de video no youtube sobre o artigo (**Deverá ser informado o link completo** para se obter o efeito desejado dentro da plataforma). | Não | String | null |
| github | body | URL de repositório no github sobre o artigo (**Deverá ser informado o link completo** para se obter o efeito desejado dentro da plataforma). | Não | String | null |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Artigo recém atualizado. | [Artigo](#artigo) |
| 400 | Regras de negócio infringidas (Ex: "Já existe um artigo com esta url personalizada, considere alterar-la").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|
___
### /articles/:url
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Não|Não|Não|Não|Não|

**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna um artigo filtrado pela URL personalizada, caso possua dúvidas sobre este assunto consulte o [schema de artigo](#artigo).

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| url | params | URL personalizada do artigo. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Um Artigo. | [Artigo](#artigo) |
| 403 | Quando um usuário (não administrador) tenta acessar um  artigo que não é de sua autoria.| [Erro do cliente](#erro) |
| 404 | Nenhum artigo encontrado. | [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

___

### /articles/management/:id
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Não|Não|Sim|Não|Sim|

**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna um artigo filtrado pelo [id](#artigo).

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | id (Identificador) do artigo. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Um Artigo. | [Artigo](#artigo) |
| 404 | Nenhum artigo encontrado. | [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

___
**PATCH**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Realiza o gerenciamento de artigos, isto é, responsável por realizar as publicações, impulsionamentos, inativações e ativações dos artigos.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | id (Identificador) do artigo. | Sim | String | N/D |
| op | query | Tipo de operação a ser realizada ( Publicação, Impulsionamento, Inativação e Ativação ). | Sim | enum('publish', 'boost', 'inactive', 'active') | N/D |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Artigo atualizado. | [Artigo](#artigo) |
| 400 | Regras de negócios infringidas. Ex: "Nenhum método definido, consulte a documentação." | [Erro do cliente](#erro)
| 404 | Nenhum artigo encontrado. | [Erro do cliente](#erro) |
| 410 | Artigo não disponível para alteração. Este erro ocorre quando tenta-se alterar um artigo que foi excluído. Ex: "Esse artigo foi excluído, não é possível publicá-lo."| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

___

**DELETE**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Remove um Artigo.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | id (Identificador) do Artigo. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Artigo atualizado. | [Artigo](#artigo) |
| 404 | Nenhum Artigo encontrado. | [Erro do cliente](#erro) |
| 410 | Artigo não disponível para alteração. Este erro ocorre quando tenta-se alterar um artigo que foi excluído. Ex: "Artigos publicados não podem ser removidos, considere inativar o artigo".| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro Interno](#crítico)|


### /articles/img/:id - [NÃO FINALIZADO]
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Não|Sim|Sim|Sim|Não|Sim|

**POST**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**:  Enviar uma imagem de logo do artigo (imagens de resolução 250x250, 512x512 ou equivalente).

**Cabeçalho HTTP**:

Para ser possível o envio de imagens é necessário definir uma configuração no cabeçalho da requisição HTTP:

| Atributo | valor |
|--|--|
| content-type | multipart/form-data |

Ou seja, é necessário que o tipo de dado a ser enviado seja do tipo **[FormData](https://developer.mozilla.org/pt-BR/docs/Web/API/FormData/FormData)** e além disso é necessário informar no cabeçalho da requisição.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador (id) do artigo. | sim | String | N/D |
| size | query | Tamanho que a imagem terá, para este método HTTP é recomendado usar valores como: 256, 480 ou 512. | Sim | Number | N/D |
| smallImg | body | Imagem em formato: .png, .jpg ou .jpeg | Sim | [FormData](https://developer.mozilla.org/pt-BR/docs/Web/API/FormData/FormData) | N/D |


**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Um Artigo. | [Artigo](#artigo) |
| 404 | Nenhum artigo encontrado. | [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

# [NÃO FINALIZADO]

## Temas

### /themes
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Sim|Não|Não|Não|Não|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna uma listagem de temas disponíveis para aplicação nos artigos. Esta funcionalidade possui paginação.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| limit | query | Limitação de temas por página, máximo 100 temas por página. | Não | Integer | 10 |
| query | query | Palavra chave para obter um filtro dos temas, esta palavra será procurado entre os atributos **name** e **alias** do tema. Ao não informar, será retornado sem o aplique do filtro. Para mais detalhes do schema de Tema, [clique aqui](#tema).| Não | String | String vazia |
| page | query | Página corrente da listagem de temas. | Não | Integer | 1 |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Um Array de Temas. | [Tema](#tema) |
|500| Um Erro.| [Erro interno](#crítico)|
___
**POST**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**:  Cadastra um novo tema.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| name | body | Nome do tema (Limitação de 30 caracteres).| Sim | String | N/D |
| alias | body | Apelido / nome alternativo do tema (Limitação de 30 caracteres).  | Não | String | null |
| description | body | Descrição do tema (Limitação de 100 caracteres). | Não | String | null |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 201 | Tema recém criado. | [Tema](#tema) |
| 400 | Regras de negócio infringidas (Ex: "O tema deve possuir um nome de pelo menos 30 caracteres").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

___

### /themes/:id
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Não|Sim|Não|Não|Sim|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna um tema filtrado pelo identificador (id).

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador do tema. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Um Tema. | [Tema](#tema) |
| 400 | Regras de negócio infringidas (Ex: "Identificador inválido").| [Erro do cliente](#erro)
|500| Um Erro.| [Erro interno](#crítico)|



**DELETE**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**: Remove um tema.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador do tema. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|204| Sucesso. | N/Ð |
| 400 | Regras de negócio infringidas (Ex: "Identificador inválido").| [Erro do cliente](#erro)
|500| Um Erro.| [Erro interno](#crítico)|



**PUT**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**:  Atualiza um tema.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador do tema.| Sim | String | N/D |
| name | body | Nome do tema (Limitação de 30 caracteres).| Sim | String | N/D |
| alias | body | Apelido / nome alternativo do tema (Limitação de 30 caracteres).  | Não | String | null |
| description | body | Descrição do tema (Limitação de 100 caracteres). | Não | String | null |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Tema recém atualizado. | [Tema](#tema) |
| 400 | Regras de negócio infringidas (Ex: "O tema deve possuir um nome de pelo menos 30 caracteres").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

## Categorias

### /categories
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Sim|Não|Não|Não|Não|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna uma listagem de categorias disponíveis para aplicação nos artigos e temas. Esta funcionalidade possui paginação.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| limit | query | Limitação de temas por página, máximo 100 temas por página. | Não | Integer | 10 |
| query | query | Palavra chave para obter um filtro das categorias, esta palavra será procurado entre os atributos **name** e **alias** da categoria. Ao não informar, será retornado sem o aplique do filtro. Para mais detalhes do schema de Categoria, [clique aqui](#categoria).| Não | String | String vazia |
| page | query | Página corrente da listagem de categorias. | Não | Integer | 1 |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Um Array de Categorias. | [Categoria](#categoria) |
|500| Um Erro.| [Erro interno](#crítico)|
___
**POST**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**:  Cadastra uma nova categoria.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| name | body | Nome da categoria (Limitação de 30 caracteres).| Sim | String | N/D |
| alias | body | Apelido / nome alternativo da categoria (Limitação de 30 caracteres).  | Não | String | null |
| description | body | Descrição da categoria (Limitação de 100 caracteres). | Não | String | null |
| theme | body | Tema da categoria. | Sim | [Tema](#tema) | N/D |

**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 201 | Categoria recém criado. | [Categoria](#categoria) |
| 400 | Regras de negócio infringidas (Ex: "A categoria deve possuir um nome de pelo menos 30 caracteres").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

___
### /categories/:id

|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Não|Sim|Não|Não|Sim|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna uma categoria filtrado pelo identificador (id).

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador da categoria. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Uma Categoria. | [Categoria](#categoria) |
| 400 | Regras de negócio infringidas (Ex: "Identificador inválido").| [Erro do cliente](#erro)
|500| Um Erro.| [Erro interno](#crítico)|



**DELETE**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**: Remove uma categoria.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador da categoria. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|204| Sucesso. | N/Ð |
| 400 | Regras de negócio infringidas (Ex: "Identificador inválido").| [Erro do cliente](#erro)
|500| Um Erro.| [Erro interno](#crítico)|



**PUT**: 

|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Sim|

**Descrição**:  Atualiza uma categoria.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador da categoria.| Sim | String | N/D |
| name | body | Nome da categoria (Limitação de 30 caracteres).| Sim | String | N/D |
| alias | body | Apelido / nome alternativo da categoria (Limitação de 30 caracteres).  | Não | String | null |
| description | body | Descrição da categoria (Limitação de 100 caracteres). | Não | String | null |
| theme | body | Tema da categoria. | Sim | [Tema](#tema) | N/D |


**Respostas**
| Código | Descrição | Schema |
|--|--|--|
| 200 | Categoria recém atualizada. | [Categoria](#categoria) |
| 400 | Regras de negócio infringidas (Ex: "A categoria deve possuir um nome de pelo menos 30 caracteres").| [Erro do cliente](#erro) |
|500| Um Erro. | [Erro interno](#crítico)|

### /categories/theme/:id

|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Não|Sim|Não|Não|Sim|
___
**GET**: 
|Precisa de autenticação?| Somente administrador|
|--|--|
|Sim|Não|

**Descrição**: Retorna categorias filtrado pelo identificador do tema.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| id | params | Identificador do tema. | Sim | String | N/D |

**Respostas**
| Código | Descrição | Schema|
|--|--|--|
|200| Um Array de Categorias. | [Categoria](#categoria) |
| 400 | Regras de negócio infringidas (Ex: "Identificador inválido").| [Erro do cliente](#erro)
|500| Um Erro.| [Erro interno](#crítico)|


## Respostas
Neste tópico será possível observar o padrão das respostas HTTP desta API, estas estarão separadas por tipos e subtipos.
Todos os exemplos de respostas são ficticios, porém os mesmos representam modelos quase identicos aos cenários reais.


#### Tipo de Conteúdo:
As respostas HTTP contém somente o formato **JSON**.
#### Possui informações para uso de cache? 
Atualmente não existe nenhuma configuração por parte do cliente para este tipo de funcionalidade.
#### Qual é o encode das respostas?
O encode possui o formato utf-8. 
___
### Successo

#### 200 - Sucesso
Quando uma requisição possui uma resposta com sucesso, a api retornará informações no corpo da resposta.
Exemplo:

##### Cabeçalho HTTP

    Access-Control-Allow-Origin: *
	Content-Type: application/json; charset=utf-8
	Content-Length: 884
	ETag: W/"374-E/ACyvFIBBxyaZfHeu+sT7yDTgU"
	Date: Fri, 21 Feb 2020 15:27:11 GMT
	Connection: keep-alive
	
##### Resposta HTTP

    {
	  "_id": "5d62953f0c7854001d8cf6b6",
	  "createdAt": "2019-08-15T04:54:55.097Z",
	  "title": "teste",
	  "theme": {
	    "_id": "5d4f890e06b75c3e5561afc0",
	    "name": "Programação",
	    "alias": "Desenvolvimento de sistemas",
	    "description": "Tema destinado a assuntos de programação em geral",
	    "state": "active"
	  },
	  "customURL": "article-coder-mind",
	  "publishAt": "2019-08-25T11:03:50.433Z",
	  "longDescription": "",
	  "updatedAt": "2020-02-18T23:23:02.374Z"
	}

#### 201 - Criado com sucesso
Será retornado quando algum recurso for criado, está presente geralmente em formulários de cadastro.

##### Cabeçalho HTTP

    Access-Control-Allow-Origin: *
	Content-Type: application/json; charset=utf-8
	Content-Length: 884
	ETag: W/"374-E/ACyvFIBBxyaZfHeu+sT7yDTgU"
	Date: Fri, 21 Feb 2020 15:27:11 GMT
	Connection: keep-alive
	
##### Resposta HTTP

    {
	  "_id": "5d62953f0c7854001d8cf6b6",
	  "createdAt": "2019-08-15T04:54:55.097Z",
	  "title": "teste",
	  "theme": {
	    "_id": "5d4f890e06b75c3e5561afc0",
	    "name": "Programação",
	    "alias": "Desenvolvimento de sistemas",
	    "description": "Tema destinado a assuntos de programação em geral",
	    "state": "active"
	  },
	  "customURL": "article-coder-mind",
	  "publishAt": "2019-08-25T11:03:50.433Z",
	  "updatedAt": "2020-02-18T23:23:02.374Z"
	}

#### 204 - Sucesso, porém sem conteúdo
Será retornado quando alguma operação for solicitada e esta operação não resulta em nenhum retorno de informação no corpo da resposta HTTP.

##### Cabeçalho HTTP

    Access-Control-Allow-Origin: *
	Content-Type: application/json; charset=utf-8
	Content-Length: 884
	ETag: W/"374-E/ACyvFIBBxyaZfHeu+sT7yDTgU"
	Date: Fri, 21 Feb 2020 15:27:11 GMT
	Connection: keep-alive
	
	
___
### Erro

#### 400 - Erro do cliente
Será emitido assim que infringido alguma regra de negócio, exemplo: **campos obrigatórios**, **parâmetros obrigatórios** e **regras de negócios exclusivas da api**.

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 400,
	    "msg": "E-mail inválido." 
    }
___

#### 401 - Não autorizado
Será apresentado quando algum recurso for acessado sem o [token de autenticação](#autenticação).

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    Unauthorized

##### No momento está resposta HTTP esta sendo enviada em formato de texto simples, em futuras atualizações isto mudará.

#### 403 - Recurso proibido
Em alguns casos a api pode retornar este tipo de erro, o motivo e solução estarão fornecidos no corpo da resposta.

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 403,
	    "msg": "Com este token, não é possível acessar este recurso."
	    "problem": "Token expired",
	    "solution": "Generate a new token"
    }
___

#### 404 - Recurso não encontrado

É retornado quando a api não consegue encontrar determinado recurso.

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 404,
	    "msg": "Usuário não encontrado"
    }
___

#### 410 - Não mais disponível
Em alguns casos a api pode retornar este tipo de erro, o motivo é basicamente que este recurso **estava** disponível nas condições informadas e que atualmente não possui mais esta disponibilidade.

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 410,
	    "msg": "Recurso não mais disponível"
    }
___


#### 429 - Excesso de requisições
Em alguns casos a api pode retornar este tipo de erro, o motivo é basicamente que muitas requisições estão sendo enviadas a um determinado recurso, a solução é basicamente esperar um tempo para enviar novas requisições.

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 429,
	    "msg": "Requisições em excesso espere um pouco para enviar novas requisições."
    }
___

### Crítico

#### 500 - Erro interno

Este erro ocorre quando o problema não é causado pelo cliente, e sim por erros no servidor, api ou na base de dados.
**Se presenciar este erro, reporte! isto ajuda a manter api na maior qualidade possível!**

##### Cabeçalho HTTP

    X-Powered-By: Express
	Content-Type: application/json; charset=utf-8
	Content-Length: 32
	ETag: W/"20-tVivsRSRsgWEXGdkyot7JCIgApI"
	Date: Fri, 21 Feb 2020 16:12:19 GMT
	Connection: keep-alive


##### Corpo da resposta

    {
	    "code": 500,
	    "msg": "Ocorreu um erro desconhecido, por favor reporte este erro!"
    }
   


## Schemas

Schemas representam a tipagem de dados, quando estes dados são primitivos (String, Integer, Float, Boolean) não há necessidade de explicitar nesta sessão.

 - [Artigo](#artigo)
 - [Tema](#tema)
 - [Categoria](#categoria)

### Artigo

**Descrição:** Representa um artigo.

| Atributo / Campo | Descrição | Tipo | Obrigatório | Único | Padrão |
|--|--|--|--|--|--|
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
| createdAt | Indica a data que o artigo foi criado. | Date | Sim | Não | Data da criação |
| updatedAt | Indica a data que o artigo foi atualizado. | Date | Não | Não | Data da atualização |
| publishAt | Indica a data que o artigo foi publicado. | Date | Não | Não | null |

**Em JSON:**

    {
      "_id": "5e501f442bae7e3aee5082cd",
      "title": "teste",
      "theme": {
        "_id": "5d4f890e06b75c3e5561afc0",
        "name": "Programação",
        "alias": "Desenvolvimento de sistemas",
        "description": "Tema destinado a assuntos de programação em geral",
        "state": "active"
      },
      "customURL": "teste123",
      "author": {
        "_id": "5e4c6febbfca220641e5797f",
        "name": "Allan Wanderley",
        "email": "allan@email.com
        "gender": "male",
        "profilePhoto": "public/imgs/1582146500762.webp"
      },
      "shortDescription": "teste",
      "youtube": "",
      "github": "",
      "textArticle": "<p>Hello World</p>",
      "published": false,
      "boosted": false,
      "deleted": false,
      "inactivated": false,
      "category": {
        "name": "",
        "alias": "",
        "description": ""
      },
      "created_at": "2020-02-21T18:19:48.715Z",
      "updatedAt": "2020-02-23T05:25:11.600Z",
      "longDescription": "",
      "smallImg": "public/imgs/1582435501344.webp",
      "mediumImg": "",
      "bigImg": ""
    }

___
### Tema

**Descrição:** Representa um tema.

| Atributo / Campo | Descrição | Tipo | Obrigatório | Único | Padrão |
|--|--|--|--|--|--|
| _id | Identificador do tema | ObjectId | Sim | Sim | N/D |
| name | Nome do tema. | String | Sim | Sim | N/D |
| alias | Apelido / nome alternativo.| String | Não | Não | null |
| description | Descrição sobre o tema. | String | Não | Não | null |
| state | Estado do tema | String | Sim | Não | enum('active', 'inactive', 'removed') |

**Em JSON:**

    {
      "_id": "5e50ec622076e632fb2f4958",
      "state": "active",
      "name": "Programação",
      "alias": "Desenvolvimento de software",
      "description": "Destinado a estudantes de ciências de computação, anállise de sistemas e sistemas de informação."
    }

___

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

**Em JSON:**

    {
      "_id": "5e52212892d8d667e21ca891",
      "state": "active",
      "name": "category2",
      "alias": "alias",
      "description": "description1",
      "theme": {
        "_id": "5d4f890e06b75c3e5561afc0",
        "name": "Programação",
        "alias": "",
        "description": "",
        "state": "active"
      }
