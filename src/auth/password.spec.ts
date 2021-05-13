import * as password from './password'

test('foo', async () => {
  expect(1 + 1).toBe(2)

  const t0 = Date.now()
  const hashed = await password.hash('gaeksjgbsfeas;nbgagrsa;kesbf')
  console.log(hashed)
  console.log(`hashed in ${Date.now() - t0}ms`)
})
