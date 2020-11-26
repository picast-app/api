import { query } from '~/utils/podcastIndex'
import { numberToId, idToNumber } from '~/utils/id'
import { ddb } from '~/utils/aws'

export const episodes = async ({ id }) => {
  const { Items } = await ddb
    .query({
      TableName: 'echo_main',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': id },
      ScanIndexForward: false,
    })
    .promise()

  if (Items?.length) return Items

  const { items } = await query('episodes/byfeedid', {
    id: typeof id === 'number' ? id : idToNumber(id),
    max: 200,
  })
  return items
}

export const id = ({ id }) => (typeof id === 'number' ? numberToId(id) : id)

export const feed = ({ url, feed }) => feed ?? url
