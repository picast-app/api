// eslint-disable-next-line
declare var logger: import('winston').Logger

type ResolverCtx = {
  user?: string
  setHeader(name: string, value: string): void
  signOut(): void
}
