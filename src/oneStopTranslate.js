import { fromEvent, FunctionEvent } from 'graphcool-lib'
import { GraphQLClient } from 'graphql-request'
import * as validator from 'validator'

interface User {
  id: string
}

interface Job {
  id: string
  url: string
  status: string
}

interface EventData {
  url: string
}

const SALT_ROUNDS = 10

export default async (event: FunctionEvent<EventData>) => {
  console.log(event)

  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')

    const { email, password } = event.data

    if (!validator.isEmail(email)) {
      return { error: 'Not a valid email' }
    }

    // check if user exists already
    const userExists: boolean = await getUser(api, email)
      .then(r => r.User !== null)
    if (userExists) {
      return { error: 'Email already in use' }
    }

    // create password hash
    const salt = bcrypt.genSaltSync(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    // create new user
    const userId = await createGraphcoolUser(api, email, hash)

    // generate node token for new User node
    const token = await graphcool.generateNodeToken(userId, 'User')

    return { data: { id: userId, token } }
  } catch (e) {
    console.log(e)
    return { error: 'An unexpected error occured during signup.' }
  }
}

async function getUser(api: GraphQLClient, id: string): Promise<{ User }> {
  const query = `
      query getUser($id: ID!) {
        User(id: $id) {
          id
        }
      }
    `

  const variables = {
    id,
  }

  return api.request<{ User }>(query, variables)
}

async function createGraphcoolJob(api: GraphQLClient, url: string, userId: string): Promise<{ Job }> {
  const mutation = `
    mutation createGraphcoolJob($url: String!, $userId: string!) {
      createJob(
        url: $url,
        userId: $userId,
        status: QUEUING
      ) {
        id
        url
      }
    }
  `

  const variables = {
    url,
    userId,
  }

  return api.request<{ createJob: Job }>(mutation, variables)
}
