import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { getJobs } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'
import { sliceArray } from './lib/utils'

interface IEventData {
  concurrent: number
  first: number
}

interface IResult {
  id: string
}

interface ISuccess {
  id: string
  status: STATUS
}

interface IFail {
  id: string
  massage: any,
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { concurrent = 10, first = 10 } = event.data
    const jobs: [IJob] = await getJobs(api, first)
    const success: ISuccess[] = []
    const fail: IFail[] = []

    if (jobs && jobs.length > 0) {
      for (const chunks of sliceArray(jobs, concurrent)) {
        await Promise.all(chunks.map(async (job) => {
          try {
            switch (job.status) {
              case STATUS.EXTRACTING:
                job = await mutateExtractArticle(api, job.id)
                const extractResponse: ISuccess = { id: job.id, status: job.status }
                success.push(extractResponse)
                break
              case STATUS.TRANSLATING:
                job = await mutateTranslate(api, job.id)
                const translateResponse: ISuccess = { id: job.id, status: job.status }
                success.push(translateResponse)
                break
              case STATUS.IMAGING:
                job = await mutateUploadImage(api, job.id)
                const uploadResponse: ISuccess = { id: job.id, status: job.status }
                success.push(uploadResponse)
                break
              case STATUS.PUBLISHING:
                job = await mutatePostToSite(api, job.id)
                const postResponse: ISuccess = { id: job.id, status: job.status }
                success.push(postResponse)
                break
            }
          } catch (massage) {
            const failResponse: IFail = { massage, id: job.id }
            fail.push(failResponse)
          }

        }))
      }
    }
    return { data: { fail, success } }
  } catch (error) {
    return { error }
  }
}

async function mutateExtractArticle(api: GraphQLClient, jobId: string): Promise<IJob> {

  const mutation = `
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
    return api.request<{ newExtractArticle: IJob }>(mutation, variables)
      .then((r) => r.newExtractArticle)
  } catch (e) { throw (e) }
}

async function mutateTranslate(api: GraphQLClient, jobId: string): Promise<IJob> {

  const mutation = `
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
    return api.request<{ translate: IJob }>(mutation, variables)
      .then((r) => r.translate)
  } catch (e) { throw (e) }
}

async function mutateUploadImage(api: GraphQLClient, jobId: string): Promise<IJob> {

  const mutation = `
      mutation mutateUploadImage($jobId: ID!) {
        uploadImage(jobId: $jobId) {
          id
          status
        }
      }
      `

  const variables = {
    jobId,
  }
  try {
    return api.request<{ uploadImage: IJob }>(mutation, variables)
      .then((r) => r.uploadImage)
  } catch (e) { throw (e) }
}

async function mutatePostToSite(api: GraphQLClient, jobId: string): Promise<any> {

  const mutation = `
        mutation mutatePostToSite($jobId: ID!) {
          postToSite(jobId: $jobId) {
            id
            status
          }
        }
        `

  const variables = {
    jobId,
  }
  try {
    return api.request<{ postToPage: IJob }>(mutation, variables)
      .then((r) => r.postToSite)
  } catch (e) { throw (e) }
}
