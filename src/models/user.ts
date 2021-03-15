import * as db from '~/utils/db'
import type { DBRecord } from 'ddbjs'
import { v4 as uuidv4 } from 'uuid'

export default class User {
  constructor(
    public readonly id: string,
    public readonly subscriptions: string[] | null = null,
    public readonly wpSubs: string[] = [],
    public readonly current?: DBRecord<typeof db['users']>['current']
  ) {}

  public static async signIn(id: string): Promise<User | null> {
    const signIn = await db.users.get(`sign#${id}`)

    if (signIn) return await User.fetch(signIn.user)

    const user = await User.create()
    await db.users.put({ id: `sign#${id}`, user: user.id })
    return user
  }

  public static async fetch(id: string): Promise<User | null> {
    const user = await db.users.get(`user#${id}`)
    if (!user) return null
    return new User(id, user.subscriptions ?? null, user.wpSubs, user.current)
  }

  private static async create(): Promise<User> {
    const id = uuidv4()
    await db.users.put({ id: `user#${id}` })
    return new User(id)
  }

  public async subscribe(...ids: string[]) {
    await db.users.update(`user#${this.id}`).add({ subscriptions: ids })
  }

  public async unsubscribe(...ids: string[]) {
    await db.users.update(`user#${this.id}`).delete({ subscriptions: ids })
  }

  public async addWPSub(id: string) {
    await db.users.update(`user#${this.id}`).add({ wpSubs: [id] })
  }

  public async removeWPSub(id: string) {
    await db.users.update(`user#${this.id}`).delete({ wpSubs: [id] })
  }
}
