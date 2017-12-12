import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { uploadImage } from './lib/external-api/wordpress'
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
    const article = await getArticle(api, job.article.id)
    const images = []
    await Promise.all(
      article.images.map(async (img) => images.push(await uploadImage(job.site, img))),
    )
    const updateImages = []
    await Promise.all(
      images.map(async (img) => updateImages.push(await updateImage(api, img.id, img.postRef, img.target))),
    )
    const response: IResponse = await updateJob(api, jobId, article.id, STATUS.PUBLISHING)
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

async function updateImage(
  api: GraphQLClient,
  imageId: string,
  postRef: number,
  target: string,
): Promise<IImage> {
  const mutation = `
    mutation insertExtractedData($imageId: ID!, $postRef: Int, $target: String){
      updateImage(id: $imageId, postRef: $postRef, target: $target){
        id
        postRef
        target
      }
    }
  `
  const variables = {
    imageId,
    postRef,
    target,
  }

  return api.request<{ updateImage: IImage }>(mutation, variables)
    .then((r) => r.updateImage)
}
