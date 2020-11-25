import * as pi from '~/utils/podcastIndex'
import axios from 'axios'
import { idToNumber } from '~/utils/id'
import { ddb } from '~/utils/aws'

export const search = async (_, { query, limit }) => {
  const { feeds } = await pi.query('search/byterm', {
    q: query,
    max: limit,
  })
  return feeds
}

export const podcast = async (_, { id }) => {
  const { Item } = await ddb
    .get({ TableName: 'echo_main', Key: { pk: id, sk: 'meta' } })
    .promise()
  if (Item) return Item
  const { feed } = await pi.query('podcasts/byfeedid', { id: idToNumber(id) })
  return feed
}

export const feed = async (_, { url }) => {
  const { data } = await axios(url)
  return { raw: data }
}
