import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import fetch from "node-fetch";

interface Job {
  id: string
  url: string
  status: STATUS
  rawHTML: string
  rawArticle: string
  rawTranslate: string
  user: User
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

enum STATUS {
  QUEUING = "QUEUING",
  EXTRACTING = "EXTRACTING",
  TRANSLATING = "TRANSLATING",
  COMPLETE = "COMPLETE"
}

interface User {
  id: string
}

interface EventData {
  jobId: string
}
export default async (event: FunctionEvent<EventData>) => {

  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')
  const { jobId } = event.data;
  const job: Job = await getJob(api, jobId)
  // no user with this email
  if (!job) {
    return { error: `Cannot Load Job Data {jobId = ${jobId}}` }
  }

  try {
    const response = await fetch(job.url, { credentials: 'include' })
    const html = await response.text()
    let updateResponse: Job
    if (job.article) {
      updateResponse = await updateJobWithArticle(api, job.id, job.article.id, html, STATUS.EXTRACTING)
    } else {
      updateResponse = await updateJobWithoutArticle(api, job.id, job.user.id, html, STATUS.EXTRACTING)
    }

    return {
      data: {
        id: updateResponse.id,
        status: updateResponse.status,
        rawHTML: updateResponse.rawHTML,
      }
    };
  } catch (error) {
    return { error }
  }
};

async function getJob(api: GraphQLClient, id: string): Promise<Job> {
  const query = `
    query getJob($id: ID!) {
      Job(id: $id) {
        id
        url
        status
        rawHTML
        rawArticle
        rawTranslate
        user {
          id
        }
        article {
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

async function updateJobWithoutArticle(api: GraphQLClient, jobId: string, userId: string, rawHTML: string, status: STATUS): Promise<Job> {
  const mutation = `
  mutation insertFetchedData($jobId: ID!, $userId: ID!,$rawHTML: String, $status: STATUS){
    updateJob(
      id: $jobId, 
      rawHTML: $rawHTML, 
      status: $status,
      article:  {
        status: $status
        userId: $userId
      }
    ){
      id
      status
      rawHTML
    }
  }
  `
  const variables = {
    jobId,
    userId,
    rawHTML,
    status
  }

  return api.request<{ updateJob: Job }>(mutation, variables)
    .then(r => r.updateJob)
}

async function updateJobWithArticle(api: GraphQLClient, jobId: string, articleId: string, rawHTML: string, status: STATUS): Promise<Job> {
  const mutation = `
    mutation insertFetchedData($jobId: ID!, $articleId: ID!, $rawHTML: String, $status: STATUS){
      updateArticle(id: $articleId, status: $status){
        id
        status
      }
      updateJob(id: $jobId, rawHTML: $rawHTML, status: $status){
        id
        status
        rawHTML
      }
    }
  `
  const variables = {
    jobId,
    articleId,
    rawHTML,
    status
  }

  return api.request<{ updateJob: Job }>(mutation, variables)
    .then(r => r.updateJob)
}
