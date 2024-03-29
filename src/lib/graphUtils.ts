import { GraphQLClient } from 'graphql-request'
import { IArticle, IFeed, IJob, ISite, STATUS } from './interface'

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
          site{
            id
            apiPath
            token
          }
          siteCategory{
            ref
          }
          postDate
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
  status_not_in: [STATUS.COMPLETE, STATUS.ASSIGNING, STATUS.CANCELLED],
}
export async function getJobs(api: GraphQLClient, first: number, filter: object = defaultFilter): Promise<[IJob]> {
  const query = `
  query getJobs($filter: JobFilter, $first: Int){
      allJobs(filter: $filter, first: $first) {
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
    first,
  }

  try {
    return api.request<{ allJobs: [IJob] }>(query, variables)
      .then((r) => r.allJobs)
  } catch (e) { throw (e) }
}

export async function getSite(api: GraphQLClient, siteId: string): Promise<ISite> {
  const query = `
    query ( $siteId: ID!  ){
      Site( id: $siteId ){
        id
        title
        type
        apiPath
        token
        categories{
          id
          title
          ref
          category {
            id
          }
          limitPost
        }
      }
    }
  `

  const variables = {
    siteId,
  }

  try {
    return api.request<{ Site: ISite }>(query, variables)
      .then((r) => r.Site)
  } catch (e) { throw (e) }
}

export async function getSites(api: GraphQLClient): Promise<[ISite]> {
  const query = `
    query {
      allSites{
        id
        title
        type
        apiPath
        token
        categories{
          title
          ref
          category {
            id
          }
          limitPost
        }
      }
    }
  `

  try {
    return api.request<{ allSites: [ISite] }>(query)
      .then((r) => r.allSites)
  } catch (e) { throw (e) }
}

export async function getArticles(api: GraphQLClient, categoryId: string, limit: number): Promise<[IArticle]> {
  const query = `
    query getArticles($categoryId: ID!, $limit: Int){
      allArticles(
        filter: {
          category: {
            id: $categoryId
          }
          AND: {
            status: ASSIGNING
          }
        }
        first: $limit
      ) {
        id
        title
        content
        category{
          id
        }
        images{
          id
          ref
          source
        }
        wordCount
        excerpt
        status
        job{
          id
        }
      }
    }
  `

  const variables = {
    categoryId,
    limit,
  }

  try {
    return api.request<{ allArticles: [IArticle] }>(query, variables)
      .then((r) => r.allArticles)
  } catch (e) { throw (e) }
}

export async function getArticle(api: GraphQLClient, articleId: string): Promise<IArticle> {
  const query = `
    query getArticle($articleId: ID!){
      Article(
        id: $articleId
      ) {
        id
        title
        content
        category{
          id
        }
        images{
          id
          ref
          postRef
          source
          target
        }
        wordCount
        excerpt
        status
        job{
          id
        }
      }
    }
  `

  const variables = {
    articleId,
  }

  try {
    return api.request<{ Article: IArticle }>(query, variables)
      .then((r) => r.Article)
  } catch (e) { throw (e) }
}

export async function createJob(
  api: GraphQLClient,
  url: string,
  categoryId: string,
  feedId: string = null,
): Promise<IJob> {
  const mutation = `
    mutation createJob($url: String!, $categoryId: ID!, $feedId: ID){
      createJob(
        url: $url
        feedId: $feedId
        article: {
          categoryId: $categoryId
        }
      ){
        id
        url
        status
      }
    }
  `
  const variables = {
    categoryId,
    feedId,
    url,
  }

  return api.request<{ createJob: IJob }>(mutation, variables)
    .then((r) => r.createJob)
}

export async function getFeeds(api: GraphQLClient): Promise<[IFeed]> {
  const query = `
  query getFeeds{
      allFeeds{
        id
        feed
        category{
          id
        }
        source{
          id
          title
        }
      }
    }
  `

  try {
    return api.request<{ allFeeds: [IFeed] }>(query)
      .then((r) => r.allFeeds)
  } catch (e) { throw (e) }
}
