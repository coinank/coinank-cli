import Conf from 'conf'

const store = new Conf({ projectName: 'coinank-cli' })

export function getApiKey() {
  return process.env.COINANK_API_KEY || store.get('apikey') || null
}

export function setApiKey(key) {
  store.set('apikey', key)
}

export function deleteApiKey() {
  store.delete('apikey')
}

export function getConfigPath() {
  return store.path
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
