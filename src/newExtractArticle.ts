import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as sanitizeHtml from 'sanitize-html'
import fetch from "node-fetch"
// import formData from 'form-data'

import { MERCURY_API, MERCURY_KEY } from "./config";

interface Job {
  id: string
  url: string
  status: STATUS
  rawHTML: string
  rawTitle: string
  rawArticle: string
  rawTranslate: string
  user: User
  article: Article
}

interface Article {
  url: string
  title: string
  user: User
  status: STATUS
  job: Job
  publishedDate: Date
  createdDate: Date
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

export default async event => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data;
    const job: Job = await getJob(api, jobId)
    const url = job.url

    const extract = await extractArticle(url);
    const cleanHTML = await cleanPageHTML(extract.content);
    const articleData = {
      status: STATUS.TRANSLATING,
      userId: job.user.id,
      url: job.url,
      publishedDate: extract.date_published,
      createdDate: new Date(),
      images: [{
        source: extract.lead_image_url
      }]
    }
    // return { error: JSON.stringify(articleData) }
    const updateResponse: Job = await updateJob(api, jobId, extract.title, articleData, cleanHTML, STATUS.TRANSLATING)
    return {
      data: {
        id: updateResponse.id,
        status: updateResponse.status,
        rawArticle: updateResponse.rawArticle,
      }
    };

  } catch (error) {
    return { error };
  }
  // return { data: { html: url } };
};

async function getJob(api: GraphQLClient, id: string): Promise<Job> {
  const query = `
    query getJob($id: ID!) {
      Job(id: $id) {
        id
        url
        user {
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

async function updateJob(api: GraphQLClient, jobId: string, title: string, articleData: object, rawArticle: string, status: STATUS): Promise<Job> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $title: String, $articleData: JobarticleArticle, $rawArticle: String, $status: STATUS){
      updateJob(
        rawTitle: $title,
        id: $jobId, 
        rawArticle: $rawArticle, 
        status: $status,
        article: $articleData
      ){
        id
        status
        rawArticle
      }
    }
  `
  const variables = {
    jobId,
    title,
    articleData,
    rawArticle,
    status
  }

  return api.request<{ updateJob: Job }>(mutation, variables)
    .then(r => r.updateJob)
}

const sanitizeConfigs: Object = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    // 'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    // 'title',
    'img',
    // 'html',
    // 'head',
    // 'meta',
    // 'body',
    'figure',
    // 'article',
    // 'link',
    // 'nav',
    // 'span',
    // 'div'


  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    // We don't currently allow img itself by default, but this
    // would make sense if we did
    img: ['src', 'alt'],
    meta: ['*'],
    // link: ['*'],
    article: ['*'],
    figure: ['*'],
    // span: ['class'],
    // div: ['class']
  },
  // Lots of these won't come up by default because we don't allow them
  // selfClosing: ['br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
  // URL schemes we permit
  allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
  allowedSchemesByTag: {},
  allowProtocolRelative: true,
};

function cleanPageHTML(d) {
  // var sanitizeHtml = require('sanitize-html');
  const c = sanitizeHtml(d, (sanitizeConfigs));
  return c;
}

async function extractArticle(url) {
  const headers = {
    "x-api-key": MERCURY_KEY,
  };
  const response = await fetch(MERCURY_API + url, { headers });
  return response.json();
}