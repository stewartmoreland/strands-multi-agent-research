/**
 * Lambda entry: wrap Express app with serverless-express for API Gateway HTTP API.
 * injectLambdaContext adds xray_trace_id, function_name, cold_start to all logs.
 */

import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import serverlessExpress from '@codegenie/serverless-express'
import middy from '@middy/core'
import app from './app'
import { logger } from './logger'

const serverlessHandler = serverlessExpress({ app })

export const handler = middy(serverlessHandler).use(injectLambdaContext(logger, { logEvent: false }))
