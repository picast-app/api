import { query } from '~/utils/podcastIndex'

export const episodes = async ({ id }) => {
  const { items } = await query('episodes/byfeedid', { id, max: 200 })
  console.log(items.slice(0, 10))
  return items
}

export const feed = ({ url }) => url
