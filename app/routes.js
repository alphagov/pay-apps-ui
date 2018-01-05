'use strict'

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate_route')
const paths = require('./paths.js')

// - Controllers
const staticCtrl = require('./controllers/static_controller')
const healthcheckCtrl = require('./controllers/healthcheck_controller')
const prePaymentCtrl = require('./controllers/pre_payment_controller')
const completeCtrl = require('./controllers/demo_payment/payment_complete_controller')
const failedCtrl = require('./controllers/demo_payment/payment_failed_controller')
const successCtrl = require('./controllers/demo_payment/payment_success_controller')
const howToPayCtrl = require('./controllers/adhoc_payment/how_to_pay_controller')

// Middleware
const resolveProduct = require('./middleware/resolve_product')
const resolvePayment = require('./middleware/resolve_payment')
// - Middleware
const correlationId = require('./middleware/correlation_id')

// Assignments
const {healthcheck, staticPaths, pay, demoPayment, adhocPayment} = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationId)

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckCtrl)

  // STATIC
  app.all(staticPaths.naxsiError, staticCtrl.naxsiError)

  // CREATE PAYMENT
  app.get(pay.product, resolveProduct, prePaymentCtrl)

  // DEMO SPECIFIC SCREENS
  app.get(demoPayment.complete, resolvePayment, completeCtrl)
  app.get(demoPayment.failure, failedCtrl)
  app.get(demoPayment.success, successCtrl)

  // ADHOC SPECIFIC SCREENS
  app.get(adhocPayment.howToPay, resolveProduct, howToPayCtrl)
}
