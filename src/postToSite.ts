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
    console.log('-0')
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { jobId } = event.data
    const returnResponse: IResponse[] = []
    console.log('0')
    const job: IJob = await getJob(api, jobId)
    console.log('1')
    const article: IArticle = await getArticle(api, job.article.id)
    console.log('2')
    const mainImage: IImage = article.images.find((img) => img.ref === 'i_m')
    console.log('3')
    const uploadResponse = await uploadArticle(job.site, article, mainImage.postRef, job.siteCategory.ref, job.postDate)
    console.log('4')
    const response: IResponse = await updateJob(api, jobId, article.id, STATUS.COMPLETE)
    console.log('5')
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
