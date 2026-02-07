import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ResearchAgentStack } from "./stack";

describe("ResearchAgentStack", () => {
  it("synthesizes and contains ECR repository", () => {
    const app = new cdk.App();
    const stack = new ResearchAgentStack(app, "TestStack", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ECR::Repository", 1);
    template.hasResourceProperties("AWS::ECR::Repository", {
      RepositoryName: "research-agent",
    });
  });

  it("contains Cognito User Pool and Client", () => {
    const app = new cdk.App();
    const stack = new ResearchAgentStack(app, "TestStack", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::Cognito::UserPool", 1);
    template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
  });

  it("exposes agentRuntimeId and agentMemoryId", () => {
    const app = new cdk.App();
    const stack = new ResearchAgentStack(app, "TestStack", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    expect(stack.agentRuntimeId).toBeDefined();
    expect(typeof stack.agentRuntimeId).toBe("string");
    expect(stack.agentMemoryId).toBeDefined();
    expect(typeof stack.agentMemoryId).toBe("string");
  });
});
