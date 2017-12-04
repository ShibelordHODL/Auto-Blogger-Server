import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { translate } from './lib/external-api/google'
import { Job, STATUS } from './lib/interface'
import { getJob } from './lib/graphUtils'

interface EventData {
  jobId: string
}
export default async event => {
  try {
    // input data
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data;
    const job: Job = await getJob(api, jobId)
    const data = job.rawTitle + "<z>" + job.rawArticle
    const returnData = await translate(data)
    let article = returnData.data.translations[0].translatedText
    const seperatorIndex = article.indexOf("<z>")
    const title = article.slice(0, seperatorIndex)
    article = article.substring(seperatorIndex + 3, article.length)

    // return { error: { returnData } }
    const updateResponse: Job = await updateJob(api, job.id, job.article.id, title, article, STATUS.PUBLISHING)
    return {
      data: {
        id: updateResponse.id,
        status: updateResponse.status,
        rawTranslate: updateResponse.rawTranslate,
      }
    };
  } catch (error) {
    return { error };
  }
};

async function updateJob(api: GraphQLClient, jobId: string, articleId: string, title: string, rawTranslate: string, status: STATUS): Promise<Job> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $articleId: ID!, $title: String, $rawTranslate: String, $status: STATUS){
      updateArticle(id: $articleId, title: $title, article: $rawTranslate, status: $status){
        id
        status
      }
      updateJob(id: $jobId, rawTranslate: $rawTranslate, status: $status){
        id
        status
        rawTranslate
      }
    }
  `
  const variables = {
    jobId,
    articleId,
    title,
    rawTranslate,
    status
  }

  return api.request<{ updateJob: Job }>(mutation, variables)
    .then(r => r.updateJob)
}
