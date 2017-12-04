import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import fetch from "node-fetch";
import { translate } from './lib/utils'



interface Job {
  id: string
  status: STATUS
  rawTitle: string
  rawArticle: string
  rawTranslate: string
  article: Article
}

interface Article {
  id: string
  title: string
  article: string
  status: STATUS
}

enum STATUS {
  EXTRACTING = "EXTRACTING",
  TRANSLATING = "TRANSLATING",
  PUBLISHING = "PUBLISHING"
}

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
    console.log(JSON.stringify(returnData));
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

async function getJob(api: GraphQLClient, id: string): Promise<Job> {
  const query = `
    query getJob($id: ID!) {
      Job(id: $id) {
        id
        rawTitle
        rawArticle
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
