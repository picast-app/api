import { AuthenticationError } from 'apollo-server-lambda'
import axios from 'axios'
import { signInToken } from '~/auth'
import Podcast from '~/models/podcast'
import User from '~/models/user'
import { S3 } from 'aws-sdk'
import { parse as triggerParse } from '~/utils/parser'
import * as db from '~/utils/db'

export const signInGoogle: Mutation<{
  accessToken: string
  wpSub?: string
}> = async (_, { accessToken, wpSub }, { setCookie }) => {
  try {
    const { data } = await axios(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        params: { access_token: accessToken },
      }
    )

    if (!data.sub)
      throw new AuthenticationError("couldn't get user id from google")

    const user = await User.signIn(data.sub)
    const jwt = signInToken(user.id, 'google')
    setCookie('auth', jwt)
    if (wpSub) setCookie('wp_id', await storeWPSub(user.id, wpSub))

    return { user, ...user, authProvider: 'google' }
  } catch (e) {
    console.error(e)
    if (e.response.data.error === 'invalid_request')
      throw new AuthenticationError('token expired')
    throw e
  }
}

export const signOut: Mutation = async (
  _,
  __,
  { user, deleteCookie, cookies }
) => {
  deleteCookie('auth')
  if (!user || !cookies.wp_id) return
  deleteCookie('wp_id')
  await db.notifications.delete(`user#wp#${user}`, cookies.wp_id)
}

export const subscribe: Mutation<{ podcasts: string[] }> = async (
  _,
  { podcasts },
  { user }
) => {
  if (!user) throw new AuthenticationError('must be signed in')
  await Promise.all([
    new User(user).subscribe(...podcasts),
    ...podcasts.map(id => Podcast.addSubscriber(id, user)),
  ])
}

export const unsubscribe: Mutation<{ podcasts: string[] }> = async (
  _,
  { podcasts },
  { user }
) => {
  if (!user) throw new AuthenticationError('must be signed in')
  await Promise.all([
    new User(user).unsubscribe(...podcasts),
    ...podcasts.map(id => Podcast.removeSubscriber(id, user)),
  ])
}

export const parse: Mutation<{ id: string }> = async (_, { id }) => {
  const { feed } = await db.podcasts.get(id)
  await triggerParse({ id, feed })
}

export const deletePodcast: Mutation<{ id: string }> = async (_, { id }) => {
  logger.info(`delete podcast ${id}`)
  const [episodes] = await Podcast.fetchEpisodes(id, { last: Infinity })
  logger.info(`${episodes.length} episodes`)

  await db.podcasts.delete(id)
  await db.parser.delete(`${id}#parser`)
  await db.episodes.batchDelete(
    ...episodes.map(({ pId, eId }) => [pId, eId] as [string, string])
  )

  const s3 = new S3()
  const { Contents } = await s3
    .listObjects({ Bucket: 'picast-imgs', Prefix: id })
    .promise()

  if (!Contents?.length || process.env.IS_OFFLINE) return
  logger.info(`${Contents.length} images`)

  await Promise.all(
    Contents.map(({ Key }) =>
      s3.deleteObject({ Bucket: 'picast-imgs', Key }).promise()
    )
  )
}

export const addWPSub: Mutation<{ sub: string }> = async (
  _,
  { sub },
  { user, setCookie }
) => setCookie('wp_id', await storeWPSub(user, sub))

async function storeWPSub(user: string, sub: string): Promise<string> {
  if (!user) throw new AuthenticationError('must be signed in')
  const { auth } = JSON.parse(sub)?.keys
  if (typeof auth !== 'string' || !auth) throw Error('invalid token')
  await db.notifications.put({ pk: `user#wp#${user}`, sk: auth, sub })
  return auth
}

export const removeWPSub: Mutation<{ sub: string }> = async (
  _,
  { sub },
  { user, deleteCookie }
) => {
  if (!user) throw new AuthenticationError('must be signed in')
  const { auth } = JSON.parse(sub)?.keys
  if (typeof auth !== 'string' || !auth) throw Error('invalid token')
  await db.notifications.delete(`user#wp#${user}`, auth)
  deleteCookie('wp_id')
}
