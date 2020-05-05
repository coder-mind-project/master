const mongoose = require('mongoose')
const validator = require('mongoose-unique-validator')

/**
 * @description The Article Schema
 * @type {mongoose.Schema}
 */
const article = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    state: {
      type: String,
      enum: ['draft', 'published', 'inactivated', 'removed', 'boosted'],
      required: true,
      default: 'draft'
    },
    themeId: { type: mongoose.Schema.ObjectId, default: null },
    categoryId: { type: mongoose.Schema.ObjectId, default: null },
    userId: { type: mongoose.Schema.ObjectId, required: true },
    logoImg: { type: String, default: null },
    secondaryImg: { type: String, default: null },
    headerImg: { type: String, default: null },
    contentType: { type: String, required: true, enum: ['default', 'md'], default: 'default' },
    content: { type: String, default: null },
    socialVideoType: { type: String, enum: ['youtube', 'other'], default: null },
    socialVideo: { type: String, default: null },
    socialRepositoryType: { type: String, enum: ['github', 'gitlab', 'other'], default: null },
    socialRepository: { type: String, default: null },
    customUri: {
      type: String,
      required: true,
      unique: true,
      default: `${Date.now()}${Math.floor(Math.random() * 123555738)}`
    },
    removedAt: { type: Date, default: null },
    inactivatedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    boostedAt: { type: Date, default: null }
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  }
)

article.plugin(validator)
article.pre('updateOne', function (next) {
  this.options.runValidators = true
  this.options.context = 'query'
  next()
})

module.exports = mongoose.model('articles', article)
