import { GraphQLClient } from 'graphql-request'
import { IJob, ISTATUS } from './interface'

export async function getJob(api: GraphQLClient, id: string): Promise<IJob> {
  const query = `
      query getJob($id: ID!) {
        Job(id: $id) {
          id
          url
          status
          rawHTML
          rawTitle
          rawArticle
          rawTranslate
          article{
            id
          }
        }
      }
    `

  const variables = {
    id,
  }

  return api.request<{ Job: IJob }>(query, variables)
    .then((r) => r.Job)
}

const defaultFilter = {
  status_not: ISTATUS.COMPLETE,
}
export async function getJobs(api: GraphQLClient, filter: object = defaultFilter): Promise<[IJob]> {
  const query = `
  query getJobs($filter: JobFilter){
      allJobs(filter: $filter) {
        id
        url
        status
        rawHTML
        rawTitle
        rawArticle
        rawTranslate
        article{
          id
        }
      }
    }
  `
  const variables = {
    filter,
  }

  try {
    return api.request<{ allJobs: [IJob] }>(query, variables)
      .then((r) => r.allJobs)
  } catch (e) { throw (e) }
}
