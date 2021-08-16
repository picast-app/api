import { numberToId } from '~/utils/id'
import { validate } from '~/utils/pagination'
import Podcast from '~/models/podcast'

type Parent = Podcast & Record<string, any>

export const id: Resolver<Parent> = ({ id }) =>
  typeof id === 'number' ? numberToId(id) : id

export const feed: Resolver<Parent> = ({ url, feed }) => feed ?? url

export const episodes: Resolver<Parent> = async (
  { id, episodeCount, cursor = {} },
  args
) => {
  if (typeof id !== 'string') return
  Object.assign(cursor, args)
  validate(cursor)

  const [episodes, info] = await Podcast.fetchEpisodes(id, cursor)
  return {
    pageInfo: { ...info, total: episodeCount },
    edges: episodes.map(node => ({ node, cursor: node.eId })),
  }
}
