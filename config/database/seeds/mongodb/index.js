/**
 * @module MongoSeeds
 * @description Seeds for mongoose (MongoDB database)
 */

/**
 * @description Environment database
 */
const { dbLocal, dbProduction, dbDevelopment } = require('../../../../config/environment')
const config = dbDevelopment
const url = config.mongo.url

/**
 * @description Dependencies
 */
const seeder = require('mongoose-seed')

/**
 * @description Seeds file
 */
const insertArticles = require('./insert_articles')
const insertComments = require('./insert_comments')
const insertViews = require('./insert_views')
const insertLikes = require('./insert_likes')

/**
 * @function
 * @description Populate article collection (Article seeds)
 */
function articles() {
  insertArticles(seeder, url)
}

/**
 * @function
 * @description Populate comment collection (Comment seeds)
 */
function comments() {
  insertComments(seeder, url)
}

/**
 * @function
 * @description Populate view collection (View seeds)
 */
function views() {
  insertViews(seeder, url)
}

/**
 * @function
 * @description Populate view collection (View seeds)
 */
function likes() {
  insertLikes(seeder, url)
}

/**
 * @function
 * @description Populate all available collections (All seeds)
 */
function latest() {
  insertArticles(seeder, url)
}

/**
 * @function
 * @description Show all available collections
 */
function list() {
  // eslint-disable-next-line no-console
  console.log(`
  Available collections: \n
  - articles
  - comments
  - views
  - likes\n
  `)
}

module.exports = {
  articles,
  comments,
  views,
  likes,
  latest,
  list
}
