import axios from 'axios'
import { sns } from '~/utils/aws'

export const parse = async (feed: string) => {
  if (process.env.IS_OFFLINE)
    try {
      await axios.post(
        'http://localhost:9000/parse',
        { feed },
        { headers: { auth: process.env.PARSER_AUTH } }
      )
    } catch (e) {
      logger.warn(e)
    }
  else
    await sns
      .publish({
        Message: JSON.stringify({ feed }),
        TopicArn: process.env.PARSER_SNS,
      })
      .promise()
}
