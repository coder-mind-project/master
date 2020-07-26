![# Coder Mind](https://i.imgur.com/IKPFcHr.png)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
[![master-api-ci](https://circleci.com/gh/coder-mind-project/master.svg?style=shield)](https://circleci.com/gh/coder-mind-project/master)
[![Build status](https://dev.azure.com/codermindproject/Coder%20Mind/_apis/build/status/Homolog/Master-homolog)](https://dev.azure.com/codermindproject/Coder%20Mind/_build/latest?definitionId=2)

## Contact information:

Owner: Coder Mind

E-mail: allan@codermind.com.br

Latest release (development): https://master-develop.herokuapp.com

Stable release (alpha): https://master-production.herokuapp.com
___

## Docs:

https://docs.codermind.com.br/docs/master/about.html

___

## Workflow

Install dependencies with:

`npm install`

Run the application with: 

`npm start`

___

## Migrations (MySQL)

### The migrations works with knex dependency.

Install knex cli in your machine with command: 

    npm install knex -g

After knex cli installed, just run someone commands below:

#### Create migration file:

    knex migrate:make "migration_name"

#### List all migrations [completed and pending]:

    knex migrate:list
    
#### Run migration file that has not yet run:

    knex migrate:up

#### Run migration file specified:

    knex migrate:up "001_migration_name.js"

#### Run all migrations files that has not yet run:

    knex migrate:latest
    
#### Undo last migration file that was run

    knex migrate:down
    
#### Undo migration file specified:

    knex migrate:down "001_migration_name.js"

#### Rollback batch of migrations (one per one migration file):

    knex migrate:rollback

#### Rollback all migrations files per batch:

    knex migrate:rollback --all

___


## Seeds (MySQL)

### The seeds works with knex dependency.

Install knex cli in your machine with command: 

    npm install knex -g

After knex cli installed, just run someone commands below:

#### Create seed file:

    knex seed:make "seed_name"
    
#### Run all seed(s) file(s):

> **Disclaimer**:  The seed files are executed in alphabetical order.

    knex seeds:run

#### Run seed file specified:

    knex seed:run --specific="001_seed_name.js"
___

## Seeds (MongoDB)

### The seeds works with mongo-seed cli

### Sintax

`mongo-seed <collection>`

Example:

    // To generate article seeds
    npm run mongo-seed articles

> **Disclaimer**: Do not run seeds in production database!
Just run in development environment, because this feature completely removes all documents from the collection selected.

### List all collections

`npm run mongo-seed list`

### Run seeds for specify collection

`npm run mongo-seed <collection>`  

Example:

 `npm run mongo-seed articles`

### Run seeds for everyone collections

`npm run mongo-seed latest`

