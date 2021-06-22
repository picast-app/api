import * as pi from '~/utils/podcastIndex'
import { idToNumber } from '~/utils/id'
import User from '~/models/user'
import Podcast from '~/models/podcast'
import * as db from '~/utils/db'
import { parse } from '~/utils/parser'
import axios from 'axios'
import { episodes } from '@picast-app/db'
import { UserInputError } from 'apollo-server-errors'

export const search = async (_, { query, limit }) => {
  const { feeds } = await pi.query('search/byterm', {
    q: query,
    max: limit,
  })
  return feeds
}

export const podcast: Query<{ id: string }> = async (_, { id }) => {
  if (/[^\w]/.test(id)) throw new UserInputError(`invalid id ${id}`)

  const podcast = await Podcast.fetch(id)
  if (podcast) return podcast

  const { feed } = await pi.query('podcasts/byfeedid', { id: idToNumber(id) })
  if (feed?.url) await parse({ id, feed: feed.url })
  else throw new UserInputError(`unknown id ${id}`)

  return feed
}

export const podcasts: Query<{ ids: string[] }> = async (
  _,
  { ids },
  ctx,
  info
) => await Promise.all(ids.map(id => podcast(_, { id }, ctx, info)))

export const episode: Query<{ podId: string; epId: string }> = async (
  _,
  { podId, epId }
) => await db.episodes.get(podId, epId)

export const feed = async (_, { url }) => {
  const { data } = await axios(url)
  return { raw: data }
}

export const me = async (_, __, { user: userId, auth }) => {
  if (!userId) return
  const user = await User.fetch(userId)
  if (!user) return

  return {
    user,
    authProvider: auth,
    ...user,
  }
}

export const metaCheck: Query<{
  podcasts: { id: string; meta: string; episodes: string }[]
}> = async (_, { podcasts }) => await Podcast.fetchDiff(podcasts)

export const episodeDiff: Query<{
  podcasts: { id: string; known: string }[]
}> = async (_, { podcasts }) =>
  await Promise.all(
    podcasts.map(({ id, known }) =>
      Podcast.episodeDiff(id, episodes.decodeIds(known))
    )
  )
