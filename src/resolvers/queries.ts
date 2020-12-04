import * as pi from '~/utils/podcastIndex'
import axios from 'axios'
import { idToNumber } from '~/utils/id'
import { ddb, sns } from '~/utils/aws'
import User from '~/models/user'

export const search = async (_, { query, limit }) => {
  const { feeds } = await pi.query('search/byterm', {
    q: query,
    max: limit,
  })
  return feeds
}

async function meta(id: string) {
  const { Item } = await ddb
    .get({ TableName: 'echo_podcasts', Key: { id } })
    .promise()
  return Item
}

export const podcast: Query<{ id: string }> = async (_, { id }) => {
  const podcast = await meta(id)
  if (podcast) return podcast

  const { feed } = await pi.query('podcasts/byfeedid', { id: idToNumber(id) })
  if (feed?.url && !process.env.IS_OFFLINE)
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

export const feed = async (_, { url }) => {
  const { data } = await axios(url)
  return { raw: data }
}
