import { numberToId } from '~/utils/id'
import { validate } from '~/utils/pagination'
import Podcast from '~/models/podcast'

type Parent = Podcast & Record<string, any>

export const id: Resolver<Parent> = ({ id }) =>
  typeof id === 'number' ? numberToId(id) : id

export const feed: Resolver<Parent> = ({ url, feed }) => feed ?? url

export const episodes: Resolver<Parent> = async (
  { id, episodeCount },
  args
) => {
  if (typeof id !== 'string') return
  validate(args)

  const [episodes, info] = await Podcast.fetchEpisodes(id, args)
  return {
    pageInfo: { ...info, total: episodeCount },
    edges: episodes.map(node => ({ node, cursor: node.eId })),
  }
}
