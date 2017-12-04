import { GraphQLClient } from 'graphql-request'
import { Job, STATUS } from './interface'


export async function getJob(api: GraphQLClient, id: string): Promise<Job> {
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

  return api.request<{ Job: Job }>(query, variables)
    .then(r => r.Job)
}

const defaultFilter = {
  status_not: STATUS.COMPLETE
}
export async function getJobs(api: GraphQLClient, filter: object = defaultFilter): Promise<[Job]> {
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
    return api.request<{ allJobs: [Job] }>(query, variables)
      .then(r => r.allJobs)
  } catch (e) { throw (e) }
}

