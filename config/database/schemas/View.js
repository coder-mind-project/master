const mongoose = require('mongoose')
const validator = require('mongoose-unique-validator')

/**
 * @description The View (Article view) Schema
 * @type {mongoose.Schema}
 */
const view = new mongoose.Schema({
  _id: { type: mongoose.Schema.ObjectId, auto: true },
  reader: String,
  startRead: Date,
  article: Object,
  viewsQuantity: { type: Number, default: 1 }
})

view.plugin(validator)

module.exports = mongoose.model('views', view)
