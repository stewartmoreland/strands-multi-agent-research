import * as cdk from "aws-cdk-lib";
import * as bedrockagentcore from "aws-cdk-lib/aws-bedrockagentcore";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import type { Construct } from "constructs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Research Agent Infrastructure Stack
 *
 * This stack provisions the infrastructure for the multi-agent research system:
 * - ECR repository for agent container
 * - IAM roles and policies for AgentCore Runtime
 * - Lambda functions for Gateway targets
 * - CloudWatch log groups
 * - AgentCore Runtime (using L1 CfnRuntime construct)
 * - Cognito User Pool for authentication
 *
 * Note: Additional AgentCore resources (Memory, Gateway, Browser, Code Interpreter)
 * can be added using CfnMemory, CfnGateway, etc. when needed.
 * L2 constructs may become available in @aws-cdk/aws-bedrock-agentcore-alpha.
 */
export interface ResearchAgentStackProps extends cdk.StackProps {
  /** Custom domain for the web app. When provided, adds https URLs to Cognito callback/logout URLs. */
  readonly domainName?: string;
}

export class ResearchAgentStack extends cdk.Stack {
  public readonly ecrRepository: ecr.Repository;
  public readonly agentRole: iam.Role;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly agentRuntimeId: string;
  public readonly agentRuntimeArn: string;
  public readonly agentInvocationsUrl: string;
  public readonly agentMemoryId: string;

  constructor(scope: Construct, id: string, props?: ResearchAgentStackProps) {
    super(scope, id, props);

    // ==========================================================================
    // ECR Repository for Agent Container
    // ==========================================================================
    this.ecrRepository = new ecr.Repository(this, "AgentRepository", {
      repositoryName: "research-agent",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: "Keep only 10 most recent images",
        },
      ],
    });

    // ==========================================================================
    // CodeBuild Project for ARM64 Image Builds
    //
    // Automatically builds ARM64 Docker images for AgentCore Runtime.
    // The source code is uploaded to S3 and CodeBuild builds the image.
    // ==========================================================================

    // Upload monorepo source code to S3 for CodeBuild
    // The Dockerfile expects the full monorepo structure (packages/shared, etc.)
    const sourceAsset = new s3assets.Asset(this, "AgentSourceAsset", {
      path: path.join(__dirname, "..", "..", ".."),
      exclude: [
        "node_modules",
        "**/node_modules",
        "dist",
        "**/dist",
        ".git",
        ".cursor",
        ".yarn/cache",
        "*.log",
        ".env*",
        "!.env.example",
        "cdk.out",
      ],
    });

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, "CodeBuildRole", {
      roleName: "research-agent-codebuild-role",
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: "Role for CodeBuild to build agent container images",
    });

    // CodeBuild permissions: CloudWatch Logs
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudWatchLogs",
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
        ],
      }),
    );

    // CodeBuild permissions: ECR
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ECRAccess",
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:GetAuthorizationToken",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ],
        resources: [this.ecrRepository.repositoryArn, "*"],
      }),
    );

    // CodeBuild permissions: S3 Source Access
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "S3SourceAccess",
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [`${sourceAsset.bucket.bucketArn}/*`],
      }),
    );

    // CodeBuild Project for ARM64 builds
    const buildProject = new codebuild.Project(this, "AgentImageBuildProject", {
      projectName: "research-agent-build",
      description: "Build ARM64 Docker image for research agent",
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        computeType: codebuild.ComputeType.LARGE,
        privileged: true, // Required for Docker builds
      },
      source: codebuild.Source.s3({
        bucket: sourceAsset.bucket,
        path: sourceAsset.s3ObjectKey,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
            ],
          },
          build: {
            commands: [
              "echo Build started on `date`",
              "echo Building the Docker image for ARM64...",
              "docker build -f apps/agent/Dockerfile -t $IMAGE_REPO_NAME:$IMAGE_TAG .",
              "docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG",
            ],
          },
          post_build: {
            commands: [
              "echo Build completed on `date`",
              "echo Pushing the Docker image...",
              "docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG",
              "echo ARM64 Docker image pushed successfully",
            ],
          },
        },
      }),
      environmentVariables: {
        AWS_DEFAULT_REGION: { value: this.region },
        AWS_ACCOUNT_ID: { value: this.account },
        IMAGE_REPO_NAME: { value: this.ecrRepository.repositoryName },
        IMAGE_TAG: { value: "latest" },
      },
      timeout: cdk.Duration.minutes(30),
    });

    // Lambda function to trigger CodeBuild (used as Custom Resource)
    const buildTriggerFunction = new lambda.Function(
      this,
      "BuildTriggerFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        timeout: cdk.Duration.minutes(15),
        code: lambda.Code.fromInline(`
const { CodeBuildClient, StartBuildCommand, BatchGetBuildsCommand } = require('@aws-sdk/client-codebuild');
const https = require('https');
const url = require('url');

const codebuild = new CodeBuildClient();

async function sendResponse(event, context, status, data) {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: 'See CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data
  });

  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      resolve();
    });
    request.on('error', reject);
    request.write(responseBody);
    request.end();
  });
}

async function waitForBuild(buildId, maxWaitMs) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const response = await codebuild.send(new BatchGetBuildsCommand({ ids: [buildId] }));
    const build = response.builds[0];
    const status = build.buildStatus;
    
    if (status === 'SUCCEEDED') {
      return { success: true, buildId };
    } else if (['FAILED', 'FAULT', 'STOPPED', 'TIMED_OUT'].includes(status)) {
      return { success: false, buildId, status };
    }
    
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
  }
  return { success: false, buildId, status: 'TIMEOUT' };
}

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    if (event.RequestType === 'Delete') {
      await sendResponse(event, context, 'SUCCESS', {});
      return;
    }
    
    const projectName = event.ResourceProperties.ProjectName;
    
    // Start build
    const startResponse = await codebuild.send(new StartBuildCommand({ projectName }));
    const buildId = startResponse.build.id;
    console.log('Started build:', buildId);
    
    // Wait for build (max 14 minutes to leave buffer before Lambda timeout)
    const maxWaitMs = (context.getRemainingTimeInMillis() - 60000);
    const result = await waitForBuild(buildId, maxWaitMs);
    
    if (result.success) {
      await sendResponse(event, context, 'SUCCESS', { BuildId: buildId });
    } else {
      await sendResponse(event, context, 'FAILED', { Error: 'Build failed: ' + result.status });
    }
  } catch (error) {
    console.error('Error:', error);
    await sendResponse(event, context, 'FAILED', { Error: error.message });
  }
};
      `),
        logGroup: new logs.LogGroup(this, "BuildTriggerLogGroup", {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      },
    );

    // Grant Lambda permission to start CodeBuild
    buildTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
        resources: [buildProject.projectArn],
      }),
    );

    // Custom Resource to trigger build on deployment
    const triggerBuild = new cdk.CustomResource(this, "TriggerImageBuild", {
      serviceToken: buildTriggerFunction.functionArn,
      properties: {
        ProjectName: buildProject.projectName,
        // Change this to trigger a new build on updates
        BuildTrigger: Date.now().toString(),
      },
    });

    // ==========================================================================
    // IAM Role for Agent Runtime
    // ==========================================================================
    this.agentRole = new iam.Role(this, "AgentRole", {
      roleName: "research-agent-role",
      assumedBy: new iam.ServicePrincipal(
        "bedrock-agentcore.amazonaws.com",
      ).withConditions({
        StringEquals: {
          "aws:SourceAccount": this.account,
        },
        ArnLike: {
          "aws:SourceArn": `arn:aws:bedrock-agentcore:${this.region}:${this.account}:*`,
        },
      }),
      description: "Role for the research agent runtime",
    });

    // ECR image access - required for AgentCore to pull container images
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ECRImageAccess",
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
        ],
        resources: [`arn:aws:ecr:${this.region}:${this.account}:repository/*`],
      }),
    );

    // ECR authorization token - required to authenticate with ECR
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ECRTokenAccess",
        effect: iam.Effect.ALLOW,
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      }),
    );

    // CloudWatch Logs - required for agent logging
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:DescribeLogStreams",
          "logs:CreateLogGroup",
          "logs:DescribeLogGroups",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
        ],
      }),
    );

    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*`,
        ],
      }),
    );

    // X-Ray tracing - required for observability
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
        ],
        resources: ["*"],
      }),
    );

    // CloudWatch metrics - required for monitoring
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "cloudwatch:namespace": "bedrock-agentcore",
          },
        },
      }),
    );

    // Workload identity tokens - required for AgentCore Runtime
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "GetAgentAccessToken",
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:GetWorkloadAccessToken",
          "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
          "bedrock-agentcore:GetWorkloadAccessTokenForUserId",
        ],
        resources: [
          `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default`,
          `arn:aws:bedrock-agentcore:${this.region}:${this.account}:workload-identity-directory/default/workload-identity/research_agent-*`,
        ],
      }),
    );

    // Bedrock model access
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "BedrockModelInvocation",
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:${this.region}:${this.account}:*`,
        ],
      }),
    );

    // AgentCore Memory access (when deployed)
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:CreateEvent",
          "bedrock-agentcore:RetrieveMemoryRecords",
          "bedrock-agentcore:ListSessions",
          "bedrock-agentcore:ListEvents",
        ],
        resources: ["*"], // Scope to specific memory ARN in production
      }),
    );

    // AgentCore Gateway access (when deployed)
    this.agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock-agentcore:InvokeGateway"],
        resources: ["*"], // Scope to specific gateway ARN in production
      }),
    );

    // ==========================================================================
    // CloudWatch Log Groups
    // ==========================================================================
    const agentLogGroup = new logs.LogGroup(this, "AgentLogGroup", {
      logGroupName: "/aws/bedrock-agentcore/research-agent",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================================================
    // Cognito User Pool for Authentication
    // ==========================================================================
    this.userPool = new cognito.UserPool(this, "ResearchUserPool", {
      userPoolName: "research-agent-users",
      selfSignUpEnabled: false, // No self-service sign-up
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        preferredUsername: {
          required: false,
          mutable: true,
        },
        profilePicture: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test - use RETAIN in production
    });

    // User Pool Client for the web application (no secret for SPA)
    this.userPoolClient = new cognito.UserPoolClient(
      this,
      "ResearchUserPoolClient",
      {
        userPool: this.userPool,
        userPoolClientName: "research-web-client",
        generateSecret: false, // Required for browser-based apps
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: [
            "http://localhost:5173/",
            "http://localhost:5173/auth/callback",
            ...(props?.domainName
              ? [
                  `https://${props.domainName}/`,
                  `https://${props.domainName}/auth/callback`,
                ]
              : []),
          ],
          logoutUrls: [
            "http://localhost:5173/",
            ...(props?.domainName ? [`https://${props.domainName}/`] : []),
          ],
        },
        preventUserExistenceErrors: true,
        enableTokenRevocation: true,
        accessTokenValidity: cdk.Duration.hours(1),
        idTokenValidity: cdk.Duration.hours(1),
        refreshTokenValidity: cdk.Duration.days(30),
      },
    );

    // ==========================================================================
    // Lambda Function for Gateway Tools
    // ==========================================================================
    const toolsFunction = new lambda.Function(this, "ToolsFunction", {
      functionName: "research-agent-tools",
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));
          
          const toolName = event.toolName || 'unknown';
          const args = event.arguments || {};
          
          // Simple tool implementations
          switch (toolName) {
            case 'health_check':
              return {
                statusCode: 200,
                body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
              };
            
            case 'search':
              return {
                statusCode: 200,
                body: JSON.stringify({
                  results: [
                    { title: 'Result 1', snippet: 'Sample search result for: ' + args.query },
                    { title: 'Result 2', snippet: 'Another relevant result' }
                  ]
                })
              };
            
            default:
              return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Tool executed', tool: toolName, args })
              };
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: new logs.LogGroup(this, "ToolsFunctionLogGroup", {
        logGroupName: "/aws/lambda/research-agent-tools",
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // ==========================================================================
    // AgentCore Memory (L1 Construct)
    //
    // Persistent memory for agent conversations (long-term context, summarization, semantic retrieval).
    // ==========================================================================
    const agentMemory = new bedrockagentcore.CfnMemory(this, "AgentMemory", {
      name: "research_memory",
      description: "Memory for research agent conversations",
      eventExpiryDuration: 90,
    });

    // ==========================================================================
    // AgentCore Gateway (L1 Construct)
    //
    // MCP Gateway for external tool integration (agents call Lambda as MCP tools).
    // ==========================================================================
    const agentGateway = new bedrockagentcore.CfnGateway(this, "AgentGateway", {
      name: "research-gateway",
      protocolConfiguration: {
        mcp: {
          instructions: "Tools for the research agent",
          supportedVersions: ["2025-11-25"],
        },
      },
      authorizerType: "NONE",
      protocolType: "MCP",
      roleArn: this.agentRole.roleArn,
    });

    // ==========================================================================
    // AgentCore Runtime (L1 Construct)
    //
    // The CfnRuntime L1 construct creates the AgentCore Runtime that hosts
    // the agent container. The container must:
    // - Listen on 0.0.0.0:8080
    // - Expose /ping (health) and /invocations (agent) endpoints
    // - Be built for ARM64 architecture
    //
    // Environment variables match apps/agent process.env usage so the container
    // receives AGENTCORE_MEMORY_ID, AGENTCORE_GATEWAY_URL, and enablement flags.
    // ==========================================================================
    const agentRuntime = new bedrockagentcore.CfnRuntime(this, "AgentRuntime", {
      agentRuntimeName: "research_agent",
      agentRuntimeArtifact: {
        containerConfiguration: {
          containerUri: `${this.ecrRepository.repositoryUri}:latest`,
        },
      },
      networkConfiguration: {
        networkMode: "PUBLIC",
      },
      protocolConfiguration: "HTTP",
      authorizerConfiguration: {
        customJwtAuthorizer: {
          // .well-known/openid-configuration
          discoveryUrl: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}/.well-known/openid-configuration`,
          allowedClients: [this.userPoolClient.userPoolClientId],
          // Do not set allowedAudience: Cognito access tokens use aud differently;
          // client_id validation via allowedClients is sufficient.
        },
      },
      roleArn: this.agentRole.roleArn,
      description: "Multi-agent research system runtime",
      environmentVariables: {
        AWS_DEFAULT_REGION: this.region,
        BEDROCK_MODEL_ID: "us.anthropic.claude-sonnet-4-20250514-v1:0",
        // AgentCore Observability: export traces to X-Ray for GenAI dashboard / Transaction Search
        AGENT_OBSERVABILITY_ENABLED: "true",
        OTEL_SERVICE_NAME: "research_agent",
        OTEL_TRACES_EXPORTER: "otlp",
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: `https://xray.${this.region}.amazonaws.com/v1/traces`,
        OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: "http/protobuf",
        OTEL_RESOURCE_ATTRIBUTES: "service.name=research_agent",
        // AgentCore enablement (apps/agent process.env)
        AGENTCORE_MEMORY_ID: agentMemory.attrMemoryId,
        AGENTCORE_MEMORY_NAMESPACE: "{actorId}",
        AGENTCORE_GATEWAY_URL: agentGateway.attrGatewayUrl,
        AGENTCORE_TOOLS_ENABLED: "true",
        AGENTCORE_BROWSER_ENABLED: "true",
        AGENTCORE_CODE_INTERPRETER_ENABLED: "true",
      },
    });

    // Ensure the runtime is created after ECR/image build, Cognito client, and AgentCore Memory/Gateway
    agentRuntime.node.addDependency(this.ecrRepository);
    agentRuntime.node.addDependency(triggerBuild);
    agentRuntime.node.addDependency(this.userPoolClient);
    agentRuntime.node.addDependency(agentMemory);
    agentRuntime.node.addDependency(agentGateway);

    this.agentRuntimeId = agentRuntime.attrAgentRuntimeId;
    this.agentRuntimeArn = agentRuntime.attrAgentRuntimeArn;
    this.agentMemoryId = agentMemory.attrMemoryId;

    // ==========================================================================
    // Invocations URL (ARN must be URL-encoded per Data Plane API contract)
    //
    // Custom resource builds the URL at deploy time so encodeURIComponent(ARN)
    // is applied to the resolved ARN value.
    // ==========================================================================
    const invocationsUrlFunction = new lambda.Function(
      this,
      "InvocationsUrlFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromInline(`
const https = require('https');
const url = require('url');

function sendResponse(event, context, status, data) {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: 'See CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data
  });
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: { 'content-type': '', 'content-length': Buffer.byteLength(responseBody) }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, () => resolve());
    req.on('error', reject);
    req.write(responseBody);
    req.end();
  });
}

exports.handler = async (event, context) => {
  if (event.RequestType === 'Delete') {
    await sendResponse(event, context, 'SUCCESS', {});
    return;
  }
  const { AgentRuntimeArn, Region, Account } = event.ResourceProperties;
  const encodedArn = encodeURIComponent(AgentRuntimeArn);
  const invocationsUrl = 'https://bedrock-agentcore.' + Region + '.amazonaws.com/runtimes/' + encodedArn + '/invocations?accountId=' + Account;
  await sendResponse(event, context, 'SUCCESS', { Url: invocationsUrl });
};
        `),
      },
    );

    invocationsUrlFunction.addPermission("AllowCloudFormation", {
      principal: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
      action: "lambda:InvokeFunction",
    });

    const invocationsUrlResource = new cdk.CustomResource(
      this,
      "InvocationsUrl",
      {
        serviceToken: invocationsUrlFunction.functionArn,
        properties: {
          AgentRuntimeArn: agentRuntime.attrAgentRuntimeArn,
          Region: this.region,
          Account: this.account,
        },
      },
    );
    invocationsUrlResource.node.addDependency(agentRuntime);

    this.agentInvocationsUrl = invocationsUrlResource.getAttString("Url");

    // ==========================================================================
    // AgentCore Evaluations: execution role and log group
    //
    // Evaluators and online evaluation configs are created via Control Plane API
    // (CLI, SDK, Console). This role is assumed by the service when running
    // evaluators. Pass its ARN when creating online evaluation configs.
    // ==========================================================================
    const evaluationRole = new iam.Role(this, "EvaluationRole", {
      roleName: "research-agent-evaluation-role",
      assumedBy: new iam.ServicePrincipal(
        "bedrock-agentcore.amazonaws.com",
      ).withConditions({
        StringEquals: {
          "aws:SourceAccount": this.account,
          "aws:ResourceAccount": this.account,
        },
        ArnLike: {
          "aws:SourceArn": [
            `arn:aws:bedrock-agentcore:${this.region}:${this.account}:evaluator/*`,
            `arn:aws:bedrock-agentcore:${this.region}:${this.account}:online-evaluation-config/*`,
          ],
        },
      }),
      description:
        "Execution role for AgentCore Evaluations (reads traces, writes results, invokes Bedrock for custom evaluators)",
    });

    // CloudWatch Logs: read (trace queries)
    evaluationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudWatchLogRead",
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:DescribeLogGroups",
          "logs:GetQueryResults",
          "logs:StartQuery",
        ],
        resources: ["*"],
      }),
    );

    // CloudWatch Logs: write evaluation results
    evaluationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudWatchLogWrite",
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/evaluations/*`,
        ],
      }),
    );

    // Index policy for trace analysis (Transaction Search / aws/spans)
    evaluationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudWatchIndexPolicy",
        effect: iam.Effect.ALLOW,
        actions: ["logs:DescribeIndexPolicies", "logs:PutIndexPolicy"],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:aws/spans`,
          `arn:aws:logs:${this.region}:${this.account}:log-group:aws/spans:*`,
        ],
      }),
    );

    // Bedrock (custom evaluators)
    evaluationRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "BedrockInvoke",
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    const evaluationLogGroup = new logs.LogGroup(this, "EvaluationLogGroup", {
      logGroupName: "/aws/bedrock-agentcore/evaluations/research-agent",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================================================
    // Stack Outputs
    // ==========================================================================
    new cdk.CfnOutput(this, "EcrRepositoryUri", {
      value: this.ecrRepository.repositoryUri,
      description: "ECR Repository URI for agent container",
      exportName: "ResearchAgentEcrUri",
    });

    new cdk.CfnOutput(this, "AgentRoleArn", {
      value: this.agentRole.roleArn,
      description: "IAM Role ARN for agent runtime",
      exportName: "ResearchAgentRoleArn",
    });

    new cdk.CfnOutput(this, "AgentRuntimeArn", {
      value: agentRuntime.attrAgentRuntimeArn,
      description: "ARN of the AgentCore Runtime",
      exportName: "ResearchAgentRuntimeArn",
    });

    new cdk.CfnOutput(this, "AgentRuntimeId", {
      value: agentRuntime.attrAgentRuntimeId,
      description: "ID of the AgentCore Runtime",
      exportName: "ResearchAgentRuntimeId",
    });

    new cdk.CfnOutput(this, "AgentInvocationsUrl", {
      value: this.agentInvocationsUrl,
      description:
        "Direct URL for invoking the AgentCore Runtime (SSE streaming); path uses URL-encoded ARN per Data Plane API",
      exportName: "ResearchAgentInvocationsUrl",
    });

    new cdk.CfnOutput(this, "ToolsFunctionArn", {
      value: toolsFunction.functionArn,
      description: "Lambda function ARN for Gateway tools",
      exportName: "ResearchAgentToolsFunctionArn",
    });

    new cdk.CfnOutput(this, "AgentLogGroupName", {
      value: agentLogGroup.logGroupName,
      description:
        "Custom log group. Runtime container logs are under /aws/bedrock-agentcore/runtimes/<runtimeId>-<endpoint>/runtime-logs",
      exportName: "ResearchAgentLogGroup",
    });

    new cdk.CfnOutput(this, "CodeBuildProjectName", {
      value: buildProject.projectName,
      description: "CodeBuild project for building agent container images",
      exportName: "ResearchAgentCodeBuildProject",
    });

    // Cognito outputs for frontend configuration
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "ResearchAgentUserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: "ResearchAgentUserPoolClientId",
    });

    new cdk.CfnOutput(this, "CognitoRegion", {
      value: this.region,
      description: "AWS Region for Cognito",
      exportName: "ResearchAgentCognitoRegion",
    });

    new cdk.CfnOutput(this, "AgentMemoryArn", {
      value: agentMemory.attrMemoryArn,
      description: "ARN of the AgentCore Memory",
      exportName: "ResearchAgentMemoryArn",
    });

    new cdk.CfnOutput(this, "AgentMemoryId", {
      value: agentMemory.attrMemoryId,
      description: "ID of the AgentCore Memory",
      exportName: "ResearchAgentMemoryId",
    });

    new cdk.CfnOutput(this, "AgentGatewayArn", {
      value: agentGateway.attrGatewayArn,
      description: "ARN of the AgentCore Gateway",
      exportName: "ResearchAgentGatewayArn",
    });

    new cdk.CfnOutput(this, "AgentGatewayUrl", {
      value: agentGateway.attrGatewayUrl,
      description: "URL of the AgentCore Gateway",
      exportName: "ResearchAgentGatewayUrl",
    });

    new cdk.CfnOutput(this, "EvaluationRoleArn", {
      value: evaluationRole.roleArn,
      description:
        "IAM Role ARN for AgentCore Evaluations (pass to CreateOnlineEvaluationConfig)",
      exportName: "ResearchAgentEvaluationRoleArn",
    });

    new cdk.CfnOutput(this, "EvaluationLogGroupName", {
      value: evaluationLogGroup.logGroupName,
      description: "CloudWatch log group for evaluation results",
      exportName: "ResearchAgentEvaluationLogGroup",
    });
  }
}
