import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { createJob } from './lib/graphUtils'

interface IEventData {
  urlList: [string]
  categoryId: string
}

interface IResult {
  success: [ISuccess]
  fail: [IFail]
}

interface ISuccess {
  id: string
  url: string
  status: string
}

interface IFail {
  url: string
  massage: string,
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { urlList, categoryId } = event.data
    const success: ISuccess[] = []
    const fail: IFail[] = []
    for (const url of urlList) {
      try {
        const result: ISuccess = await createJob(api, url, categoryId)
        success.push(result)
      } catch (massage) {
        const failResponse: IFail = { massage, url }
        fail.push(failResponse)
      }
    }

    return {
      data: { fail, success },
    }
  } catch (error) {
    return { error }
  }
}
