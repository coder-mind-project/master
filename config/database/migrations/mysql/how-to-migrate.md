## KNEX MIGRATIONS GUIDE


### The migrations and seeds working with knex dependency.

Install knex cli in your machine with command: 

    npm install knex -g

After knex cli installed, just run someone commands bellow:

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