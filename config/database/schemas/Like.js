const mongoose = require('mongoose')
const validator = require('mongoose-unique-validator')

/**
 * @description The Like (Article like) Schema
 * @type {mongoose.Schema}
 */
const like = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.ObjectId, auto: true },
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

module.exports = mongoose.model('likes', like)
