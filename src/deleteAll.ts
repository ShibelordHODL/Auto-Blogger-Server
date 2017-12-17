import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import { sliceArray } from './lib/utils'

interface IEventData {
  table: string
  deleteList: [string]
  concurrent?: number
}

interface IResult {
  id: string
}

interface ISuccess {
  id: string
}

interface IFail {
  id: string
  massage: any,
}

interface IRow {
  id: string
}

export default async (event: FunctionEvent<IEventData>) => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { table, deleteList, concurrent = 10 } = event.data
    const success: ISuccess[] = []
    const fail: IFail[] = []
    if (deleteList) {
      const list = deleteList
      for (const chunks of sliceArray(list, concurrent)) {
        await Promise.all(chunks.map(async (row: string) => {
          try {
            const result: IResult = await dynamicDelete(api, table, row)
            success.push(result)
          } catch (massage) {
            const failResponse: IFail = { massage, id: row }
            fail.push(failResponse)
          }
        }))
      }

      // for (const row of list) {
      //   const result: IResult = await dynamicDelete(api, table, row)
      //   results.push(result)
      // }
    } else {
      const list = await getAll(api, table)
      for (const chunks of sliceArray(list, concurrent)) {
        await Promise.all(chunks.map(async (row: IRow) => {
          try {
            const result: IResult = await dynamicDelete(api, table, row.id)
            success.push(result)
          } catch (massage) {
            const failResponse: IFail = { massage, id: row.id }
            fail.push(failResponse)
          }
        }))
      }

    }
    return { data: { fail, success } }
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
