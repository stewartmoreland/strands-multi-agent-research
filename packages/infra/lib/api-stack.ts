/**
 * API Stack - Serves GET /models, GET /sessions, GET /sessions/:id/events.
 * Invocations are called directly against AgentCore by the frontend (SSE).
 */

import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ApiStackProps extends cdk.StackProps {
  /** Agent runtime ID from ResearchAgentStack */
  readonly agentRuntimeId: string;
  /** Agent memory ID from ResearchAgentStack */
  readonly agentMemoryId: string;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { agentMemoryId } = props;

    // Lambda function for API
    const apiLambda = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "lambda.handler",
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "..", "..", "apps", "api", "dist"), {
        exclude: ["*.ts", "*.tsconfig.json"],
      }),
      environment: {
        AGENTCORE_MEMORY_ID: agentMemoryId,
      },
      logGroup: new logs.LogGroup(this, "ApiLogGroup", {
        logGroupName: "/aws/lambda/research-agent-api",
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // IAM permissions for Bedrock and AgentCore
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock:ListFoundationModels"],
        resources: ["*"],
      }),
    );
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:ListSessions",
          "bedrock-agentcore:ListEvents",
        ],
        resources: ["*"],
      }),
    );

    // HTTP API with Lambda proxy (catch-all)
    const httpApi = new apigatewayv2.HttpApi(this, "ResearchApi", {
      apiName: "research-agent-api",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Accept", "Authorization"],
      },
    });

    const lambdaIntegration =
      new apigatewayv2integrations.HttpLambdaIntegration(
        "ApiIntegration",
        apiLambda,
      );

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [
        apigatewayv2.HttpMethod.GET,
        apigatewayv2.HttpMethod.POST,
        apigatewayv2.HttpMethod.OPTIONS,
      ],
      integration: lambdaIntegration,
    });

    this.apiUrl = httpApi.apiEndpoint;

    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.apiUrl,
      description: "Research Agent API base URL",
      exportName: "ResearchAgentApiUrl",
    });

  }
}
