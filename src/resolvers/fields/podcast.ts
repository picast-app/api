import { query } from '~/utils/podcastIndex'
import { numberToId, idToNumber } from '~/utils/id'

export const episodes = async ({ id }) => {
  const { items } = await query('episodes/byfeedid', {
    id: typeof id === 'number' ? id : idToNumber(id),
    max: 200,
  })
  return items
}

export const id = ({ id }) => (typeof id === 'number' ? numberToId(id) : id)

export const feed = ({ url, feed }) => feed ?? url
