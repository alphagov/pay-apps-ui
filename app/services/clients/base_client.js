'use strict'

// NPM Dependencies
const correlator = require('correlation-id')
const logger = require('winston')
const request = require('requestretry')

// Local Dependencies
const customCertificate = require('../../utils/custom_certificate')
const CORRELATION_HEADER_NAME = require('../../../config').CORRELATION_HEADER

// Create request.defaults config
const requestOptions = {
  agentOptions: {
    keepAlive: true,
    maxSockets: process.env.MAX_SOCKETS || 100
  },
  json: true,
  maxAttempts: 3,
  retryDelay: 5000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Adding retry on ECONNRESET as a temporary fix for PP-1727
  retryStrategy: retryOnECONNRESET()
}
requestOptions.headers.__defineGetter__(CORRELATION_HEADER_NAME, getCorrelationId)

if (process.env.DISABLE_INTERNAL_HTTPS !== 'true') {
  customCertificate.addCertsToAgent(requestOptions.agentOptions)
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.')
}

// Export base client
module.exports = request.defaults(requestOptions)

function retryOnECONNRESET (err) {
  return err && ['ECONNRESET'].includes(err.code)
}

function getCorrelationId () {
  return correlator.getId() || ''
}
