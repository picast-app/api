import AWS from 'aws-sdk'

AWS.config.update({ region: 'eu-west-1' })

export const sns = new AWS.SNS()
