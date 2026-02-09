#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api-stack'
import { CertificateStack } from '../lib/certificate-stack'
import { ResearchAgentStack } from '../lib/stack'
import { WebAppStack } from '../lib/web-app-stack'

const app = new cdk.App()

// Get environment from context or use defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
}

// Context parameters
const domainName = app.node.tryGetContext('domainName') as string | undefined
const hostedZoneId = app.node.tryGetContext('hostedZoneId') as string | undefined
const hostedZoneName = app.node.tryGetContext('hostedZoneName') as string | undefined

const hasCustomDomain = domainName && hostedZoneId && hostedZoneName

const researchAgentStack = new ResearchAgentStack(app, 'ResearchAgentStack', {
  env,
  description: 'Multi-Agent Research System with Bedrock AgentCore',
  domainName,
  tags: {
    Project: 'multi-agent-research',
    ManagedBy: 'CDK',
  },
})

const apiStack = new ApiStack(app, 'ResearchAgentApiStack', {
  env,
  description: 'Research Agent API (models, sessions, invocations proxy)',
  agentRuntimeId: researchAgentStack.agentRuntimeId,
  agentMemoryId: researchAgentStack.agentMemoryId,
  tags: {
    Project: 'multi-agent-research',
    ManagedBy: 'CDK',
  },
})
apiStack.addDependency(researchAgentStack)

// When using custom domain outside us-east-1, create certificate in us-east-1 first
let certificateArn: string | undefined
let certStack: CertificateStack | undefined
if (hasCustomDomain && env.region !== 'us-east-1') {
  certStack = new CertificateStack(app, 'ResearchAgentWebAppCertStack', {
    env: { account: env.account, region: 'us-east-1' },
    domainName,
    hostedZoneId,
    hostedZoneName,
    description: 'ACM certificate for web app (us-east-1)',
    tags: {
      Project: 'multi-agent-research',
      ManagedBy: 'CDK',
    },
  })
  certificateArn = certStack.certificate.certificateArn
}

const webAppStack = new WebAppStack(app, 'ResearchAgentWebAppStack', {
  env,
  description: 'Web app (S3 + CloudFront) for multi-agent research',
  domainName,
  hostedZoneId,
  hostedZoneName,
  certificateArn,
  crossRegionReferences: !!certStack,
  userPoolId: researchAgentStack.userPool.userPoolId,
  userPoolClientId: researchAgentStack.userPoolClient.userPoolClientId,
  cognitoRegion: researchAgentStack.region,
  agentApiUrl: apiStack.apiUrl,
  agentRuntimeArn: researchAgentStack.agentRuntimeArn,
  tags: {
    Project: 'multi-agent-research',
    ManagedBy: 'CDK',
  },
})

webAppStack.addDependency(researchAgentStack)
webAppStack.addDependency(apiStack)
if (certStack) {
  webAppStack.addDependency(certStack)
}

app.synth()
