import * as pi from '~/utils/podcastIndex'
import { idToNumber, numberToId } from '~/utils/id'
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

async function fetchPodcast(id: string, piData?: any) {
  const podcast = await Podcast.fetch(id)
  if (podcast) return podcast

  piData ??= (await pi.query('podcasts/byfeedid', { id: idToNumber(id) })).feed
  if (piData?.url) await parse({ id, feed: piData.url })
  else throw new UserInputError(`unknown id ${id}`)

  return piData
}

export const podcast: Query<{ id: string }> = async (_, { id }) => {
  if (/[^\w]/.test(id)) throw new UserInputError(`invalid id ${id}`)
  return await fetchPodcast(id)
}

export const searchByFeed: Query<{ feeds: string[] }> = async (_, { feeds }) =>
  await Promise.all(
    (
      await Promise.allSettled(
        feeds.map(url => pi.query('podcasts/byfeedurl', { url }))
      )
    )
      .flatMap(v => (v.status === 'fulfilled' ? [v.value.feed] : []))
      .map(v => fetchPodcast(numberToId(v.id), v))
  )

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
