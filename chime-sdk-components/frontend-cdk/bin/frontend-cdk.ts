#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ChimeReactMeetingsFrontendStack } from '../lib/meetings-frontend-stack';

const app = new cdk.App();
new ChimeReactMeetingsFrontendStack(app, 'ChimeLTIFrontendStack', {env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }});




