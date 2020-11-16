import { ApolloServer, makeExecutableSchema } from 'apollo-server-lambda'
import * as resolvers from './resolvers'
import * as typeDefs from './schema'

export const requests = {}

export const schema = makeExecutableSchema({
  typeDefs: Object.values(typeDefs),
  resolvers,
  inheritResolversFromInterfaces: true,
})

export const server = new ApolloServer({
  schema,
  debug: !!process.env.IS_OFFLINE,
  ...(process.env.stage !== 'prod'
    ? {
        introspection: true,
        playground: {
          endpoint: '/',
          settings: {
            'request.credentials': 'same-origin',
          },
        },
      }
    : { introspection: false, playground: false }),
  engine: false,
})

export const handler = server.createHandler({
  cors: {
    origin: 'echo.bullinger.dev',
    credentials: true,
  },
})
