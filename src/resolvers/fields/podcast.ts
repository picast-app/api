import { numberToId } from '~/utils/id'

type Parent = {
  id: string
  episodeCount: number
} & Record<string, any>

export const id: Resolver<Parent> = ({ id }) =>
  typeof id === 'number' ? numberToId(id) : id

export const feed: Resolver<Parent> = ({ url, feed }) => feed ?? url
