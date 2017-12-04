import fetch from 'node-fetch'
import 'url-search-params-polyfill'
import { GOOGLE_KEY, GOOGLE_TRANSLATE_API, GOOGLE_TRANSLATE_TARGET_LANGUAGE } from '../config'

export async function translate(rawArticle) {
  // create header and body
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  }
  const paramsObject: any = {
    format: 'html',
    key: GOOGLE_KEY,
    q: rawArticle,
    target: GOOGLE_TRANSLATE_TARGET_LANGUAGE,

  }
  const params = new URLSearchParams(paramsObject)
  // call the api
  const fetchOption: object = {
    body: params,
    headers,
    method: 'POST',
  }
  const response = await fetch(GOOGLE_TRANSLATE_API, fetchOption)

  return response.json()
}
