import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import fetch from "node-fetch";
import 'url-search-params-polyfill';

import { GOOGLE_TRANSLATE_API, GOOGLE_KEY, GOOGLE_TRANSLATE_TARGET_LANGUAGE } from "./config";
interface Job {
  id: string
  url: string
  status: STATUS
  rawTitle: string
  rawArticle: string
  rawTranslate: string
  article: Article
}

interface Article {
  id: string
  url: string
  title: string
  article: string
  status: STATUS
  job: Job
}

enum STATUS {
  QUEUING = "QUEUING",
  EXTRACTING = "EXTRACTING",
  TRANSLATING = "TRANSLATING",
  COMPLETE = "COMPLETE"
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
    let article = returnData.data.translations[0].translatedText
    const seperatorIndex = article.indexOf("<z>")
    const title = article.slice(0, seperatorIndex)
    article = article.substring(seperatorIndex + 3, article.length)

    // return { error: { returnData } }
    const updateResponse: Job = await updateJob(api, job.id, job.article.id, title, article, STATUS.COMPLETE)
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

async function translate(rawArticle) {
  // create header and body
  const headers = {
    'content-type': 'application/x-www-form-urlencoded'
  };
  const params = new URLSearchParams({
    key: GOOGLE_KEY,
    target: GOOGLE_TRANSLATE_TARGET_LANGUAGE,
    format: 'html',
    q: rawArticle
  });
  // call the api
  const response = await fetch(GOOGLE_TRANSLATE_API, {
    method: "POST",
    headers,
    body: params
  });

  return response.json();
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
