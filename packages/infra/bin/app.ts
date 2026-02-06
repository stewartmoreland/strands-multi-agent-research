#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ResearchAgentStack } from "../lib/stack";

const app = new cdk.App();

// Get environment from context or use defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region:
    process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
};

new ResearchAgentStack(app, "ResearchAgentStack", {
  env,
  description: "Multi-Agent Research System with Bedrock AgentCore",
  tags: {
    Project: "multi-agent-research",
    ManagedBy: "CDK",
  },
});

app.synth();
