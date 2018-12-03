const crypto = require('crypto-js')

import config from '../../.config.js'

function getBaseRequest () {
  return {
    // postbackUrl: config.postbackUrl, // you get a copy of the response here
    clientId: config.ACCOUNTS.SAGE.developer.id,
    merchantId: config.ACCOUNTS.SAGE.merchant.id,
    authKey: undefined,
    salt: undefined,
    requestType: config.ACCOUNTS.SAGE.requestType,
    orderNumber: undefined,
    amount: '0.01'
  }
}

function getPreppedBaseRequest () {
  const newRequest = getBaseRequest()
  const nonces = getSecureNonces()
  newRequest.orderNumber = Date.now().toString()
  newRequest.salt = nonces.salt
  newRequest.merchantKey = config.ACCOUNTS.SAGE.merchant.key
  return [newRequest, nonces]
}

function getAuthedRequest () {
  const br = getPreppedBaseRequest()
  const newRequest = br[0]
  const nonces = br[1]
  newRequest.authKey = getAuthKey(JSON.stringify(newRequest), nonces, config.ACCOUNTS.SAGE.developer.key)
  delete newRequest.merchantKey
  return newRequest
}

function getCustomRequest (customValues) {
  const br = getPreppedBaseRequest()
  const newRequest = br[0]
  const nonces = br[1]
  Object.keys(customValues).map(
    key => {
      newRequest[key] = customValues[key]
    }
  )
  newRequest.authKey = getAuthKey(JSON.stringify(newRequest), nonces, config.ACCOUNTS.SAGE.developer.key)
  delete newRequest.merchantKey
  return newRequest
}

function getSecureNonces () {
  const iv = crypto.lib.WordArray.random(16)
  const salt = crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(crypto.enc.Hex.stringify(iv)))
  return {
    iv: iv,
    salt: salt
  }
}

function getAuthKey (message, nonces, secret) {
  var derivedPassword = crypto.PBKDF2(secret, nonces.salt, { keySize: 256 / 32, iterations: 1500, hasher: crypto.algo.SHA1 })
  var encrypted = crypto.AES.encrypt(message, derivedPassword, { iv: nonces.iv })
  return encrypted.toString()
}

function getHmac (string, secret) {
  const hmac = crypto.HmacSHA512(string, secret)
  return crypto.enc.Base64.stringify(hmac)
}

module.exports = {
  getInitialization: () => getAuthedRequest(),
  getCustomInitialization: customValues => getCustomRequest(customValues),
  getResponseHashes: response => ({
    hash: getHmac(response, config.ACCOUNTS.SAGE.developer.key)
  })
}
