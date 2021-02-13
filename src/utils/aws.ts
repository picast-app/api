import AWS from 'aws-sdk'
import * as db from './db'

AWS.config.update({ region: 'eu-west-1' })

export const sns = new AWS.SNS()

export const ddb = db.podcasts.client
