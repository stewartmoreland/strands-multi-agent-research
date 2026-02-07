import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";

export interface CertificateStackProps extends cdk.StackProps {
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
}

/**
 * Stack that creates an ACM certificate in us-east-1 for CloudFront.
 * Must be deployed in us-east-1.
 */
export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    if (this.region !== "us-east-1") {
      throw new Error(
        "CertificateStack must be deployed in us-east-1 for CloudFront.",
      );
    }

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      },
    );

    this.certificate = new acm.Certificate(this, "WebCert", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "ACM certificate ARN for web app",
      exportName: "ResearchWebCertificateArn",
    });
  }
}
