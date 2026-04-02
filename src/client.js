import axios from 'axios'
import { requireApiKey } from './config.js'

const BASE_URL = 'https://open-api.coinank.com'

export function createClient() {
  const apikey = requireApiKey()
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { apikey },
  })

  client.interceptors.response.use(
    (res) => {
      const body = res.data
      if (body.code === '-3') {
        console.error('Error: Invalid API key. Check your key at https://coinank.com')
        process.exit(1)
      }
      if (body.code === '-7') {
        console.error('Error: Request timestamp expired. Check your system clock.')
        process.exit(1)
      }
      if (body.code !== '1' && body.success !== true) {
        console.error(`API Error (code ${body.code}): ${body.msg || 'Unknown error'}`)
        process.exit(1)
      }
      return body.data
    },
    (err) => {
      if (err.response?.status === 401) {
        console.error('Error: Unauthorized — API key may be expired or invalid.')
      } else {
        console.error(`Network error: ${err.message}`)
      }
      process.exit(1)
    }
  )

  return client
}

// Returns current millisecond timestamp (cross-platform safe)
export function nowMs() {
  return Date.now().toString()
}
