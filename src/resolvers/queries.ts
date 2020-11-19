import * as pi from '~/utils/podcastIndex'
import axios from 'axios'

export const search = async (_, { query, limit }) => {
  const { feeds } = await pi.query('search/byterm', {
    q: query,
    max: limit,
  })
  return feeds
}

export const podcast = async (_, { id }) => {
  const { feed } = await pi.query('podcasts/byfeedid', { id })
  console.log(feed)
  return feed
}

export const feed = async (_, { url }) => {
  const { data } = await axios(url)
  return { raw: data }
}
