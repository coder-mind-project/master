## MONGO-SEED GUIDE

  

### mongo-seed guide is a cli for generate seeds in mongodb database

### Sintax

  

`mongo-seed <collection>`

  

### Example

    // To generate article seeds
    npm run mongo-seed articles

  

### Disclaimer

> **Do not run seeds in production database!**
> Just run in development environment, because this feature completely
> removes all documents from the collection selected.

  

### List all collections

`npm run mongo-seed list`

### Run seeds for specify collection

`npm run mongo-seed <collection>`  

**Example**:

 `npm run mongo-seed articles`


### Run seeds for everyone collections

`npm run mongo-seed latest`