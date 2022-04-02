export type AmplifyDependentResourcesAttributes = {
    "analytics": {
        "chimeMeetingEventsProcessing": {
            "Region": "string",
            "AnalyticsWorkGroupName": "string",
            "AnalyticsBucketName": "string",
            "AnalyticsBucketArn": "string",
            "NamedQueryIdPairMeetingEvents": "string",
            "NamedQueryIdAggregateMeetingEvents": "string",
            "AnalyticsBucketUserFolderName": "string",
            "AnalyticsBucketEventsFolderName": "string",
            "AnalyticsResultOutputLocation": "string",
            "AnalyticsResultOutputLocationArn": "string",
            "AnalyticsDatabaseName": "string",
            "S3BucketSecureURL": "string"
        }
    },
    "custom": {
        "mappings": {
            "Region": "string"
        }
    },
    "hosting": {
        "S3AndCloudFront": {
            "Region": "string",
            "HostingBucketName": "string",
            "WebsiteURL": "string",
            "S3BucketSecureURL": "string",
            "CloudFrontDistributionID": "string",
            "CloudFrontDomainName": "string",
            "CloudFrontSecureURL": "string",
            "CloudFrontOriginAccessIdentity": "string"
        }
    },
    "security": {
        "tokenSecret": {
            "Name": "string",
            "Arn": "string",
            "Region": "string"
        }
    },
    "storage": {
        "dynamoEventGroups": {
            "Name": "string",
            "Arn": "string",
            "StreamArn": "string",
            "PartitionKeyName": "string",
            "PartitionKeyType": "string",
            "SortKeyName": "string",
            "SortKeyType": "string",
            "Region": "string"
        },
        "dynamoEvents": {
            "Name": "string",
            "Arn": "string",
            "StreamArn": "string",
            "PartitionKeyName": "string",
            "PartitionKeyType": "string",
            "SortKeyName": "string",
            "SortKeyType": "string",
            "Region": "string"
        },
        "dynamoPlatforms": {
            "Name": "string",
            "Arn": "string",
            "StreamArn": "string",
            "PartitionKeyName": "string",
            "PartitionKeyType": "string",
            "Region": "string"
        },
        "dynamoEventsMetrics": {
            "Name": "string",
            "Arn": "string",
            "StreamArn": "string",
            "PartitionKeyName": "string",
            "PartitionKeyType": "string",
            "SortKeyName": "string",
            "SortKeyType": "string",
            "Region": "string"
        }
    },
    "api": {
        "chimeEventApi": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        },
        "chimeLtiApi": {
            "RootUrl": "string",
            "LtiToolPublicKeyUrl": "string",
            "LtiToolAuthUrl": "string",
            "LtiToolLoginUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        }
    },
    "function": {
        "chimeEventApiPlatform": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeEventApiEventGroup": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeEventApiEvent": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeEventApiAuthorizer": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeLtiApiAuth": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeLtiApiLogin": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeLtiApiJwk": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeEventApiJoin": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeEventApiSetup": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "chimeMetricsQueryTrigger": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string",
            "SqsChimeEventBridgeTriggerArn": "string"
        },
        "chimeMetricsResultProcessor": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string",
            "SqsAthenaJobsQueueUrl": "string",
            "SqsAthenaJobsQueueArn": "string"
        }
    }
}