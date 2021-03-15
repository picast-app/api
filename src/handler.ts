import 'source-map-support/register'
import './utils/logger'
import { handler, requests } from './apollo'
import type { APIGatewayEvent, Context } from 'aws-lambda'

export const echo = async (event: APIGatewayEvent, context: Context) => {
  requests[context.awsRequestId] = { responseHeaders: {} }

  const [error, data] = await new Promise(res =>
    handler(event, context, (error, body) => {
      body.multiValueHeaders = requests[context.awsRequestId].responseHeaders
      res([error, body])
    })
  )

  if (error) throw error
  return data
}
