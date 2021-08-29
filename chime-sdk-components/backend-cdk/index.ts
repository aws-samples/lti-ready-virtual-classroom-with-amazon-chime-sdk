#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { ChimeLTIBackendConstruct } from './lib/lti-construct';

export interface ChimeLTIBackendProps extends cdk.StackProps {
  readonly public_jwk_url: String;
}

class ChimeLTIBackend extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: ChimeLTIBackendProps) {
    super(parent, name, props);

    new ChimeLTIBackendConstruct(this, 'ChimeLTIBackendConstruct', props);
  }
}

const app = new cdk.App();
const public_jwk_url: String = app.node.tryGetContext('publicjwkurl');
console.log('context passed in App 👉', app.node.tryGetContext('publicjwkurl'));
if (public_jwk_url === 'undefined') {
  throw new Error('Please provide a valid public jwk url and restart the deployment...');
}

new ChimeLTIBackend(app, 'ChimeLTIBackend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  public_jwk_url: public_jwk_url
})

app.synth();
