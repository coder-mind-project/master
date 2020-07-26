![# Coder Mind](https://i.imgur.com/IKPFcHr.png)

[![Build status](https://dev.azure.com/codermindproject/Coder%20Mind/_apis/build/status/Production/Master-production)](https://dev.azure.com/codermindproject/Coder%20Mind/_build/latest?definitionId=6)
[![Release status](https://vsrm.dev.azure.com/codermindproject/_apis/public/Release/badge/2cbdac35-45f6-4fc4-a511-54ecd832b244/1/1)](http://master.codermind.com.br)
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## Contact information:

Owner: Coder Mind

E-mail (Project owner): allan@codermind.com.br

Stable release: http://master.codermind.com.br

Latest release: http://master-homolog.codermind.com.br
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

## Migrations (MySQL/MariaDB)

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

### List all collections

`npm run mongo-seed list`

### Run seeds for specify collection

`npm run mongo-seed <collection>`  

Example:

 `npm run mongo-seed articles`

### Run seeds for everyone collections

`npm run mongo-seed latest`

