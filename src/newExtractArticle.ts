import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { Job, Article, STATUS } from './lib/interface'
import { getJob } from './lib/graphUtils'
import { cleanPageHTML } from './lib/utils'
import { extractArticle } from './lib/external-api/mercury'

export interface EventData {
  jobId: string
}

export default async event => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data;
    const job: Job = await getJob(api, jobId)
    const url = job.url

    const extract = await extractArticle(url);
    const cleanHTML = await cleanPageHTML(extract.content);
    const articleData = {
      status: STATUS.TRANSLATING,
      url: job.url,
      publishedDate: extract.date_published,
      images: [{
        source: extract.lead_image_url
      }]
    }
    // return { error: JSON.stringify(articleData) }
    const updateResponse: Job = await updateJob(api, jobId, extract.title, articleData, cleanHTML, STATUS.TRANSLATING)
    return {
      data: {
        id: updateResponse.id,
        status: updateResponse.status,
        rawArticle: updateResponse.rawArticle,
      }
    };

  } catch (error) {
    return { error };
  }
  // return { data: { html: url } };
}

async function updateJob(api: GraphQLClient, jobId: string, title: string, articleData: object, rawArticle: string, status: STATUS): Promise<Job> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $title: String, $articleData: JobarticleArticle, $rawArticle: String, $status: STATUS){
      updateJob(
        id: $jobId, 
        rawTitle: $title,
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
    jobId,
    title,
    articleData,
    rawArticle,
    status
  }

  return api.request<{ updateJob: Job }>(mutation, variables)
    .then(r => r.updateJob)
}