import jwt from 'jsonwebtoken'
import fs from 'fs'

export const sign = (
  payload: Record<string, string | number>,
  expiresIn: string
) =>
  jwt.sign(
    {
      ...payload,
      iss: 'api.picast.app',
    },
    PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn,
    }
  )

export const decode = (token: string): Record<string, string | number> =>
  jwt.verify(token, PUBLIC_KEY) as any

const [PUBLIC_KEY, PRIVATE_KEY] = readKeys()

export function readKeys() {
  if (process.env.PUBLIC_KEY && process.env.PUBLIC_KEY !== 'undefined')
    return [process.env.PUBLIC_KEY, process.env.PRIVATE_KEY]
  if (!fs.existsSync('jwt.key') || !fs.existsSync('jwt.key.pub'))
    throw Error("couldn't find rsa key in env or file")
  return [
    fs.readFileSync('jwt.key.pub', 'utf-8'),
    fs.readFileSync('jwt.key', 'utf-8'),
  ].map(v => v.replace(/\\n/gm, '\n'))
}
