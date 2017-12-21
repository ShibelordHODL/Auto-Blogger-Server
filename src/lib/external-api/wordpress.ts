
// import FormData from 'form-data'
import { IArticle, IImage, IPost, ISite } from '../interface'

interface IUploadImage {
  id: string
  source_url: string
}
async function downloadImage(url) {
  try {
    return await fetch(url)
      .then((r: any) => r.buffer())
  } catch (e) {
    throw (e)
  }

}

export async function uploadImage(site: ISite, image: IImage) {
  try {
    const imageURL = cleanImageURL(image.source)
    const imageName = imageURL.substr(imageURL.lastIndexOf('/') + 1, imageURL.length) + '.jpg'
    const imageBuffer = await downloadImage(image.source)
    const headers = {
      authorization: site.token,
    }
    const FormData = require('form-data')
    const data = new FormData()
    data.append('title', imageName)
    data.append('alt_text', imageName)
    data.append('caption', imageName)
    data.append('description', imageName)
    data.append('file', imageBuffer, imageName)
    const options: any = {
      body: data,
      credentials: 'include',
      headers,
      method: 'POST',
    }
    const response: IUploadImage = await fetch(site.apiPath + '/media', options).then((r) => r.json())
    const imageObj: IImage = { ...image, postRef: response.id, target: response.source_url }
    return imageObj
  } catch (e) {
    throw (e)
  }

}

export async function uploadArticle(site: ISite, article: IArticle, imageId: number, ref: number, postDate: Date) {
  try {
    let content = article.content
    for (const image of article.images) {
      content = content.replace(image.ref, image.target)
    }

    const headers = {
      authorization: site.token,
    }
    const FormData = require('form-data')
    const data = new FormData()
    data.append('title', article.title)
    data.append('content', content)
    data.append('featured_media', imageId)
    data.append('status', 'publish')
    data.append('tag', '[]')
    data.append('date', postDate)
    data.append('categories', ref)
    const options: any = {
      body: data,
      credentials: 'include',
      headers,
      method: 'POST',
    }
    const response = await fetch(site.apiPath + '/posts', options).then((r) => r.json())
    const postObj: IPost = {
      articleId: article.id,
      siteId: site.id,
      url: response.link,
    }

    return postObj
  } catch (e) {
    throw (e)
  }
}

function cleanImageURL(source) {
  let url = source
  // if (url && url.indexOf('%') > 0) {
  //   url = url.substr(0, url.indexOf('%'))
  // }
  if (url && url.indexOf('?') > 0) {
    url = url.substr(0, url.indexOf('?'))
  }
  return url
}
