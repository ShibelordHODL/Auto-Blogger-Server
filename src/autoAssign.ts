import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { uploadArticle, uploadImage } from './lib/external-api/wordpress'
import { getArticles, getSite } from './lib/graphUtils'
import { IArticle, ICategory, IJob, ISite, STATUS } from './lib/interface'
import { offsetDate } from './lib/utils'

interface IEventData {
  siteId: string
  days: number
  dateOffset: number
}

interface IResponse {
  id: string
  status: string
  postDate: Date
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { siteId, days, dateOffset } = event.data
    const site: ISite = await getSite(api, siteId)
    const returnResponse = []

    const startDate = offsetDate(new Date(), dateOffset)
    for (const siteCategory of site.categories) {
      const articles: [IArticle] = await getArticles(api, siteCategory.category.id, siteCategory.limitPost * days)
      let index = 0
      for (const article of articles) {
        const response = await updateJob(
          api,
          article.job.id,
          siteId,
          siteCategory.id,
          STATUS.EXTRACTING,
          offsetDate(startDate, Math.floor(index / siteCategory.limitPost)),
        )
        returnResponse.push(response)
        index++
      }

    }
    return {
      data: returnResponse,
    }

  } catch (error) {
    return { error }
  }
}

async function updateJob(
  api: GraphQLClient,
  jobId: string,
  siteId: string,
  siteCategoryId: string,
  status: STATUS,
  postDate: Date,
): Promise<IJob> {
  const mutation = `
    mutation insertAssignData($jobId: ID!, $siteId: ID, $siteCategoryId: ID, $status: STATUS, $postDate: DateTime){
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
    jobId,
    postDate,
    siteCategoryId,
    siteId,
    status,
  }

  return api.request<{ updateJob: IJob }>(mutation, variables)
    .then((r) => r.updateJob)
}
