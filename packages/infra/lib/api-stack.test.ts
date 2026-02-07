import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ResearchAgentStack } from "./stack";
import { ApiStack } from "./api-stack";

describe("ApiStack", () => {
  it("synthesizes and contains Lambda and HTTP API", () => {
    const app = new cdk.App();
    const agentStack = new ResearchAgentStack(app, "AgentStack", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    const apiStack = new ApiStack(app, "ApiStack", {
      env: { account: "123456789012", region: "us-east-1" },
      agentRuntimeId: agentStack.agentRuntimeId,
      agentMemoryId: agentStack.agentMemoryId,
    });
    const template = Template.fromStack(apiStack);
    template.resourceCountIs("AWS::Lambda::Function", 1);
    template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
  });

  it("exposes apiUrl", () => {
    const app = new cdk.App();
    const agentStack = new ResearchAgentStack(app, "AgentStack", {
      env: { account: "123456789012", region: "us-east-1" },
    });
    const apiStack = new ApiStack(app, "ApiStack", {
      env: { account: "123456789012", region: "us-east-1" },
      agentRuntimeId: agentStack.agentRuntimeId,
      agentMemoryId: agentStack.agentMemoryId,
    });
    expect(apiStack.apiUrl).toBeDefined();
    expect(typeof apiStack.apiUrl).toBe("string");
  });
});
