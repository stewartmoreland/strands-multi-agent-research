import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import type { Construct } from "constructs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WebAppStackProps extends cdk.StackProps {
  /** Custom domain for the web app (e.g. app.example.com). When provided with hostedZoneId, creates ACM cert and Route53 records. */
  readonly domainName?: string;
  /** Route53 hosted zone ID. Required when domainName is provided. */
  readonly hostedZoneId?: string;
  /** Route53 hosted zone name (e.g. example.com). Required when domainName is provided. */
  readonly hostedZoneName?: string;
  /** Pre-created ACM certificate ARN (us-east-1). Use when stack is not in us-east-1; otherwise cert is created in this stack. */
  readonly certificateArn?: string;
  /** Cognito user pool ID. Required when using Cognito for authentication. */
  readonly userPoolId?: string;
  /** Cognito user pool client ID. Required when using Cognito for authentication. */
  readonly userPoolClientId?: string;
  /** Cognito region. Required when using Cognito for authentication. */
  readonly cognitoRegion?: string;
  /** Agent API URL. Required when using Agent API for authentication. */
  readonly agentApiUrl?: string;
  /** Agent invocations URL. Required when using Agent invocations for authentication. */
  readonly agentInvocationsUrl?: string;
}

/**
 * Web App Infrastructure Stack
 *
 * Builds and deploys the React web app to S3 + CloudFront.
 * Imports ResearchAgentStack outputs (Cognito, AgentCore invocations URL) for build-time env vars.
 * Optional: custom domain with ACM certificate and Route53 records.
 */
export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    const {
      domainName,
      hostedZoneId,
      hostedZoneName,
      certificateArn,
      userPoolId,
      userPoolClientId,
      cognitoRegion,
      agentApiUrl,
      agentInvocationsUrl,
    } = props;

    const hasCustomDomain = domainName && hostedZoneId && hostedZoneName;

    // ==========================================================================
    // S3 Bucket for static website
    // ==========================================================================
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `research-web-app-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ==========================================================================
    // ACM Certificate (us-east-1 required for CloudFront)
    // ==========================================================================
    let certificate: acm.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;

    if (hasCustomDomain) {
      const zoneId = hostedZoneId;
      const zoneNameVal = hostedZoneName;
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        "HostedZone",
        { hostedZoneId: zoneId, zoneName: zoneNameVal },
      );

      const domain = domainName;

      // Certificate must be in us-east-1 for CloudFront
      if (certificateArn) {
        certificate = acm.Certificate.fromCertificateArn(
          this,
          "WebCertImport",
          certificateArn,
        );
      } else if (this.region === "us-east-1") {
        certificate = new acm.Certificate(this, "WebCert", {
          domainName: domain,
          validation: acm.CertificateValidation.fromDns(hostedZone),
        });
      } else {
        throw new Error(
          "When using a custom domain outside us-east-1, pass certificateArn from a CertificateStack deployed in us-east-1.",
        );
      }
    }

    // ==========================================================================
    // CloudFront Distribution
    // ==========================================================================
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      ...(hasCustomDomain && certificate && domainName
        ? {
            domainNames: [domainName],
            certificate,
            minimumProtocolVersion:
              cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          }
        : {}),
    });

    // ==========================================================================
    // Route53 A/AAAA records (when custom domain)
    // ==========================================================================
    if (hasCustomDomain && hostedZone) {
      const recordName =
        domainName === hostedZoneName
          ? ""
          : domainName.slice(0, -((hostedZoneName?.length ?? 0) + 1));

      new route53.ARecord(this, "AliasRecord", {
        zone: hostedZone,
        recordName: recordName || undefined,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution),
        ),
      });

      new route53.AaaaRecord(this, "AliasRecordAAAA", {
        zone: hostedZone,
        recordName: recordName || undefined,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution),
        ),
      });
    }

    // ==========================================================================
    // CodeBuild Project for web app build
    // ==========================================================================
    const sourceAsset = new s3assets.Asset(this, "WebSourceAsset", {
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

    const codeBuildRole = new iam.Role(this, "WebCodeBuildRole", {
      roleName: "research-web-codebuild-role",
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      description: "Role for CodeBuild to build and deploy web app",
    });

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

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "S3SourceAccess",
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [`${sourceAsset.bucket.bucketArn}/*`],
      }),
    );

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "S3DeployAccess",
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
        resources: [websiteBucket.bucketArn, `${websiteBucket.bucketArn}/*`],
      }),
    );

    // Use Resource "*" to avoid IAM "policy failed legacy parsing": dynamic ARNs
    // (e.g. distribution ID via Ref) in Resource produce Fn::Join that IAM rejects.
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudFrontInvalidate",
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
        ],
        resources: ["*"],
      }),
    );

    const buildProject = new codebuild.Project(this, "WebBuildProject", {
      projectName: "research-web-build",
      description: "Build and deploy React web app to S3",
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      source: codebuild.Source.s3({
        bucket: sourceAsset.bucket,
        path: sourceAsset.s3ObjectKey,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": {
              nodejs: "22",
            },
            commands: [
              "echo Installing dependencies...",
              "npm install -g yarn",
              "yarn install --frozen-lockfile",
            ],
          },
          build: {
            commands: ["echo Building web app with env vars...", "yarn build"],
          },
          post_build: {
            commands: [
              "echo Deploying to S3...",
              `aws s3 sync apps/web/dist s3://${websiteBucket.bucketName}/ --delete`,
              "echo Invalidating CloudFront cache...",
              `aws cloudfront create-invalidation --distribution-id ${distribution.distributionId} --paths "/*"`,
            ],
          },
        },
      }),
      environmentVariables: {
        AWS_DEFAULT_REGION: { value: this.region },
        S3_BUCKET: { value: websiteBucket.bucketName },
        CLOUDFRONT_DISTRIBUTION_ID: { value: distribution.distributionId },
        VITE_COGNITO_USER_POOL_ID: {
          value: userPoolId,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        VITE_COGNITO_CLIENT_ID: {
          value: userPoolClientId,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        VITE_COGNITO_REGION: {
          value: cognitoRegion,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        VITE_AGENT_INVOCATIONS_URL: {
          value: agentInvocationsUrl,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
        VITE_AGENT_API_URL: {
          value: agentApiUrl,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      timeout: cdk.Duration.minutes(20),
    });

    // ==========================================================================
    // Custom Resource to trigger build on deployment
    // ==========================================================================
    const buildTriggerFunction = new lambda.Function(
      this,
      "WebBuildTriggerFunction",
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
    
    await new Promise(resolve => setTimeout(resolve, 30000));
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
    
    const startResponse = await codebuild.send(new StartBuildCommand({ projectName }));
    const buildId = startResponse.build.id;
    console.log('Started build:', buildId);
    
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
        logGroup: new logs.LogGroup(this, "WebBuildTriggerLogGroup", {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      },
    );

    buildTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["codebuild:StartBuild", "codebuild:BatchGetBuilds"],
        resources: [buildProject.projectArn],
      }),
    );

    new cdk.CustomResource(this, "TriggerWebBuild", {
      serviceToken: buildTriggerFunction.functionArn,
      properties: {
        ProjectName: buildProject.projectName,
        BuildTrigger: Date.now().toString(),
      },
    });

    // Ensure build runs after distribution and bucket exist
    buildProject.node.addDependency(distribution);
    buildProject.node.addDependency(websiteBucket);

    // ==========================================================================
    // Stack Outputs
    // ==========================================================================
    const webAppUrl = hasCustomDomain
      ? `https://${domainName}`
      : `https://${distribution.distributionDomainName}`;

    new cdk.CfnOutput(this, "WebAppUrl", {
      value: webAppUrl,
      description: "URL of the deployed web app",
      exportName: "ResearchWebAppUrl",
    });

    new cdk.CfnOutput(this, "CloudFrontDistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID for cache invalidation",
      exportName: "ResearchWebCloudFrontDistributionId",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 bucket hosting the web app",
      exportName: "ResearchWebS3BucketName",
    });

    if (hasCustomDomain && certificate) {
      new cdk.CfnOutput(this, "CertificateArn", {
        value: certificate.certificateArn,
        description: "ACM certificate ARN for the custom domain",
        exportName: "ResearchWebCertificateArn",
      });
    }
  }
}
