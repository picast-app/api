import * as pi from '~/utils/podcastIndex'
import axios from 'axios'
import { idToNumber } from '~/utils/id'
import { sns } from '~/utils/aws'
import User from '~/models/user'
import Podcast from '~/models/podcast'
import * as db from '~/utils/db'

export const search = async (_, { query, limit }) => {
  const { feeds } = await pi.query('search/byterm', {
    q: query,
    max: limit,
  })
  return feeds
}

export const podcast: Query<{ id: string }> = async (_, { id }) => {
  const podcast = await Podcast.fetch(id)
  if (podcast) return podcast

  const { feed } = await pi.query('podcasts/byfeedid', { id: idToNumber(id) })
  if (feed?.url)
    if (process.env.IS_OFFLINE)
      await axios.post('http://localhost:9000/parse', { feed: feed.url })
    else
      await sns
        .publish({
          Message: JSON.stringify({
            feed: feed.url,
          }),
          TopicArn: process.env.PARSER_SNS,
        })
        .promise()

  return feed
}

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

  return {
    user,
    authProvider: auth,
    ...user,
  }
}

export const metaCheck: Query<{
  podcasts: { id: string; check: string }[]
}> = async (_, { podcasts }) => await Podcast.fetchDiff(podcasts)
