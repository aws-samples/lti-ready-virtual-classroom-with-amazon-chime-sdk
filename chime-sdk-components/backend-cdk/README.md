## Requirements
- node V12+ [installed](https://nodejs.org/en/download/)
- npm [installed](https://www.npmjs.com/get-npm)
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- AWS CDK [installed](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_install)
  - `npm install -g aws-cdk`
  - Be sure to have the latest version installed.  If you need to upgrade, uninstall with `npm uninstall -g aws-cdk` and then reinstall.
- AWS CDK [bootstrapped](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)
  - `cdk bootstrap`

## Deployment

Edit `/backend-services/lib/lti-stack.ts` JWK_URI in authLambda with correct URI

### Back-end Resources
- Clone this repo: `git clone ENTER_REPO_NAME`
- `cd REPO_NAME`
- `chmod +x deploy.sh`
- `./deploy.sh`
- Accept prompts for CDK deployment