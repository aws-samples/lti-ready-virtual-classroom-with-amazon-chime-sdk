import * as cdk from '@aws-cdk/core';
import * as S3 from "@aws-cdk/aws-s3";
import * as S3Deployment from "@aws-cdk/aws-s3-deployment";
import cloudfront = require("@aws-cdk/aws-cloudfront");
import * as ssm from '@aws-cdk/aws-ssm'
import { StackProps } from '@aws-cdk/core';


export class ChimeReactMeetingsFrontendStack extends cdk.Stack {
  public readonly websiteCloudfrontDistribution: cdk.CfnOutput;
  public readonly staticWebsiteBucketDomain: cdk.CfnOutput;
  public readonly chimeReactMeetingsDemoBucket: cdk.CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appName = 'meeting';

    /**************************************************************************************************************
    * Frontend Resources *
    **************************************************************************************************************/

    // The code that defines your stack goes here
    // s3 - website
    const chimeReactMeetingsDemoBucket = new S3.Bucket(this, "chimeReactMeetingsDemoBucket", {
      websiteIndexDocument: `${appName}.html`,
      websiteErrorDocument:`${appName}.html`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
      // serverAccessLogsPrefix: 'logs/',
      accessControl: S3.BucketAccessControl.LOG_DELIVERY_WRITE,
    });
    this.chimeReactMeetingsDemoBucket = new cdk.CfnOutput(this, "chimeReactMeetingsDemoBucketName", { value: chimeReactMeetingsDemoBucket.bucketName })

    // Origin Access Identity
    const chimeReactMeetingsCloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "chimeReactMeetingsCloudFrontOAI"
    );

    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "MeetingsWebsitesiteDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: chimeReactMeetingsDemoBucket,
              originAccessIdentity: chimeReactMeetingsCloudFrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        defaultRootObject: `${appName}.html`,
      }
    );
    chimeReactMeetingsDemoBucket.grantRead(chimeReactMeetingsCloudFrontOAI.grantPrincipal);

    this.websiteCloudfrontDistribution = new cdk.CfnOutput(this, "MeetingsWebsiteCloudfrontDistribution", {
      value: distribution.distributionDomainName,
    })

    /* S3 Deployment resource */
    new S3Deployment.BucketDeployment(this, "S3WebsiteDeployment", {
      sources: [S3Deployment.Source.asset(`../react-meeting-demo/demo/meeting/dist`)],
      destinationBucket: chimeReactMeetingsDemoBucket,
      distribution:distribution,
      distributionPaths: ['/*'], //invalidate the path
    });

    this.staticWebsiteBucketDomain = new cdk.CfnOutput(this, "BucketDomain", {
      value: chimeReactMeetingsDemoBucket.bucketWebsiteDomainName,
    });

    new ssm.StringParameter(this, "chimeFrontendWebAppUrl", {
      description: "The CloudFront distribution for the Chime SDK Meetings backend",
      parameterName: "/chime/web/frontendUrl",
      stringValue: `https://${distribution.distributionDomainName}`
    })

  }
}
