import Conf from 'conf'

let store

function getStore() {
  if (!store) store = new Conf({ projectName: 'coinank-cli' })
  return store
}

function failConfig(action, err) {
  console.error(`Error: Could not ${action} config: ${err.message}`)
  process.exit(1)
}

export function getApiKey() {
  if (process.env.COINANK_API_KEY) return process.env.COINANK_API_KEY
  try {
    return getStore().get('apikey') || null
  } catch {
    return null
  }
}

export function setApiKey(key) {
  try {
    getStore().set('apikey', key)
  } catch (err) {
    failConfig('write', err)
  }
}

export function deleteApiKey() {
  try {
    getStore().delete('apikey')
  } catch (err) {
    failConfig('write', err)
  }
}

export function getConfigPath() {
  try {
    return getStore().path
  } catch (err) {
    return `unavailable (${err.message})`
  }
}

export function requireApiKey() {
  const key = getApiKey()
  if (!key) {
    console.error(
      'Error: API key not set.\n' +
        '  Set via env:    export COINANK_API_KEY="your_key"\n' +
        '  Or via config:  coinank config set apikey <your_key>\n' +
        '  Get a key at:   https://coinank.com'
    )
    process.exit(1)
  }
  return key
}
