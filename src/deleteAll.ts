import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'

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
    const results: IResult[] = []
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
  try {
    table = table.replace(/y$/, 'ie')
    const query = `
      query getAll${table}s{
        all${table}s{
          id
        }
      }
    `

    return api.request<{ getAll: any }>(query)
      .then((r) => r[`all${table}s`])
  } catch (e) {
    throw (e)
  }
}

async function dynamicDelete(api: GraphQLClient, table: string, id: string): Promise<IResult> {
  try {
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
  } catch (e) {
    throw (e)
  }
}
