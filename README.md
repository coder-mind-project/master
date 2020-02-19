# Coder Mind - Panel API

#### Contact information:
Coder Mind
allan.codermind@gmail.com

#### Version: 1.0.4 (master)
#### Doc version: 0.1 

#### [ENG] - This documentation currently has only the PT-BR language.
#### [PT-BR] - Esta documentação atualmente possui somente o idioma em PT-BR.

Sumário:

 - [Autenticação](#autenticação)
 - [Recursos (endpoints)](#recursos)
 - [Tipagens / Schemas](#schemas)
 - [KNEX CLI](#knex)

## Autenticação

Para se autenticar é necessário existir um cadastro na base de dados do usuário referido, ou seja, é preciso garantir que exista um usuário cadastrado na base de dados primária, assegure-se de estar utilizando uma base de dados fornecida pelo time Coder Mind.

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

##### Para saber a tipagem do campo user acesse  o tópico de "Tipagens"

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

Os recursos estarão separados por funcionalidades.

### Artigos

#### /articles
|GET|POST|PUT|PATCH|OPTIONS|DELETE|
|--|--|--|--|--|--|
|Sim|Sim|Sim|Não|Não|Não|

**GET**: 

**Descrição**: Retorna uma listagem de artigos, esta listagem possuí nível de implementação a nível de acesso, isto é, para usuários não administradores somente serão retornados artigos que são devidamente deste usuário. Para administradores pode ser retornado todos os artigos cadastrados da plataforma, esta funcionalidade possui paginação.

**Parametros**:
| Nome | Localização | Descrição | Requerido | Schema | Padrão |
|--|--|--|--|--|--|
| limit | query | Limitação de artigos por página, máximo 100 artigos por página | Não | Integer | 10 |
| query | query | Palavra chave para obter um filtro dos artigos, esta palavra será procurado entre os atributos **title** e **shortDescription** do artigo. Ao não informar, será retornado sem o aplique do filtro. Para mais detalhes do schema de Artigo, [clique aqui](#artigo)| Não | String | String vazia |
| page | query | Página corrente da listagem de artigos. | Não | Integer | 1 |
| type | query | Define o tipo de listagem de artigos, informando o tipo 'all' todos os artigos serão retornados, informando o tipo 'perUser' retorna somente os artigos do usuário corrente, este parâmetro só tem efeito quando o usuário da requisição é administrador | Não | enum('all', 'perUser') | "perUser" |

