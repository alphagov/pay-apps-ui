'use strict'

// Local dependencies
const pactBase = require('./pact_base')

// Global setup
const pactServices = pactBase({ array: ['service_ids'] })

module.exports = {
  validServiceResponse: (serviceData = {}) => {
    const defaultCustomBranding = { cssUrl: 'css url', imageUrl: 'image url' }

    const data = {
      external_id: serviceData.external_id || 'service-external-id',
      service_name: serviceData.service_name || { en: 'Super GOV service' },
      name: serviceData.name || 'Super Duper service',
      gateway_account_ids: serviceData.gateway_account_ids || ['111'],
      custom_branding: serviceData.custom_branding || defaultCustomBranding,
      test: 'test value to update contract'
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  }
}
