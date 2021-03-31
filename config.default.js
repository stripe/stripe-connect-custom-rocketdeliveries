'use strict';

module.exports = {
  // App name
  appName: 'Rocket Deliveries',

  // Public domain of Rocket Deliveries
  publicDomain: 'http://localhost:3000',

  // Whether to register webhook events. For a local development environment, 
  // you can also forward webhook events with the Stripe CLI:
  //   stripe listen -f localhost:3000/pilots/stripe/webhooks
 registerWebhooks: true,

  // Server port
  port: 3000,

  // Secret for cookie sessions
  secret: 'YOUR_SECRET',

  // Configuration for Stripe
  // API Keys: https://dashboard.stripe.com/account/apikeys
  // Connect Settings: https://dashboard.stripe.com/account/applications/settings
  stripe: {
    secretKey: 'YOUR_STRIPE_SECRET_KEY',
    publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY',
    clientId: 'YOUR_STRIPE_CLIENT_ID',
  },

  //sslKey: '/path/to/private/key',
  //sslCrt: '/path/to/crt',
  
  // This is optional when enabling HTTPs support
  //caCrt: '/path/to/ca',

  // Is a redirect from HTTP (TCP 80) needed? Note that you can only start a listener on TCP 80 as a super user since it's a well known port
  redirectHttp: false,

  // Configuration for MongoDB
  mongoUri: 'mongodb://localhost/rocketdeliveries',

  // Configuration for Google Cloud (only useful if you want to deploy to GCP)
  gcloud: {
    projectId: 'YOUR_PROJECT_ID'
  }
};
