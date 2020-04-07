const validator = require('mongoose-unique-validator')
const mongoose = require('mongoose')

/**
 * @function
 * @module mongooseSchemas
 * @description Provide Models for management data for MongoDB.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} A Object containing Models of MongoDB collections.
 */
module.exports = app => {
  if (!app) {
    // eslint-disable-next-line no-param-reassign
    app = {
      mongo: mongoose
    }
  }

  const user = new app.mongo.Schema(
    {
      _id: { type: app.mongo.Schema.ObjectId, auto: true },
      name: String,
      gender: String,
      birthDate: Date,
      profilePhoto: String,
      instagram: String,
      twitter: String,
      github: String,
      youtube: String,
      email: { type: String, unique: true },
      cellphone: { type: String, unique: true, sparse: true },
      address: String,
      number: Number,
      password: String,
      token: String,
      tagAdmin: String,
      occupation: String,
      especiality: String,
      tagAuthor: String,
      customUrl: { type: String, unique: true },
      publicProfile: { type: Boolean, default: false },
      platformStats: { type: Boolean, default: false },
      confirmEmail: String,
      confirmEmailToken: String,
      lastEmailTokenSendAt: Number,
      firstLoginAt: { type: Date, default: null },
      deletedAt: { type: Date, default: null }
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
      }
    }
  )

  user.plugin(validator)
  user.pre('updateOne', function(next) {
    this.options.runValidators = true
    this.options.context = 'query'
    next()
  })
  const User = app.mongo.model('users', user)

  // Schema para os artigos do sistema
  const article = new app.mongo.Schema(
    {
      _id: { type: app.mongo.Schema.ObjectId, auto: true },
      author: { type: app.mongo.Schema.ObjectId, required: true },
      title: String,
      theme: Object,
      category: Object,
      shortDescription: String,
      longDescription: String,
      youtube: String,
      github: String,
      textArticle: String,
      smallImg: String,
      mediumImg: String,
      bigImg: String,
      customURL: { type: String, unique: true },
      publishAt: Date,
      published: Boolean,
      boosted: Boolean,
      deleted: Boolean,
      inactivated: Boolean
    },
    {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updatedAt'
      }
    }
  )

  article.plugin(validator)
  const Article = app.mongo.model('articles', article)

  /**
   * @description A Theme Schema
   * @type {app.mongo.Schema}
   */
  const theme = new app.mongo.Schema({
    _id: { type: app.mongo.Schema.ObjectId, auto: true },
    name: { type: String, unique: true, required: true },
    alias: String,
    description: String,
    state: { type: String, default: 'active' }
  })

  theme.plugin(validator)
  theme.pre('updateOne', function(next) {
    this.options.runValidators = true
    this.options.context = 'query'
    next()
  })
  const Theme = app.mongo.model('themes', theme)

  // Schema para as categorias dos artigos
  const category = new app.mongo.Schema({
    _id: { type: app.mongo.Schema.ObjectId, auto: true },
    name: { type: String, unique: true },
    themeId: { type: app.mongo.Schema.ObjectId, required: true },
    alias: String,
    description: String,
    state: { type: String, required: true, default: 'active' }
  })

  category.plugin(validator)
  category.pre('updateOne', function(next) {
    this.options.runValidators = true
    this.options.context = 'query'
    next()
  })
  const Category = app.mongo.model('categories', category)

  // Schema para as visualizações dos artigos
  const view = new app.mongo.Schema({
    _id: { type: app.mongo.Schema.ObjectId, auto: true },
    reader: String,
    startRead: Date,
    article: Object,
    viewsQuantity: { type: Number, default: 1 }
  })

  view.plugin(validator)
  const View = app.mongo.model('views', view)

  const like = new app.mongo.Schema(
    {
      _id: { type: app.mongo.Schema.ObjectId, auto: true },
      reader: String,
      article: Object,
      confirmed: Boolean
    },
    {
      timestamps: {
        createdAt: 'created_at'
      }
    }
  )

  like.plugin(validator)
  const Like = app.mongo.model('likes', like)

  /**
   * @description A Comment Schema
   * @type {app.mongo.Schema}
   */
  const comment = new app.mongo.Schema(
    {
      _id: { type: app.mongo.Schema.ObjectId, auto: true },
      userName: String,
      userEmail: String,
      message: String,
      articleId: { type: app.mongo.Schema.ObjectId, required: true },
      confirmedAt: { type: Date, default: null },
      readedAt: { type: Date, default: null },
      answerOf: { type: app.mongo.Schema.ObjectId, default: null }
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
      }
    }
  )

  comment.plugin(validator)
  const Comment = app.mongo.model('comments', comment)

  // Schema para as categorias dos artigos
  const ticket = new app.mongo.Schema(
    {
      _id: { type: app.mongo.Schema.ObjectId, auto: true },
      type: String,
      user: { type: app.mongo.Schema.ObjectId },
      dateOccurrence: Date,
      adminId: { type: app.mongo.Schema.ObjectId },
      userId: { type: app.mongo.Schema.ObjectId },
      email: String,
      msg: String,
      software: String,
      device: String,
      browser: String,
      anotherBrowser: String,
      responses: { type: Array, default: [] },
      readed: { type: Boolean, default: false }
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt'
      }
    }
  )

  ticket.plugin(validator)
  const Ticket = app.mongo.model('tickets', ticket)

  return { User, Article, Theme, Category, View, Like, Comment, Ticket }
}
