import * as db from '~/utils/db'
import type { DBRecord } from 'ddbjs'
import { lambda } from '~/utils/aws'
import crypto from 'crypto'
import * as jwt from '~/auth/jwt'
import { sns } from '~/utils/aws'

// @ts-ignore
type DBUser = DBRecord<typeof db['users']>

export default class User {
  constructor(
    public readonly id: string,
    public readonly subscriptions: string[] | null = null,
    public readonly wpSubs: string[] = [],
    public readonly current?: DBUser['current']
  ) {}

  public static async signInPassword(
    ident: string,
    password: string
  ): Promise<User | string> {
    try {
      const result = (await lambda().password.invoke({
        method: 'check',
        key: ident,
        password,
      })) as any
      if ('errorType' in result) throw result
      if (result.correct === true && result.id)
        return await User.fetch(result.id)
      return 'incorrect_auth'
    } catch (err) {
      if (err.errorType === 'KeyError') return 'unknown_ident'
      logger.error('error during signin', { err })
      throw Error(err?.errorType)
    }
  }

  public static async signUpPassword(
    ident: string,
    password: string
  ): Promise<User | string> {
    if (password?.length < 8) return 'password too short'
    const id = User.genID()
    try {
      const result = (await lambda().password.invoke({
        method: 'set',
        key: ident,
        password,
        id,
      })) as any
      if (typeof result === 'object' && 'errorType' in result) throw result
    } catch (err) {
      if (err.errorType === 'ConditionError') return 'duplicate_ident'
      logger.error('error during signup', { err })
      throw Error(err?.errorType)
    }
    return await User.create(id)
  }

  public static async signInGoogle(googleID: string): Promise<User> {
    const userID = await User.getGoogleSignIn(googleID)
    if (userID) return this.fetch(userID)
    const user = await User.create()
    await User.putGoogleSignIn(googleID, user.id)
    return user
  }

  public static async create(id = User.genID()): Promise<User> {
    await db.users.put({ id: `user#${id}` })
    return new User(id)
  }

  public static async setPassword(user: string, password: string) {
    await lambda().password.invoke({
      method: 'set',
      user,
      password,
    })
  }

  private static async getGoogleSignIn(
    googleID: string
  ): Promise<string | null> {
    const res = await db.podcasts.client
      .get({ TableName: 'echo_passwords', Key: { key: `google#${googleID}` } })
      .promise()
    return res?.Item?.id ?? null
  }

  private static async putGoogleSignIn(googleID: string, userID: string) {
    if (!googleID || !userID) throw Error('must provide google & user id')
    const key = `google#${googleID}`
    await db.podcasts.client
      .put({
        TableName: 'echo_passwords',
        Item: { key, id: userID },
        ConditionExpression: '#key <> :key',
        ExpressionAttributeNames: { '#key': 'key' },
        ExpressionAttributeValues: { ':key': key },
      })
      .promise()
  }

  public static async fetch(id: string): Promise<User | null> {
    const user = await db.users.get(`user#${id}`)
    if (!user) return null
    return new User(id, user.subscriptions ?? null, user.wpSubs, user.current)
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

  private _wsAuth?: string
  public get wsAuth() {
    return (this._wsAuth ??= jwt.sign({ wsUser: this.id }, '48h'))
  }

  public async afterSignIn(
    setCookie: ResolverCtx['setCookie'],
    wpSub?: string
  ) {
    setCookie('auth', jwt.sign({ sub: this.id }, '180d'), '180d')
    if (wpSub) await this.storeWPSub(setCookie, wpSub)
    if (this.subscriptions?.length)
      await sns().notify.send({
        type: 'PUSH_EPISODES',
        userToken: this.wsAuth,
        podcasts: this.subscriptions,
      })
  }

  public async storeWPSub(setCookie: ResolverCtx['setCookie'], sub: string) {
    const { auth } = JSON.parse(sub)?.keys
    if (typeof auth !== 'string' || !auth) throw Error('invalid token')
    await db.notifications.put({ pk: `user#wp#${this.id}`, sk: auth, sub })
    setCookie('wp_id', auth, '180d')
  }

  public static genID = () =>
    crypto
      .randomBytes(8)
      .toString('base64')
      .replace(/=*$/, '')
      .replace(/\+/g, '_')
      .replace(/\//g, '-')
}
