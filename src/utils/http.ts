import ms from 'ms'

export class Headers {
  private readonly headers: Record<string, string>

  constructor(raw: Record<string, string> = {}) {
    this.headers = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v])
    )
  }

  public get(name: string) {
    return this.headers[name.toLowerCase()]
  }
}

export const parseCookies = (cookieString = '') =>
  Object.fromEntries(
    cookieString.split(';').map(seg => seg.split('=').map(v => v.trim()))
  )

export const cookie = (name: string, value: string, age: number | string) =>
  [
    `${name}=${value}`,
    'HttpOnly',
    ...(process.env.IS_OFFLINE
      ? ['SameSite=Lax']
      : ['Domain=picast.app', 'Secure', 'SameSite=Strict']),
    `Max-Age=${typeof age === 'number' ? age : Math.round(ms(age) / 1000)}`,
  ].join('; ')
