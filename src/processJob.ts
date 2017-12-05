import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { getJobs } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'

interface IEventData {
  limit: number
}

interface IProcessResponse {
  id: string
  status: STATUS
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { limit } = event.data
    const jobs: [IJob] = await getJobs(api)
    const returnResponse: IProcessResponse[] = []

    if (jobs && jobs.length > 0) {
      for (let job of jobs) {
        if (job.status === STATUS.EXTRACTING) {
          job = await mutateExtractArticle(api, job.id)
        }
        if (job.status === STATUS.TRANSLATING) {
          job = await mutateTranslate(api, job.id)
        }

        const response: IProcessResponse = {
          id: job.id,
          status: job.status,
        }

        returnResponse.push(response)

      }

      return { data: returnResponse }

    } else {
      return { data: [] }
    }

    // return { data: { id: userId, token } }
  } catch (error) {
    return { error }
  }
}

async function mutateExtractArticle(api: GraphQLClient, jobId: string): Promise<IJob> {

  const query = `
  mutation mutateExtractArticle($jobId: ID!) {
    newExtractArticle(jobId: $jobId) {
    	id
    	status
      rawArticle
    }
  }
  `

  const variables = {
    jobId,
  }
  try {
    return api.request<{ newExtractArticle: IJob }>(query, variables)
      .then((r) => r.newExtractArticle)
  } catch (e) { throw (e) }
}

async function mutateTranslate(api: GraphQLClient, jobId: string): Promise<IJob> {

  const query = `
  mutation mutateTranslate($jobId: ID!) {
    translate(jobId: $jobId) {
    	id
    	status
      rawTranslate
    }
  }
  `

  const variables = {
    jobId,
  }
  try {
    return api.request<{ translate: IJob }>(query, variables)
      .then((r) => r.translate)
  } catch (e) { throw (e) }
}
