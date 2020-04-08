## KNEX SEEDS GUIDE


### The migrations and seeds works with knex dependency.

Install knex cli in your machine with command: 

    npm install knex -g

After knex cli installed, just run someone commands below:

#### Create seed file:

    knex seed:make "seed_name"
    
#### Run all seed(s) file(s):
##### * Atention:  Seed files are executed in alphabetical order. *

    knex seeds:run

#### Run seed file specified:

    knex seed:run --specific="001_seed_name.js"
