'use strict';

const config = require('../../config');
const stripe = require('stripe')(config.stripe.secretKey);
const Pilot = require('../../models/pilot');
const express = require('express');
const router = express.Router();

// Middleware that requires a logged-in pilot
function pilotRequired(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/pilots/login');
  } 
  next();
}

/**
 * GET /pilots/stripe/verify
  *
 * Redirect to Stripe and use Connect Onboarding to verify the pilot's identity.
 */
router.get('/verify', pilotRequired, async (req, res) => {
  const pilot = req.user;
  try {
    // Create a Stripe Account link for the Connect Onboarding flow
    const accountLink = await stripe.accountLinks.create({
      type: 'custom_account_verification',
      account: pilot.stripeAccountId,
      collect: 'currently_due',
      success_url: config.publicDomain + '/pilots/dashboard?showBanner=true',
      // In the case of a failure, e.g. the link expired or the account was rejected,
      // redirect the user to this URL to refresh the Account Link.
      failure_url: config.publicDomain + '/pilots/verify'
    });
    // Redirect to Stripe to start the Connect Onboarding flow.
    res.redirect(accountLink.url);
  } catch (err) {
    console.log('Error generating Connect Onboarding URL: ',err);
    return res.redirect('/pilots/dashboard');
  }
});

/**
 * POST /pilots/stripe/webhooks
 * 
 * Webhooks endpoint for Connect events so Stripe can notify us when a pilot is fully verified
 */
router.post('/webhooks', async (req, res)=> {
  // Check the webhook signature against our private signing secret
  const webhookSignature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, webhookSignature, req.app.get('webhookSecret'));
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }
  // The account.updated event is sent to this webhook endpoint whenever a connected account is updated.
  if (event.type === 'account.updated') {
    const account = event.data;

    try {
      // Find the pilot with the connected account ID
      const pilot = await Pilot.findOne({
        stripeAccountId: account.id
      })

      // For unverified pilots, check if Stripe is notifying us that they're now verified (and payouts are enabled)
      if (!pilot.stripeVerified && account.verification.status === 'verified' && account.payouts_enabled) {
        // Record them as verified
        console.log(`Webhook event: new verified pilot - ${pilot}`);
        pilot.set({stripeVerified: true});
        await pilot.save();
      }
    }
    catch (e) {
      console.log(`Unknown pilot with account ID ${account.id}`);
    }
  }
  // Stripe needs to receive a 200 status from any webhooks endpoint
  res.sendStatus(200);
});

/**
 * POST /pilots/stripe/payout
 *
 * Generate an instant payout with Stripe for the available balance.
 */
router.post('/payout', pilotRequired, async (req, res) => {
  const pilot = req.user;
  try {
    // Fetch the account balance to determine the available funds
    const balance = await stripe.balance.retrieve({
      stripe_account: pilot.stripeAccountId,
    });
    // This demo app only uses USD so we'll just use the first available balance
    // (Note: there is one balance for each currency used in your application)
    const {amount, currency} = balance.available[0];
    // Create an instant payout
    const payout = await stripe.payouts.create(
      {
        amount: amount,
        currency: currency,
        statement_descriptor: config.appName,
      },
      {
        stripe_account: pilot.stripeAccountId,
      }
    );
  } catch (err) {
    console.log(err);
  }
  res.redirect('/pilots/dashboard');
});

module.exports = router;
