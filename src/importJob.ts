import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { createJob } from './lib/graphUtils'
import { sliceArray } from './lib/utils'

interface IEventData {
  urlList: [string]
  categoryId: string
  concurrent?: number
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
  massage: any,
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { urlList, categoryId, concurrent = 10 } = event.data
    const success: ISuccess[] = []
    const fail: IFail[] = []
    for (const chunks of sliceArray(urlList, concurrent)) {
      await Promise.all(chunks.map(async (url: string) => {
        try {
          const result: ISuccess = await createJob(api, url, categoryId)
          success.push(result)
        } catch (massage) {
          const failResponse: IFail = { massage, url }
          fail.push(failResponse)
        }
      }))
    }

    return {
      data: { fail, success },
    }
  } catch (error) {
    return { error }
  }
}
