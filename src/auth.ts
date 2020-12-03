import jwt from 'jsonwebtoken'
import fs from 'fs'

const [PUBLIC_KEY, PRIVATE_KEY] = (() => {
  if (process.env.PUBLIC_KEY && process.env.PUBLIC_KEY !== 'undefined')
    return [process.env.PUBLIC_KEY, process.env.PRIVATE_KEY]
  if (!fs.existsSync('jwt.key') || !fs.existsSync('jwt.key.pub'))
    throw Error("couldn't find rsa key in env or file")
  logger.info('read jwt key from file')
  return [
    fs.readFileSync('jwt.key.pub', 'utf-8'),
    fs.readFileSync('jwt.key', 'utf-8'),
  ].map(v => v.replace(/\\n/gm, '\n'))
})()

export const signInToken = (id: string, authProvider: string): string =>
  jwt.sign({ id, auth: authProvider }, PRIVATE_KEY, {
    issuer: 'https://api.picast.app',
    subject: id,
    algorithm: 'RS256',
    expiresIn: '180d',
  })

export const decode = (token: string) => {
  if (!token) return
  try {
    return jwt.verify(token, PUBLIC_KEY) as any
  } catch (e) {
    logger.error(e)
    if (e instanceof jwt.JsonWebTokenError) return
    throw e
  }
}

export const cookie = (name: string, value: string, age = 60 ** 2 * 24 * 180) =>
  `${name}=${value}; HttpOnly;${
    !process.env.IS_OFFLINE ? 'Domain=picast.app; Secure;' : ''
  } SameSite=Lax; Max-Age=${age}`
