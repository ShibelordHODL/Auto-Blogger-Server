import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { uploadArticle } from './lib/external-api/wordpress'
import { getArticle, getJob } from './lib/graphUtils'
import { IArticle, ICategory, IImage, IJob, ISite, STATUS } from './lib/interface'

interface IEventData {
  jobId: string
}

interface IResponse {
  id: string
  status: string
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data
    const returnResponse: IResponse[] = []
    const job: IJob = await getJob(api, jobId)
    const article: IArticle = await getArticle(api, job.article.id)
    const mainImage: IImage = article.images.find((img) => img.ref === 'i_m')
    const uploadResponse = await uploadArticle(job.site, article, mainImage.postRef, job.siteCategory.ref, job.postDate)
    const response: IResponse = await updateJob(api, jobId, article.id, STATUS.COMPLETE)
    return {
      data: response,
    }

  } catch (error) {
    return { error }
  }
}

async function updateJob(
  api: GraphQLClient,
  jobId: string,
  articleId: string,
  status: STATUS,
): Promise<IJob> {
  const mutation = `
    mutation insertExtractedData($jobId: ID!, $articleId: ID!, $status: STATUS){
      updateArticle(id: $articleId, status: $status){
        id
        status
      }
      updateJob(id: $jobId, status: $status){
        id
        status
      }
    }
  `
  const variables = {
    articleId,
    jobId,
    status,
  }

  return api.request<{ updateJob: IJob }>(mutation, variables)
    .then((r) => r.updateJob)
}
