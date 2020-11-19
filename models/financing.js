'use strict';
const config = require('../config');
var request = require('request');

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

FinancingSchema.methods.markDelivered = async function() {
  // Mark it delivered in the DB
  this.set({status: 'delivered'})
  await this.save()

  // Communicate to Stripe that it was delivered
  return new Promise((resolve, reject) => {
    request.post(`${config.stripeUri}/capital/financing_offers/${this.stripeFinancingId}/mark_delivered`, {
      'auth': {
        'bearer': `${config.stripe.secretKey}`
      }
    },
      (e, r, body) => {
        if (e) {
          reject(e);
          return;
        }
        resolve(body);
      }
    )
  });
}

const Financing = mongoose.model('Financing', FinancingSchema);

module.exports = Financing;
