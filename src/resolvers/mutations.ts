import { AuthenticationError } from 'apollo-server-lambda'
import axios from 'axios'
import { signInToken, cookie } from '~/auth'
import Podcast from '~/models/podcast'
import User from '~/models/user'
import { S3 } from 'aws-sdk'
import { parse as triggerParse } from '~/utils/parser'
import * as db from '~/utils/db'

export const signInGoogle: Mutation<{ accessToken: string }> = async (
  _,
  { accessToken },
  { setHeader }
) => {
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

    setHeader('Set-Cookie', cookie('auth', jwt))

    return { user, ...user, authProvider: 'google' }
  } catch (e) {
    console.error(e)
    if (e.response.data.error === 'invalid_request')
      throw new AuthenticationError('token expired')
    throw e
  }
}

export const subscribe: Mutation<{ podcasts: string[] }> = async (
  _,
  { podcasts },
  { user }
) => {
  if (!user) throw new AuthenticationError('must be logged in')
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
  if (!user) throw new AuthenticationError('must be logged in')
  await Promise.all([
    new User(user).unsubscribe(...podcasts),
    ...podcasts.map(id => Podcast.removeSubscriber(id, user)),
  ])
}

export const parse: Mutation<{ id: string }> = async (_, { id }) =>
  await triggerParse({ id })

export const deletePodcast: Mutation<{ id: string }> = async (_, { id }) => {
  logger.info(`delete podcast ${id}`)
  const [episodes] = await Podcast.fetchEpisodes(id, { last: Infinity })
  logger.info(`${episodes.length} episodes`)

  await db.podcasts.delete(id)
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
