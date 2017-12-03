import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'

interface User {
  id: string
}

interface Job {
  id: string
  url: string
  status: STATUS
  rawHTML: string
  rawArticle: string
  rawTranslate: string
  article: Article
}

interface Article {
  id: string
  url: string
  title: string
  user: User
  status: STATUS
  job: Job
}

interface EventData {
  limit: number
}

interface ProcessResponse {
  id: string
  status: STATUS
}

enum STATUS {
  QUEUING = "QUEUING",
  EXTRACTING = "EXTRACTING",
  TRANSLATING = "TRANSLATING",
  COMPLETE = "COMPLETE"
}

export default async (event: FunctionEvent<EventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { limit } = event.data
    const jobs: [Job] = await getJobs(api);
    let returnResponse: ProcessResponse[] = []

    if (jobs && jobs.length > 0) {
      for (let job of jobs) {
        if (job.status === STATUS.EXTRACTING) {
          job = await mutateExtractArticle(api, job.id)
        }
        if (job.status === STATUS.TRANSLATING) {
          job = await mutateTranslate(api, job.id)
        }

        const response: ProcessResponse = {
          id: job.id,
          status: job.status
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

async function getJobs(api: GraphQLClient): Promise<[Job]> {
  const query = `
  query getJobs{
      allJobs(filter: {
        status_not: COMPLETE
      }) {
        id
        status
      }
    }
  `
  try {
    return api.request<{ allJobs: [Job] }>(query)
      .then(r => r.allJobs)
  } catch (e) { throw (e) }
}

async function mutateFetchHTML(api: GraphQLClient, jobId: string): Promise<Job> {
  const query = `
  mutation mutateFetchHTML($jobId: ID!) {
    fetchHTML(jobId: $jobId) {
    	id
    	status
      rawHTML
    }
  }
  `

  const variables = {
    jobId,
  }

  return api.request<{ fetchHTML: Job }>(query, variables)
    .then(r => r.fetchHTML)
}

async function mutateExtractArticle(api: GraphQLClient, jobId: string): Promise<Job> {

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
    return api.request<{ newExtractArticle: Job }>(query, variables)
      .then(r => r.newExtractArticle)
  } catch (e) { throw (e) }
}

async function mutateTranslate(api: GraphQLClient, jobId: string): Promise<Job> {

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
    return api.request<{ translate: Job }>(query, variables)
      .then(r => r.translate)
  } catch (e) { throw (e) }
}
