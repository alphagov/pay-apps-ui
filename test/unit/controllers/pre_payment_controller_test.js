'use strict'

const chai = require('chai')
const config = require('../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const {getApp} = require('../../../server')
const {createAppWithSession} = require('../../test_helpers/mock_session')
const productFixtures = require('../../fixtures/product_fixtures')
const paths = require('../../../app/paths')
const expect = chai.expect
let product, payment, response, $
describe.only('pre payment controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  const productTypes = ['DEMO', 'PROTOTYPE']

  productTypes.forEach((type) => {
    describe(`when the payment type is ${type}`, () => {
      describe('and payment creation is successful', () => {
        before(done => {
          product = productFixtures.validCreateProductResponse({type: type}).getPlain()
          payment = productFixtures.validCreatePaymentResponse().getPlain()
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
          nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`).reply(200, payment)

          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              done(err)
            })
        })
        it('should redirect with code: 303 \'See Other\'', () => {
          expect(response.statusCode).to.equal(303)
        })
        it('should redirect to next_url', () => {
          expect(response.header).property('location').to.equal(payment._links.find(link => link.rel === 'next').href)
        })
      })
      describe('and payment creation fails', () => {
        before(done => {
          product = productFixtures.validCreateProductResponse({type: type}).getPlain()
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
          nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`).reply(400)
          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              $ = cheerio.load(res.text || '')
              done(err)
            })
        })
        it('should respond with code returned from charges endpoint', () => {
          expect(response.statusCode).to.equal(400)
        })
        it('should render error page', () => {
          expect($('.page-title').text()).to.equal('An error occurred:')
          expect($('#errorMsg').text()).to.equal('We are unable to process your request at this time')
        })
      })
      describe('and the product is not resolved', () => {
        before(done => {
          product = productFixtures.validCreateProductResponse({type: type}).getPlain()
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(404)
          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              $ = cheerio.load(res.text || '')
              done(err)
            })
        })
        it('should respond with code returned from products endpoint', () => {
          expect(response.statusCode).to.equal(404)
        })
        it('should render error page', () => {
          expect($('.page-title').text()).to.equal('An error occurred:')
          expect($('#errorMsg').text()).to.equal('Sorry, we are unable to process your request')
        })
      })
    })
  })

  describe(`when the payment type is ADHOC`, () => {
    before(done => {
      product = productFixtures.validCreateProductResponse({type: 'ADHOC'}).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .get(paths.pay.product.replace(':productExternalId', product.external_id))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it('should redirect with code: 303 \'See Other\'', () => {
      expect(response.statusCode).to.equal(303)
    })
    it('should redirect to \'how-to-pay\'', () => {
      expect(response.header).property('location').to.equal(`/adhoc/how-to-pay/${product.external_id}`)
    })
  })

  describe(`when the payment type is UNKNOWN`, () => {
    before(done => {
      product = productFixtures.validCreateProductResponse({type: 'UNKNOWN'}).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .get(paths.pay.product.replace(':productExternalId', product.external_id))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it('should respond with code returned from products endpoint', () => {
      expect(response.statusCode).to.equal(500)
    })
    it('should render error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Sorry, we are unable to process your request')
    })
  })
})
