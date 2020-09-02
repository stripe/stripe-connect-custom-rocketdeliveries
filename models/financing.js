'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Use native promises.
mongoose.Promise = global.Promise;

// Define the Financing schema.
const FinancingSchema = new Schema({
  pilot: { type : Schema.ObjectId, ref : 'Pilot', required: true },
  status: { type: String, enum: ['undelivered', 'delivered', 'accepted', 'completed', 'expired']},
  created: { type: Date, default: Date.now },

  // Stripe Financing ID corresponding to this offer.
  stripeFinancingId: String
});

const Financing = mongoose.model('Financing', FinancingSchema);

module.exports = Financing;
