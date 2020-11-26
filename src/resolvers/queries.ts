import * as pi from '~/utils/podcastIndex'
import axios from 'axios'
import { idToNumber } from '~/utils/id'
import { ddb } from '~/utils/aws'
import * as ast from '~/utils/gqlAst'
import { flatten, validate, PaginationArgs } from '~/utils/pagination'

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

export const podcast: Query<{ id: string }> = async (_, { id }, ctx, info) => {
  const episodeAST = info.fieldNodes[0].selectionSet.selections.find(
    ({ kind, name }) => kind === 'Field' && name.value === 'episodes'
  )
  if (!episodeAST) {
    const data = await meta(id)
    if (data) return data
  } else {
    const args = ast.args(
      episodeAST.arguments,
      info.variableValues
    ) as PaginationArgs

    validate(args)
    const { direction, limit, cursor } = flatten(args)

    const [main, { Items }] = await Promise.all([
      meta(id),
      ddb
        .query({
          TableName: 'echo_episodes',
          KeyConditionExpression: 'pId = :pId ',
          ExpressionAttributeValues: { ':pId': id },
          ScanIndexForward: direction === 'forward',
          Limit: limit,
        })
        .promise(),
    ])

    logger.info(Items)

    if (main)
      return {
        ...main,
        episodes: {
          pageInfo: {
            total: main.episodeCount,
          },
          edges: Items.map(node => ({ node, cursor: node.id })),
        },
      }
  }

  const { feed } = await pi.query('podcasts/byfeedid', { id: idToNumber(id) })
  return feed
}

export const feed = async (_, { url }) => {
  const { data } = await axios(url)
  return { raw: data }
}
