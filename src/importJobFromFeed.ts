import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'

import { getFeeds, createJob } from './lib/graphUtils'
import { IFeed } from './lib/interface'
import { sliceArray } from './lib/utils'

interface IEventData {
  sourceId?: string
  concurrent?: number
}

interface ISuccess {
  id: string
  url: string
  status: string
}

interface IFail {
  sourceId: string
  sourceTitle: string
  feed: string
  massage: any,
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { concurrent = 10 } = event.data
    const success: ISuccess[] = []
    const fail: IFail[] = []

    const feeds: [IFeed] = await getFeeds(api)
    for (const chunks of sliceArray(feeds, concurrent)) {
      await Promise.all(chunks.map(async (feed: IFeed) => {
        try {
          const parser = require('rss-parser')
          const aaa = await new Promise((resolve, reject) => {
            parser.parseURL(feed.feed, async (err, parsed) => {
              if (err) {
                const failResponse: IFail = {
                  feed: feed.feed,
                  massage: err,
                  sourceId: feed.source.id,
                  sourceTitle: feed.source.title,
                }
                fail.push(failResponse)
                reject()
              } else {
                await Promise.all(parsed.feed.entries.map(async (entry) => {
                  try {
                    const result: ISuccess = await createJob(api, entry.link, feed.category.id)
                    success.push(result)
                  } catch (err) {
                    const failResponse: IFail = {
                      feed: feed.feed,
                      massage: err,
                      sourceId: feed.source.id,
                      sourceTitle: feed.source.title,
                    }
                    fail.push(failResponse)
                  }
                }))
                resolve()
              }
            })
          })
        } catch (err) {
          const failResponse: IFail = {
            feed: feed.feed,
            massage: err,
            sourceId: feed.source.id,
            sourceTitle: feed.source.title,
          }
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
