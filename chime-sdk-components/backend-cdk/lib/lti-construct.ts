import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import { Construct } from '@aws-cdk/core';
import cdk = require('@aws-cdk/core');
import { Duration } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam')
import { DynamoDBSeeder, Seeds } from '@cloudcomponents/cdk-dynamodb-seeder';
import ssm = require ('@aws-cdk/aws-ssm')
import events = require ('@aws-cdk/aws-events');
import targets = require ('@aws-cdk/aws-events-targets')
import logs = require ('@aws-cdk/aws-logs')
import apigateway = require('@aws-cdk/aws-apigateway'); 
import { CHIME_CUSTOM_EVENT_BUS_NAME, CHIME_CUSTOM_EVENT_SOURCE_NAME,CHIME_CUSTOM_EVENT_LOG_GROUP_NAME } from '../constants/eventBridge';
import { ChimeLTIBackendProps } from '../index';

export class ChimeLTIBackendConstruct extends Construct {
    constructor(parent: Construct, name: string, props: ChimeLTIBackendProps) {
        super(parent, name);
        const meetingsTable = new dynamodb.Table(this, 'meetings', {
            partitionKey: {
              name: 'eventId',
              type: dynamodb.AttributeType.STRING
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            timeToLiveAttribute: 'TTL',
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,            
        });

        const rolesTable = new dynamodb.Table(this, 'roles', {
          partitionKey: {
            name: 'RoleId',
            type: dynamodb.AttributeType.STRING
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const participantsTable = new dynamodb.Table(this, 'participants', {
          partitionKey: {
            name: 'externalUserId',
            type: dynamodb.AttributeType.STRING
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          timeToLiveAttribute: 'TTL',
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,            
      });

        new DynamoDBSeeder(this, 'JsonFileSeeder', {
          table: rolesTable,
          seeds: Seeds.fromJsonFile('./src/roles.json'),
        });

        const lambdaRole = new iam.Role(this, 'lambdaRole', {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
          inlinePolicies: {
            ['chimePolicy']: new iam.PolicyDocument( { statements: [new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*',
                        'lambda:*']})]})
          },
          managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole") ]
        })

        const setupLambda = new lambda.Function(this, 'setup', {
          code: lambda.Code.fromAsset("./src/setup"),
          handler: 'setup.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });

        const endLambda = new lambda.Function(this, 'end', {
          code: lambda.Code.fromAsset("./src/end"),
          handler: 'end.handler',
          role: lambdaRole,          
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });        
          
        const queryLambda = new lambda.Function(this, 'query', {
          code: lambda.Code.fromAsset("./src/query"),
          handler: 'query.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });

        const infoLambda = new lambda.Function(this, 'info', {
          code: lambda.Code.fromAsset("./src/info"),
          handler: 'info.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });

        const attendeeLambda = new lambda.Function(this, 'attendee', {
          code: lambda.Code.fromAsset("./src/attendee"),
          handler: 'attendee.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });        

        const modifyLambda = new lambda.Function(this, 'modify', {
          code: lambda.Code.fromAsset("./src/modify"),
          handler: 'modify.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName
          },
        });

        const parseLogsLambda = new lambda.Function(this, 'parseLogs', {
          code: lambda.Code.fromAsset("./src/parseLogs"),
          handler: 'parse.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            PARTICIPANT_TABLE_NAME: participantsTable.tableName,
            CHIME_CUSTOM_EVENT_BUS_NAME: CHIME_CUSTOM_EVENT_BUS_NAME,
            CHIME_CUSTOM_EVENT_SOURCE_NAME: CHIME_CUSTOM_EVENT_SOURCE_NAME,
          },
        });        
        
        const authLambda = new lambda.Function(this, 'auth', {
          code: lambda.Code.fromAsset("./src/auth"),
          handler: 'auth.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            JWK_URI: props.public_jwk_url.toString()
          },
        });  
        
        const customChimeEventBus = new events.EventBus(this, 'CustomChimeEventsBus', {
          eventBusName: CHIME_CUSTOM_EVENT_BUS_NAME,
        })

        new events.Rule(this, 'CustomChimeEventsRule', {
          description: 'Capture augmented logs provided by parse lambda',
          enabled: true,
          eventBus: customChimeEventBus,
          eventPattern: {  "source": [CHIME_CUSTOM_EVENT_SOURCE_NAME] },
          targets: [  new targets.CloudWatchLogGroup(new logs.LogGroup(this, 'CustomChimeEventsLogGroup', {
            logGroupName: CHIME_CUSTOM_EVENT_LOG_GROUP_NAME
          })) ]
        })
        new events.Rule(this, 'EventBridgeRule', {
          description: 'Capture Logs',
          enabled: true,
          eventPattern: {  "source": ["aws.chime"] },
          targets: [  new targets.CloudWatchLogGroup(new logs.LogGroup(this, 'LogGroup')),
                      new targets.LambdaFunction(parseLogsLambda)]
        })

        new events.Rule(this, 'EndMeetingEventBridgeRule', {
          description: 'End Meeting Rule',
          enabled: true,
          eventPattern: {
            "source": ["aws.chime"],
            "detail": {
              "eventType": ["chime:MeetingEnded"] }
          },
          targets: [new targets.LambdaFunction(endLambda)],
        })  

        const joinLambda = new lambda.Function(this, 'join', {
          code: lambda.Code.fromAsset("./src/join", {exclude: ['yarn.lock']}),
          handler: 'join.handler',
          role: lambdaRole,
          runtime: lambda.Runtime.NODEJS_14_X,
          timeout: Duration.seconds(60),
          environment: {
            MEETINGS_TABLE_NAME: meetingsTable.tableName,
            ROLE_TABLE_NAME: rolesTable.tableName,
            PARTICIPANT_TABLE_NAME: participantsTable.tableName
          },
        });


        const apiAuth = new apigateway.TokenAuthorizer(this, 'ltiAuthorizer', {
          handler: authLambda,
          resultsCacheTtl: Duration.seconds(0)
        });

        const api = new apigateway.RestApi(this, 'ltiApi', {
          defaultCorsPreflightOptions: {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: ['POST', 'OPTIONS'] // this is also the default
          },
          endpointConfiguration: {
            types: [ apigateway.EndpointType.EDGE ]
          }
        });
       
        const setup = api.root.addResource('setup');
        const setupProxy = setup.addProxy({defaultIntegration: new apigateway.LambdaIntegration(setupLambda), anyMethod: false})
        setupProxy.addMethod('POST', new apigateway.LambdaIntegration(setupLambda), {
          authorizer: apiAuth
        })

        const join = api.root.addResource('join');
        const joinProxy = join.addProxy({defaultIntegration: new apigateway.LambdaIntegration(joinLambda), anyMethod: false})
        joinProxy.addMethod('POST', new apigateway.LambdaIntegration(joinLambda), {
          authorizer: apiAuth});

        const query = api.root.addResource('query');
        const queryProxy = query.addProxy({defaultIntegration: new apigateway.LambdaIntegration(queryLambda), anyMethod: false})
        queryProxy.addMethod('POST', new apigateway.LambdaIntegration(queryLambda), {
          authorizer: apiAuth});          

        const info = api.root.addResource('info');
        const infoProxy = info.addProxy({defaultIntegration: new apigateway.LambdaIntegration(joinLambda), anyMethod: false})
        infoProxy.addMethod('POST', new apigateway.LambdaIntegration(infoLambda), {
          authorizer: apiAuth});          

        const end = api.root.addResource('end');
        const endProxy = end.addProxy({defaultIntegration: new apigateway.LambdaIntegration(joinLambda), anyMethod: false})        
        endProxy.addMethod('POST', new apigateway.LambdaIntegration(endLambda), {
          authorizer: apiAuth});          

        const attendee = api.root.addResource('attendee');
        const attendeeProxy = attendee.addProxy({defaultIntegration: new apigateway.LambdaIntegration(joinLambda), anyMethod: false})        
        attendeeProxy.addMethod('POST', new apigateway.LambdaIntegration(attendeeLambda), {
          authorizer: apiAuth});                  

        const modifyUser = api.root.addResource('modifyUser');
        const modifyUserProxy = modifyUser.addProxy({defaultIntegration: new apigateway.LambdaIntegration(joinLambda), anyMethod: false})        
        modifyUserProxy.addMethod('POST', new apigateway.LambdaIntegration(modifyLambda), {
          authorizer: apiAuth});      
        

        meetingsTable.grantReadWriteData(setupLambda);
        rolesTable.grantReadWriteData(setupLambda);
        meetingsTable.grantReadWriteData(joinLambda);
        rolesTable.grantReadWriteData(joinLambda);
        participantsTable.grantWriteData(joinLambda);
        meetingsTable.grantReadWriteData(queryLambda);
        rolesTable.grantReadWriteData(queryLambda);
        meetingsTable.grantReadWriteData(infoLambda);
        rolesTable.grantReadWriteData(infoLambda);
        rolesTable.grantReadWriteData(modifyLambda);
        meetingsTable.grantReadWriteData(modifyLambda);
        rolesTable.grantReadWriteData(endLambda);
        meetingsTable.grantReadWriteData(endLambda);
        rolesTable.grantReadWriteData(attendeeLambda);
        meetingsTable.grantReadWriteData(attendeeLambda);
        participantsTable.grantReadWriteData(parseLogsLambda)        

  // DEFINE SSM PARAMETERS FOR FRONTEND STACK REFERENCE
        new ssm.StringParameter(this, "chimeBackendApiEndpoint", {
          description: "The backend API for the Chime SDK Meetings backend",
          parameterName: "/chime/web/backendUrl",
          stringValue: api.url
        }
    );
  };
}
