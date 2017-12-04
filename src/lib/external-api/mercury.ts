import fetch from 'node-fetch'
import { MERCURY_API, MERCURY_KEY } from '../config'

export async function extractArticle(url) {
  const headers: any = {
    'x-api-key': MERCURY_KEY,
  }
  const response = await fetch(MERCURY_API + url, { headers })
  return response.json()
}
