import AWS from 'aws-sdk'
import lazy from '~/utils/lazy'
import makeSNS from './sns'

AWS.config.update({ region: 'eu-west-1' })

export const sns = lazy(makeSNS)

export const lambda = lazy(() => new AWS.Lambda())
