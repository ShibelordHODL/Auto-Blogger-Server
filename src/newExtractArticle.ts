import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { extractArticle } from './lib/external-api/mercury'
import { getJob } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'
import { localTranslate } from './lib/utils'
import { cleanPageHTML, decodeHtmlEntity, replaceImages, wordCount } from './lib/utils'

export interface IEventData {
  jobId: string
}

export default async (event) => {
  try {

    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data
    const job: IJob = await getJob(api, jobId)
    const url = job.url
    const extract = await extractArticle(url)
    const title = await localTranslate(decodeHtmlEntity(extract.title))
    const excerpt = await localTranslate(decodeHtmlEntity(extract.excerpt))
    const replaceData = replaceImages(cleanPageHTML(extract.content))
    const articleData = {
      excerpt,
      images: [...replaceData.images, {
        ref: 'i_m',
        source: extract.lead_image_url,
      }],
      publishedDate: extract.date_published,
      status: STATUS.ASSIGNING,
      title,
      url: job.url,
      wordCount: wordCount(extract.content),
    }
    const updateResponse: IJob = await updateJob(
      api, jobId, job.article.id, articleData, decodeHtmlEntity(replaceData.html), STATUS.ASSIGNING,
    )

    return {
      data: {
        id: updateResponse.id,
        rawArticle: updateResponse.rawArticle,
        status: updateResponse.status,
      },
    }
  } catch (error) {
    return { error }
  }
}

async function updateJob(
  api: GraphQLClient,
  jobId: string,
  articleId: string,
  articleData: any,
  rawArticle: string,
  status: STATUS,
): Promise<IJob> {
  const mutation = `
    mutation insertExtractedData(
      $jobId: ID!, $articleId: ID!, $excerpt: String, $images: [ArticleimagesImage!],
      $publishedDate: DateTime, $title: String, $url: String,
      $rawArticle: String, $wordCount: Int, $status: STATUS
    ){
      updateArticle(
        id: $articleId, excerpt: $excerpt, images: $images, publishedDate: $publishedDate,
        status: $status, title: $title, url: $url, wordCount: $wordCount
      ){
        id
        status
      }
      updateJob(
        id: $jobId,
        rawArticle: $rawArticle,
        status: $status,
      ){
        id
        status
        rawArticle
      }
    }
  `
  const variables = {
    articleId,
    excerpt: articleData.excerpt,
    images: articleData.images,
    jobId,
    publishedDate: articleData.publishedDate,
    rawArticle,
    status,
    title: articleData.title,
    url: articleData.url,
    wordCount: articleData.wordCount,
  }
  try {
    return api.request<{ updateJob: IJob }>(mutation, variables)
      .then((r) => r.updateJob)
  } catch (e) { throw (e) }
}
