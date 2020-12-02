import { ApolloServer, makeExecutableSchema } from 'apollo-server-lambda'
import * as resolvers from './resolvers'
import * as typeDefs from './schema'
import { decode, cookie } from '~/auth'
import { parseCookies, Headers } from '~/utils/http'

export const requests: Record<string, any> = {}

export const schema = makeExecutableSchema({
  typeDefs: Object.values(typeDefs),
  resolvers,
  inheritResolversFromInterfaces: true,
})

export const server = new ApolloServer({
  schema,
  debug: !!process.env.IS_OFFLINE,
  context: ({ event, context }) => {
    const headers = new Headers(event.headers)
    const requestId = context.awsRequestId

    const cookies = parseCookies(headers.get('cookie'))

    const ctx: ResolverCtx = {
      setHeader(header, value) {
        requests[requestId].responseHeaders[header] = value
      },
      signOut,
    }

    try {
      if (cookies.auth) {
        const jwt = decode(cookies.auth)
        ctx.user = jwt.id
      }
    } catch (jwtError) {
      logger.error("couldn't decode auth cookie", { jwtError, cookies })
      signOut()
    }

    function signOut() {
      requests[requestId].responseHeaders['Set-Cookie'] = cookie(
        'auth',
        'deleted',
        -1
      )
      delete ctx.user
    }

    return ctx
  },
  introspection: true,
  playground: {
    endpoint: '/',
    settings: {
      'request.credentials': 'same-origin',
      'editor.fontFamily':
        "'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
      // @ts-ignore
      'schema.polling.enable': false,
    },
  },
  engine: false,
})

export const handler = server.createHandler({
  cors: {
    origin: process.env.IS_OFFLINE
      ? 'http://localhost:3000'
      : 'https://picast.app',
    credentials: true,
  },
})
