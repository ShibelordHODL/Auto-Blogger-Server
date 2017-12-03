import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as sanitizeHtml from 'sanitize-html'
import fetch from "node-fetch"
// import formData from 'form-data'

import { AYLIEN_APP_ID, AYLIEN_APP_KEY, AYLIEN_EXTRACT_API } from "./config";

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

export default async event => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data;
    const job: Job = await getJob(api, jobId)
    const rawHTML = job.rawHTML
    const cleanHTML = await cleanPageHTML(rawHTML);
    const updateData = await extractArticle(cleanHTML);

    const articleWithTag = await reverseTextToHTML(cleanHTML, updateData.article)
    const updateResponse: Job = await updateJob(api, job.id, job.article.id, updateData.title, articleWithTag, STATUS.TRANSLATING)
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

async function updateJob(api: GraphQLClient, jobId: string, articleId: string, title: string, rawArticle: string, status: STATUS): Promise<Job> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $articleId: ID!, $title: String, $rawArticle: String, $status: STATUS){
      updateArticle(id: $articleId, title: $title, status: $status){
        id
        status
      }
      updateJob(id: $jobId, rawArticle: $rawArticle, status: $status){
        id
        status
        rawArticle
      }
    }
  `
  const variables = {
    jobId,
    articleId,
    title,
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
    'a',
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
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'title',
    'img',
    'html',
    'head',
    'meta',
    'body',
    'figure',
    'article',
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

async function extractArticle(html) {
  const headers = {
    "x-aylien-textapi-application-id": AYLIEN_APP_ID,
    "x-aylien-textapi-application-key": AYLIEN_APP_KEY
  };
  const FormData = require("form-data");
  const form = new FormData();
  form.append("language", "auto");
  form.append("html", html);
  const response = await fetch(AYLIEN_EXTRACT_API, {
    method: "POST",
    headers,
    body: form
  });
  return response.json();
}

async function reverseTextToHTML(html, article) {
  let cleanArticle = removeAllSpecialCharacter(article);
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const articleArea = $('p').parent()
  try {
    await $(articleArea).find('*').each(async function (i, elem) {
      let content = removeAllSpecialCharacter($(elem).text());
      if (cleanArticle.indexOf(content) > 0 && content.length > 3) {
        const tag = $(elem).get(0).tagName
        let atts = ' ';
        var entries = require('object.entries');
        entries($(elem).get(0).attribs).forEach(([key, value]) => {
          atts += `${key}="${value}" `;
        });
        cleanArticle = cleanArticle.replace(content, `<${tag}${atts ? atts : ''}>${content}</${tag}>`)
      }
    });
    return cleanArticle
  } catch (error) {
    return { error }
  }
}

function removeAllSpecialCharacter(text) {
  text = text.replace(/\s\s+/g, ' ');
  text = text.replace(/\n/g, " ");
  text = text.replace('\t', ' ');
  text = text.replace(/\s+/g, ' ');
  return text
}


