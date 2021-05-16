import AWS from 'aws-sdk'
import lazy from '~/utils/lazy'
import makeSNS from './sns'
import makeLambda from './lambda'

AWS.config.update({ region: 'eu-west-1' })

export const sns = lazy(makeSNS)
export const lambda = lazy(makeLambda)
