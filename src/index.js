/* global API_URL */

const {
  BaseKonnector,
  cozyClient
} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(start)

const SETTINGS_DOCTYPE = 'io.cozy.bank.settings'
const OPERATIONS_DOCTYPE = 'io.cozy.bank.operations'

async function start() {
  const settings = await getBankSettings()
  const lastSeq = await getLastSeq(settings)
  const {
    transactions,
    lastSeq: newLastSeq
  } = await getTransactionsChanges(lastSeq)

  await updateLastSeq(settings, newLastSeq)

  if (transactions.length > 0) {
    sendData(transactions)
  } else {
    console.log('No transaction to send')
  }
}

async function getBankSettings() {
  const [settings] = await cozyClient.data.findAll(SETTINGS_DOCTYPE)

  return settings
}

async function getLastSeq(settings) {
  const lastSeq = settings.categorizationKonnector && settings.categorizationKonnector.lastSeq || '0'

  return lastSeq
}

async function getTransactionsChanges(lastSeq) {
  const result = await cozyClient.fetchJSON(
    'GET',
    `/data/${OPERATIONS_DOCTYPE}/_changes?include_docs=true&since=${lastSeq}`
  )

  const transactions = result.results
    .map(transaction => transaction.doc)
    .filter(doc => doc._id.indexOf('_design') !== 0)
    .filter(doc => !doc._deleted)

  return {
    transactions,
    lastSeq: result.last_seq
  }
}

async function updateLastSeq(settings, lastSeq) {
  if (!settings.categorizationKonnector) {
    settings.categorizationKonnector = {}
  }

  settings.categorizationKonnector.lastSeq = lastSeq

  return cozyClient.data.update(SETTINGS_DOCTYPE, settings, settings)
}

function sendData(transactions) {
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(transactions)
  }

  return fetch(API_URL, options)
    .then(response => console.log(response))
    .catch(err => console.log(err))
}
