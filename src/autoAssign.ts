import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { uploadArticle, uploadImage } from './lib/external-api/wordpress'
import { getArticles, getSite } from './lib/graphUtils'
import { IArticle, ICategory, IJob, ISite, STATUS } from './lib/interface'
import { offsetDate, sliceArray } from './lib/utils'

interface IEventData {
  siteId: string
  days: number
  dateOffset: number
  concurrent: number
  postLimit: number
}

interface IResponse {
  id: string
  status: string
  postDate: Date
}

interface ISuccess {
  id: string
  status: string
  postDate: Date
}

interface IFail {
  id: string
  massage: any,
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { siteId, days, dateOffset, concurrent = 10, postLimit } = event.data
    const site: ISite = await getSite(api, siteId)
    const success = []
    const fail: IFail[] = []

    const startDate = offsetDate(new Date(), dateOffset)
    for (const siteCategory of site.categories) {
      const limit = (postLimit) ? postLimit : siteCategory.limitPost
      const articles: [IArticle] = await getArticles(
        api,
        siteCategory.category.id,
        limit * days,
      )
      let chunkIndex = 0
      for (const chunks of sliceArray(articles, concurrent)) {
        await Promise.all(chunks.map(async (article: IArticle, i: number) => {

          try {

            const response = await updateJob(
              api,
              article.id,
              article.job.id,
              siteId,
              siteCategory.id,
              STATUS.TRANSLATING,
              offsetDate(startDate, Math.floor((i + (chunkIndex * concurrent)) / limit)),
            )
            success.push(response)

          } catch (massage) {
            const failResponse: IFail = { massage, id: article.id }
            fail.push(failResponse)
          }
        }))
        chunkIndex++
      }
    }
    // console.log(JSON.stringify(success))
    return {
      data: { fail, success },
    }

  } catch (error) {
    return { error }
  }
}

async function updateJob(
  api: GraphQLClient,
  articleId: string,
  jobId: string,
  siteId: string,
  siteCategoryId: string,
  status: STATUS,
  postDate: Date,
): Promise<IJob> {
  const mutation = `
    mutation insertAssignData(
      $articleId: ID!,
      $jobId: ID!,
      $siteId: ID,
      $siteCategoryId: ID,
      $status: STATUS,
      $postDate: DateTime
    ){
      updateArticle(id: $articleId, status: $status){
        id
        status
      }
      updateJob(
        id: $jobId,
        siteId: $siteId
        siteCategoryId: $siteCategoryId
        status: $status,
        postDate: $postDate
      ){
        id
        status
        postDate
      }
    }
  `
  const variables = {
    articleId,
    jobId,
    postDate,
    siteCategoryId,
    siteId,
    status,
  }
  try {
    return api.request<{ updateJob: IJob }>(mutation, variables)
      .then((r) => r.updateJob)
  } catch (e) { throw (e) }
}
