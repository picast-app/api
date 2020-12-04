import { numberToId } from '~/utils/id'
import { flatten, validate } from '~/utils/pagination'
import { ddb } from '~/utils/aws'
import type Podcast from '~/models/podcast'

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
  const pageOpts = flatten(args)
  const { direction, limit, cursor: cursorId } = pageOpts

  const episodes: any[] = []
  let cursor: { pId: string; eId: string } = cursorId
    ? {
        pId: id,
        eId: cursorId,
      }
    : undefined

  const fetchEpisodes = async () => {
    const { Items, LastEvaluatedKey } = await ddb
      .query({
        TableName: 'echo_episodes',
        KeyConditionExpression: 'pId = :pId ',
        ExpressionAttributeValues: { ':pId': id },
        ScanIndexForward: direction === 'forward',
        Limit: limit + 1 - episodes.length,
        ExclusiveStartKey: cursor,
      })
      .promise()
    episodes.push(...Items)
    cursor = LastEvaluatedKey as any
    if (cursor && episodes.length < limit + 1) await fetchEpisodes()
  }

  await fetchEpisodes()

  const pageInfo: PageInfo = {
    total: episodeCount,
    hasPreviousPage:
      direction === 'forward' ? !!cursorId : episodes.splice(limit).length > 0,
    hasNextPage:
      direction === 'backward' ? !!cursorId : episodes.splice(limit).length > 0,
  }

  return {
    pageInfo,
    edges: episodes.map(node => ({ node, cursor: node.eId })),
  }
}
