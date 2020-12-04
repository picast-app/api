import { ddb } from '~/utils/aws'
import { v4 as uuidv4 } from 'uuid'

const TableName = 'echo_users'

export default class User {
  constructor(
    public readonly id: string,
    public readonly subscriptions: string[] = null
  ) {}

  public static async signIn(id: string): Promise<User | null> {
    const { Item: signIn } = await ddb
      .get({ TableName, Key: { id: `sign#${id}` } })
      .promise()

    if (signIn) return await User.fetch(signIn.user)

    const user = await User.create()
    await ddb
      .put({ TableName, Item: { id: `sign#${id}`, user: user.id } })
      .promise()
    return user
  }

  public static async fetch(id: string): Promise<User | null> {
    const { Item: user } = await ddb
      .get({ TableName, Key: { id: `user#${id}` } })
      .promise()
    if (!user) return null
    return new User(id, user.subscriptions?.values ?? null)
  }

  private static async create(): Promise<User> {
    const id = uuidv4()
    await ddb.put({ TableName, Item: { id: `user#${id}` } }).promise()
    return new User(id)
  }

  public async subscribe(...ids: string[]) {
    await ddb
      .update({
        TableName,
        Key: { id: `user#${this.id}` },
        UpdateExpression: 'ADD subscriptions :pId',
        ExpressionAttributeValues: { ':pId': ddb.createSet(ids) },
      })
      .promise()
  }
}
