declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const value: DocumentNode
  export default value
}

type Resolver<T1 = undefined, T2 = undefined> = (
  parent: T1,
  args: T2,
  ctx: ResolverCtx,
  info: any
) => any

type Query<T1 = undefined> = Resolver<undefined, T1>
type Mutation<T1 = undefined> = Query<T1>

type Fields = Record<'string', true | Fields>

type PageInfo = {
  hasPreviousPage?: boolean
  hasNextPage?: boolean
  total?: number
}
