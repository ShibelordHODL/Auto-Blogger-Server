import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { translate } from './lib/external-api/google'
import { extractArticle } from './lib/external-api/mercury'
import { getJob } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'
import { cleanPageHTML, extractImages } from './lib/utils'

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
    const title = await translate(extract.title)
    const articleData = {
      images: [{
        source: extract.lead_image_url,
      }],
      publishedDate: extract.date_published,
      status: STATUS.TRANSLATING,
      title,
      url: job.url,
    }
    // return { error: JSON.stringify(articleData) }
    const updateResponse: IJob = await updateJob(api, jobId, articleData, cleanHTML, STATUS.TRANSLATING)
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
  articleData: object,
  rawArticle: string,
  status: STATUS,
): Promise<IJob> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $articleData: JobarticleArticle, $rawArticle: String, $status: STATUS){
      updateJob(
        id: $jobId,
        rawArticle: $rawArticle,
        status: $status,
        article: $articleData
      ){
        id
        status
        rawArticle
      }
    }
  `
  const variables = {
    articleData,
    jobId,
    rawArticle,
    status,
  }

  return api.request<{ updateJob: IJob }>(mutation, variables)
    .then((r) => r.updateJob)
}
