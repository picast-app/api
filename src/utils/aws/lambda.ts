import { Lambda } from 'aws-sdk'

class Client {
  constructor(
    private readonly lambda: Lambda,
    private readonly name: string,
    private readonly constants: Record<string, any> = {}
  ) {}

  public async invoke(payload: Record<string, any>) {
    const response = await this.lambda
      .invoke({
        InvocationType: 'RequestResponse',
        FunctionName: this.name,
        Payload: JSON.stringify({ ...this.constants, ...payload }),
      })
      .promise()
    return response?.Payload
  }
}

class PasswordClient extends Client {
  constructor(lambda: Lambda) {
    super(lambda, 'passwords', { auth: process.env.HASH_SECRET })
  }

  public invoke: Client['invoke'] = async (...args) => {
    const res = await super.invoke(...args)
    if (typeof res !== 'string') return res
    let json: Record<string, unknown>
    try {
      json = JSON.parse(res)
    } catch (e) {
      return res
    }
    if ('errorType' in json) throw json
    return json
  }
}

export default () => {
  const lambda = new Lambda()
  return {
    password: new PasswordClient(lambda),
  }
}
