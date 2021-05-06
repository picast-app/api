global.logger = console as any

import jwt from 'jsonwebtoken'
import { readKeys, sign, decode } from './jwt'
import crypto from 'crypto'

test('rejects wrong key', () => {
  const key = crypto
    .generateKeyPairSync('rsa', { modulusLength: 2048 })
    .privateKey.export({ format: 'pem', type: 'pkcs8' })

  const token = jwt.sign({ sub: 'foo' }, key, { algorithm: 'RS256' })
  expect(() => decode(token)).toThrow()

  expect(
    decode(jwt.sign({ sub: 'foo' }, readKeys()[1], { algorithm: 'RS256' }))
  ).toMatchObject({ sub: 'foo' })
  expect(decode(sign({ sub: 'foo' }, '1d'))).toMatchObject({ sub: 'foo' })
})
