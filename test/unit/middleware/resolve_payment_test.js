'use strict'

// NPM Dependencies
const nock = require('nock')
const sinon = require('sinon')
const {expect} = require('chai')
const lodash = require('lodash')

// Local Dependencies
const config = require('../../../config')
const {Payment} = require('../../../app/models/payment')
const productFixtures = require('../../fixtures/product_fixtures')
const resolvePayment = require('../../../app/middleware/resolve_payment')

describe('resolve payment middleware', () => {
  describe('when the payment exists', () => {
    let req, res, next, payment

    before(done => {
      payment = productFixtures.validCreatePaymentResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
      req = {}
      res = {
        locals: {},
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(() => done(new Error('Resolve payment middleware unexpectedly rendered a page')))
      }
      lodash.set(req, 'params.paymentExternalId', payment.external_id)
      next = sinon.spy(err => done(err))
      resolvePayment(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it(`should set 'req.product' equal to the returned Payment`, () => {
      expect(req).to.have.property('payment').to.deep.equal(new Payment(payment))
    })

    it(`it should call 'next' with no arguments`, () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when the payment doesn\'t exist', () => {
    let req, res, next, payment

    before(done => {
      payment = productFixtures.validCreateProductResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(404)
      req = {}
      res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(() => done())
      }
      lodash.set(req, 'params.paymentExternalId', payment.external_id)
      next = sinon.spy(err => done(err))
      resolvePayment(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it(`should return error 404 to the user`, () => {
      expect(res.status.lastCall.args[0]).to.equal(404)
    })

    it(`should render the error view`, () => {
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('Sorry, we are unable to process your request')
    })

    it(`it should not call 'next'`, () => {
      expect(next.called).to.equal(false)
    })
  })

  describe('when some other error occurs while attempting to retrieve the payment', () => {
    let req, res, next, payment

    before(done => {
      payment = productFixtures.validCreateProductResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).replyWithError(new Error('Some bad stuff happened'))
      req = {}
      res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(() => done())
      }
      lodash.set(req, 'params.paymentExternalId', payment.external_id)
      next = sinon.spy(err => done(err))
      resolvePayment(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it(`should return the http code received to the user`, () => {
      expect(res.status.lastCall.args[0]).to.equal(500)
    })

    it(`should render the error view`, () => {
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('Sorry, we are unable to process your request')
    })

    it(`it should not call 'next'`, () => {
      expect(next.called).to.equal(false)
    })
  })
})
