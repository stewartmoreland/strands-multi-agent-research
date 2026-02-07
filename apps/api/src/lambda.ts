/**
 * Lambda entry: wrap Express app with serverless-express for API Gateway HTTP API.
 */

import serverlessExpress from "@codegenie/serverless-express";
import app from "./app";

export const handler = serverlessExpress({ app });
