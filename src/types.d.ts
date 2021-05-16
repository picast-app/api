// eslint-disable-next-line
declare var logger: import('winston').Logger

type ResolverCtx = {
  user?: string
  setHeader(name: string, value: string): void
  setCookie(key: string, value: string, age: number | string): void
  deleteCookie(key: string): void
  cookies: Record<string, string>
}

type PromiseType<T> = T extends PromiseLike<infer K> ? K : T
