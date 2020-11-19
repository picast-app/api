import { query } from '~/utils/podcastIndex'
import { numberToId } from '~/utils/id'

export const episodes = async ({ id }) => {
  const { items } = await query('episodes/byfeedid', { id, max: 200 })
  return items
}

export const id = ({ id }) => numberToId(id)

export const feed = ({ url }) => url
