const mongoose = require('mongoose')
const validator = require('mongoose-unique-validator')

/**
 * @description The Article Schema
 * @type {mongoose.Schema}
 */
const article = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.ObjectId, auto: true },
    author: { type: mongoose.Schema.ObjectId, required: true },
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

module.exports = mongoose.model('articles', article)
