import * as cheerio from 'cheerio'
import * as googleTranslate from 'google-translate-api'
import * as sanitizeHtml from 'sanitize-html'

const sanitizeConfigs: object = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    // 'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'img',
    'figure',

  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    // We don't currently allow img itself by default, but this
    // would make sense if we did
    img: ['src', 'alt'],
    meta: ['*'],
    // link: ['*'],
    article: ['*'],
    figure: ['*'],
    // span: ['class'],
    // div: ['class']
  },
  // Lots of these won't come up by default because we don't allow them
  // selfClosing: ['br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
  // URL schemes we permit
  allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
  allowedSchemesByTag: {},
  allowProtocolRelative: true,
}

export function cleanPageHTML(d) {
  // var sanitizeHtml = require('sanitize-html');
  const c = sanitizeHtml(d, (sanitizeConfigs))
  return c
}

export function replaceImages(html) {
  try {
    const $ = cheerio.load(html, {
      withDomLvl1: false,
    })
    const relativeLinks = $('img')
    const images = []
    let index = 1
    for (const image of relativeLinks) {
      const source = $(image).attr('src')
      const cleanImg = cleanImageURL(source)
      if (source) {
        images.push({
          ref: 'i_' + index,
          source: cleanImg,
        })
        const replaceElement = $(`<img src="i_${index}">`)
        $(image).replaceWith(replaceElement)
      }
      index++

    }
    return {
      html: $('body').html(),
      images,
    }
  } catch (error) {
    throw (error)
  }

}

export function offsetDate(startDate, offset) {
  const date = new Date(startDate.getTime())
  date.setDate(date.getDate() + offset)
  return date
}

function cleanImageURL(source) {
  let url = source
  if (url && url.indexOf('%') > 0) {
    url = url.substr(0, url.indexOf('%'))
  }
  // if (url && url.indexOf('?') > 0) {
  //   url = url.substr(0, url.indexOf('?'))
  // }
  return url
}

export function sliceArray(list: [any], size: number) {
  const chunks = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

export function wordCount(content: string) {
  const $ = cheerio.load(content, {
    withDomLvl1: false,
  })
  return $.text().split(' ').length
}

function sliceString(content, size = 5000) {
  if (size < 100) {
    size = 100
  }
  let currentString = content
  const chunks = []

  while (currentString.length > size) {
    const lastSentenceIndex = (currentString.substring(0, size).lastIndexOf('.') > 0)
      ? currentString.substring(0, size).lastIndexOf('.') + 1
      : currentString.substring(0, size).lastIndexOf(' ') + 1
    chunks.push(currentString.substring(0, lastSentenceIndex))
    currentString = (currentString.length > size)
      ? currentString.slice(lastSentenceIndex - currentString.length)
      : currentString
  }
  chunks.push(currentString)
  // const re = new RegExp('.{1,' + size + '}', 'g')
  // const chunks: any = content.match(re)
  return chunks
}

export async function localTranslate(rawArticle: string) {
  const results = []
  await Promise.all(sliceString(rawArticle).map(async (chunkArticle: string) => {
    const result = await googleTranslate(chunkArticle, { from: 'auto', to: 'en', raw: true })
      .then((res) => res.text).catch((err) => {
        console.log('hhh')
        console.error(err)
      })
    results.push(result)
  }))
  return results.join()
  // return await googleTranslate(rawArticle, { from: 'auto', to: 'en', raw: true })
  //   .then((res) => res.text).catch((err) => {
  //     console.log('hhh')
  //     console.error(err)
  //   })
}
