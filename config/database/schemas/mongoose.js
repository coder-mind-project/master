/**
 * @description Mongoose models/schemas
 */
const Comment = require('./Comment')
const Category = require('./Category')
const Theme = require('./Theme')
const User = require('./User')
const Article = require('./Article')
const View = require('./View')
const Like = require('./Like')
const Ticket = require('./Ticket')

/**
 * @function
 * @module mongooseSchemas
 * @description Provide Models for management data for MongoDB.
 * @returns {Object} A Object containing Models of MongoDB collections.
 */
module.exports = () => {
  return {
    Article,
    Category,
    Comment,
    Like,
    Theme,
    Ticket,
    User,
    View
  }
}
