import { ApolloServer, makeExecutableSchema } from 'apollo-server-lambda'
import * as resolvers from './resolvers'
import * as typeDefs from './schema'
import * as jwt from '~/auth/jwt'
import { cookie, parseCookies, Headers } from '~/utils/http'

export const requests: Record<
  string,
  { responseHeaders?: Record<string, string[]> }
> = {}

export const schema = makeExecutableSchema({
  typeDefs: Object.values(typeDefs),
  resolvers: resolvers as any,
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
        ;(requests[requestId].responseHeaders[header] ??= []).push(value)
      },
      setCookie(key, value, age) {
        logger.info('set cookie', cookie(key, value, age))
        ;(requests[requestId].responseHeaders['Set-Cookie'] ??= []).push(
          cookie(key, value, age)
        )
      },
      deleteCookie(key) {
        ;(requests[requestId].responseHeaders['Set-Cookie'] ??= []).push(
          cookie(key, 'deleted', -1)
        )
        if (key === 'auth') delete ctx.user
      },
      cookies,
    }

    try {
      if (cookies.auth) ctx.user = jwt.decode(cookies.auth).sub as string
    } catch (jwtError) {
      logger.error("couldn't decode auth cookie", { jwtError, cookies })
      ctx.deleteCookie('auth')
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
  formatError(err) {
    logger.error(err)
    return err
  },
})

export const handler = server.createHandler({
  cors: {
    origin: process.env.IS_OFFLINE
      ? 'http://localhost:3000'
      : ['https://picast.app', 'https://staging.picast.app'],
    credentials: true,
  },
})
