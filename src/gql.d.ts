declare module '*.gql' {
  import { DocumentNode } from 'graphql'
  const value: DocumentNode
  export default value
}

type Resolver<T1 = undefined, T2 = undefined> = (
  parent: T1,
  args: T2,
  ctx: any,
  info: any
) => any

type Query<T1 = undefined> = Resolver<undefined, T1>

type Fields = { [k: string]: Fields | true }
