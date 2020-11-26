import { query } from '~/utils/podcastIndex'
import { numberToId, idToNumber } from '~/utils/id'
import { ddb } from '~/utils/aws'

type Parent = {
  id: string
  episodeCount: number
} & Record<string, any>

// export const episodes: Resolver<Parent> = async ({ id, episodeCount }) => {
//   const { Items } = await ddb
//     .query({
//       TableName: 'echo_main',
//       KeyConditionExpression: 'pk = :pk',
//       ExpressionAttributeValues: { ':pk': id },
//       ScanIndexForward: false,
//     })
//     .promise()

//   return {
//     pageInfo: {
//       total: episodeCount,
//     },
//   }
// }

export const id: Resolver<Parent> = ({ id }) =>
  typeof id === 'number' ? numberToId(id) : id

export const feed: Resolver<Parent> = ({ url, feed }) => feed ?? url
