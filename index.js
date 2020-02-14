/**
 * Quick and dirty way to send mail with service account
 * @module g-mail-client
 */

const { google } = require('googleapis')
const Mime = require('mime-message')

const _gmail = google.gmail('v1')

module.exports = (function () {
  'use strict'

  let _initialized = false

  const _config = {
    keyFile: null,
    gSuiteAdminAccount: null,
    domain: null
  }
  /**
   * Initialize g-mail-client API module
   *
   * Note: See README_DOMAIN_CONFIG.md on how to set up your G Suite domain
   * @memberof module:g-mail-client
   * @param {object} options
   * @param {string} options.keyFile
   * @param {string} options.gSuiteAdminAccount
   * @param {string} options.domain
   * @returns {Promise}
   * @see {@link ./README_DOMAIN_CONFIG.md}
   */
  const init = async ({
    keyFile = r(),
    gSuiteAdminAccount = r(),
    domain = r()
  } = {}) => {
    _config.keyFile = keyFile
    _config.gSuiteAdminAccount = gSuiteAdminAccount
    _config.domain = domain
    const authClient = await _getAuthClient()
    try {
      google.options({
        auth: authClient
      })
      _initialized = true
    } catch (err) {
      throw new GMailClientError(err.message)
    }
    return true
  }

  const _getAuthClient = async () => {
    const auth = new google.auth.GoogleAuth({
      keyFile: _config.keyFile,
      scopes: [
        // 'https://www.googleapis.com/auth/gmail.compose',
        // 'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send'
      ]
    })
    const authClient = await auth.getClient()
    // Belangrijk! Staat niet in docs. ..
    // Dit is een account die rechten heeft om het domein te beheren
    authClient.subject = _config.gSuiteAdminAccount
    return authClient
  }

  // PUBLIC API

  /**
   * Send mail
   * @memberof module:g-mail-client
   * @param {object} options
   * @param {string|array} options.to // Format: 'Name <account@example.com>'
   * @param {string|array} [options.cc] = [] // Format: 'Name <account@example.com>'
   * @param {string} options.subject
   * @param {string} options.htmlMessage
   * @returns {Promise<Object>}
   */
  const send = async ({
    to = r(),
    cc = [],
    subject = r(),
    htmlMessage = r()
  } = {}) => {
    if (!_initialized) e('Module g-mail-client not initialized with init()')
    try {
      const messageData = {
        type: 'text/html',
        encoding: 'UTF-8',
        to: to,
        cc: cc,
        date: new Date(),
        subject: subject,
        body: htmlMessage
      }
      const message = Mime.createMimeMessage(messageData)
      const base64SafeString = message.toBase64SafeString()
      const res = await _gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: base64SafeString
        }
      })

      return res.data
    } catch (err) {
      console.log(err)
      throw new GMailServiceError(err.response.statusText, err.response.status)
    }
  }

  /**
   * GMailClientError
   * @class
   * @memberof module:g-mail-client
   */
  class GMailClientError extends Error {
    /**
     * Constructor
     * @param {string} message
     */
    constructor (message) {
      super(message)
      this.name = 'GMailClientError'
    }
  }

  /**
   * GMailServiceError
   * @class
   * @memberof module:g-mail-client
   */
  class GMailServiceError extends Error {
    /**
     * Constructor
     * @param {string} message
     */
    constructor (message, statusCode) {
      super(message)
      this.name = 'GMailServiceError'
      this.statusCode = statusCode
    }
  }

  // Utility shortcut functions
  // Parameter error func used if parameter is required
  const r = () => {
    e('Vereiste parameter is niet opgegeven')
  }
  // Shortcut for throwing a g-admin-client error
  const e = (message) => {
    throw new GMailClientError(message)
  }
  // Shortcut for console.log
  // const l = (v) => {
  //   console.log(util.inspect(v, { color: true, depth: null }))
  // }

  // Expose public API
  return {
    init,
    send
  }
}())
