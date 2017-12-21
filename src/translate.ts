import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { getJob } from './lib/graphUtils'
import { IJob, STATUS } from './lib/interface'
import { localTranslate } from './lib/utils'

interface IEventData {
  jobId: string
}
export default async (event) => {
  try {
    // input data
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data
    const job: IJob = await getJob(api, jobId)
    const content = await localTranslate(job.rawArticle)
    // const content = returnData.data.translations[0].translatedText

    // return { error: { returnData } }
    const updateResponse: IJob = await updateJob(api, job.id, job.article.id, content, STATUS.IMAGING)
    return {
      data: {
        id: updateResponse.id,
        rawTranslate: updateResponse.rawTranslate,
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
  rawTranslate: string,
  status: STATUS,
): Promise<IJob> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $articleId: ID!, $rawTranslate: String, $status: STATUS){
      updateArticle(id: $articleId, content: $rawTranslate, status: $status){
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
    articleId,
    jobId,
    rawTranslate,
    status,
  }

  return api.request<{ updateJob: IJob }>(mutation, variables)
    .then((r) => r.updateJob)
}
