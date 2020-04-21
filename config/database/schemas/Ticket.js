const mongoose = require('mongoose')
const validator = require('mongoose-unique-validator')

/**
 * @description The Ticket Schema
 * @type {mongoose.Schema}
 */
const ticket = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.ObjectId, auto: true },
    type: String,
    user: { type: mongoose.Schema.ObjectId },
    dateOccurrence: Date,
    adminId: { type: mongoose.Schema.ObjectId },
    userId: { type: mongoose.Schema.ObjectId },
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

module.exports = mongoose.model('tickets', ticket)
