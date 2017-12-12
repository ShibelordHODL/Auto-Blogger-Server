import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { translate } from './lib/external-api/google'
import { extractArticle } from './lib/external-api/mercury'
import { getJob } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'
import { cleanPageHTML, replaceImages } from './lib/utils'

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
    const cleanHTML = await cleanPageHTML(extract.content)
    const replaceData = replaceImages(cleanHTML)
    const titleData = await translate(extract.title)

    const articleData = {
      images: [...replaceData.images, {
        ref: 'i_m',
        source: extract.lead_image_url,
      }],
      publishedDate: extract.date_published,
      status: STATUS.ASSIGNING,
      title: titleData.data.translations[0].translatedText,
      url: job.url,
      wordCount: extract.word_count,
    }
    const updateResponse: IJob = await updateJob(
      api, jobId, job.article.id, articleData, replaceData.html, STATUS.ASSIGNING,
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
      $jobId: ID!, $articleId: ID!, $images: [ArticleimagesImage!],
      $publishedDate: DateTime, $title: String, $url: String,
      $rawArticle: String, $status: STATUS
    ){
      updateArticle(
        id: $articleId, images: $images, publishedDate: $publishedDate, status: $status, title: $title, url: $url
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
    images: articleData.images,
    jobId,
    publishedDate: articleData.publishedDate,
    rawArticle,
    status,
    title: articleData.title,
    url: articleData.url,
  }

  return api.request<{ updateJob: IJob }>(mutation, variables)
    .then((r) => r.updateJob)
}
