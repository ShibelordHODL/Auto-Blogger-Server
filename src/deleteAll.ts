import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { translate } from './lib/external-api/google'
import { extractArticle } from './lib/external-api/mercury'
import { getJob } from './lib/graphUtils'
import { IArticle, IJob, STATUS } from './lib/interface'
import { cleanPageHTML, replaceImages } from './lib/utils'

interface IEventData {
  table: string
  deleteList: [string]
}

interface IResult {
  id: string
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { table, deleteList } = event.data
    const results = []
    if (deleteList) {
      const list = deleteList
      for (const row of list) {
        const result: IResult = await dynamicDelete(api, table, row)
        results.push(result)
      }
    } else {
      const list = await getAll(api, table)
      for (const row of list) {
        const result: IResult = await dynamicDelete(api, table, row.id)
        results.push(result)
      }
    }
    return { data: results }
  } catch (error) {
    return { error }
  }
}

async function getAll(api: GraphQLClient, table: string): Promise<[IResult]> {
  const query = `
    query getAll${table}{
      all${table}s{
        id
      }
    }
  `

  return api.request<{ getAll: any }>(query)
    .then((r) => r[`all${table}s`])
}

async function dynamicDelete(api: GraphQLClient, table: string, id: string): Promise<IResult> {
  const mutation = `
    mutation delete${table}($id: ID!){
      delete${table}(id: $id){
        id
      }
    }
  `
  const variables = {
    id,
  }

  return api.request<{ delete: any }>(mutation, variables)
    .then((r) => r[`delete${table}`])
}
