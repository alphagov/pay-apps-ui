'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView
const productsClient = require('../services/clients/products_client')

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const paymentAmount = req.paymentAmount // should be undefined for non adhoc payments
  const referenceNumber = req.referenceNumber // undefined for non ADHOC or ADHOC with reference disabled
  if (product) {
    logger.info(`[${correlationId}] creating charge for product ${product.name}`)
    return productsClient.payment.create(product.externalId, paymentAmount, referenceNumber)
      .then(payment => {
        logger.info(`[${correlationId}] initiating payment for charge ${payment.externalChargeId}`)
        return res.redirect(303, payment.links.next.href)
      })
      .catch(err => {
        logger.error(`[${correlationId}] error creating charge for product ${product.externalId}. err = ${err}`)
        return errorResponse(req, res, messages.internalError, err.errorCode || 500)
      })
  } else {
    logger.error(`[${correlationId}] product not found to make payment`)
    return errorResponse(req, res, messages.internalError, 500)
  }
}