# Setup instructions

This project uses Amazon Amplify to roll out a serverless web application to your AWS account as illustrated in the yellow box below. For this project to work it is required to also set up the Chime Meetings App (frontend and backend) and an LTI platform such as a learning management system (LMS) like Moodle, Blackboard or Canvas.

![Architectural overview](../doc/chime-lti-architectural-overview.png)

- **LTI Client API**: this API provides endpoints to allow this application to be integrated as an LTI tool in an LMS like Moodle, Canvas, or Blackboard. This API also issues web tokens and uses AWS SecretsManager to store a secret key.

- **Chime Web Events Center**: is a React web application that is used by teachers to create and maintain _events_ and by students to review these _events_. An event represents a scheduled Chime meeting and it has a title, a datetime, a description etc. The web application is hosted in S3, distributed via Cloudfront. It also uses several DynamoDB tables to store data in its own backend.

- **Events API**: Is the backend API for the web application and it encapsulates persistence logic for _events_. Also, this API owns communication to the Chime web meetings API when initiating and joining actual Chime meetings.

## Prerequisits

**What you need to start this setup:**

- Installed on your local machine: Git, Node (12.x or 14.x), NPM, AWS Amplify CLI

**What you need to complete this setup and make it functional** (but is optional for installation):

- an LTI platform to connect to e.g. an LMS like Moodle, Canvas or Blackboard
  - specifically you'll need to set up an LTI plugin and get the public keyset, auth request, and token uris. Step 7 provides further instructions on how to set up an LTI plugin and get the listed information in the most popular LMS products.
- the Chime Meetings App rolled out in your AWS account
  - specifically you'll need the Cloudfront web and API url which are provided as outputs of the setup process

## Setup

### 1. Clone Git repository using the git repo url

```bash
git clone "git-repo-url"
```

### 2. Install and configure AWS Amplify

Please follow [these instruction steps](https://docs.amplify.aws/cli/start/install) to install and set up Amplify CLI on your local machine.

### 3. Initialize Amplify project

Navigate to the **/web** folder of this project run _amplify init_ from your commandline.

```bash
cd web
amplify init
```

a) Name your environment e.g. "dev" or "prod"

b) Choose your preferred IDE to work on this project such as _Visual Studio Code_. If you're not sure select _None_

c) Select authentication method e.g. _AWS profile_ and select the AWS profile or AWS IAM credentials with administrative permissions. Most likely you'll use AWS credentials that you already created as part of configuring your local Amplify CLI in step 2 of this guide.

### 4. Publish Amplify project to AWS

From the **/web** folder of this project please run the following from your commandline:

```bash
npm run amplify:publish
```

When asked to continue, confirm with **Y (Yes)**. The initial setup can take some time. Please help yourself with a coffee.

Congratulations! You successfully deployed the LTI tool. Now it is time to configure it properly to work in conjunction with an LTI platform and the Chime Meetings App like it is illustrated at the top. Both of these components need to be set up seperately (covered in step 6 and 7 below).

### 5. Prepare for setting up LTI platform and Chime meeting app

To set up your LTI plugin in an LMS you'll need endpoint information from the LTI tool that you rolled out in the previous step.

a) Log in to your AWS account and go to _Systems Manager_.

b) From the _Systems Manager_ menu, select _Parameter Store_.

c) You should see the following parameters:

- **/chime/lti/{env}/ltiToolAuthUri**: is the Url to provide to an LTI platform when it asks for the tool url and redirect url.
- **/chime/lti/{env}/ltiToolLoginUri**: is the Url used by an LTI platform to initiate an external login.
- **/chime/lti/{env}/ltiToolJwkUri**: is the Url to provide to an LTI platform when it asks for a public keyset or token verification url.

_{env}_ represents the name of your Amplify environment that you set in step 3 e.g. "dev" or "prod".
To receive the url value from these parameters click on them on copy the assigned _Value_.

If you don't see these parameter names please make sure your AWS management console is set to the AWS region which was targeted for deployment in step 4.

### 6. Deploy the Chime Meetings App

Please go ahead and deploy the Chime Meetings App from [Gitlab](https://gitlab.aws.dev/edtech-chime-sdk-demos/chime-meetings-stack) by following the instructions.

When you are asked to provide the _Public JWK uri_ please use the value of **/chime/lti/{env}/ltiToolJwkUri** from the previous step.

### 7. Set up LTI plugin in your LMS

d) Now use this information to complete setting up an LTI plugin in your LMS.

- Read [detailed instructions for MOODLE](README-Moodle.md)
- Read [detailed instructions for CANVAS](README-Canvas.md)

If you're using a different LTI-enabled product please refer to its technical guidance on setting up LTI plugins.

### 8. Update platform configuration

The final step is to configure the LTI tool to work with the LMS and the Chime Meetings app.

Please navigate to back to _Systems Manager_ in your AWS management console and go to _Property Store_. You'll find three more parameters that need their values updated to the following:

- **/chime/lti/{env}/ltiPlatformTokenUri**: update value and set to the auth token url as provided by the LMS in step 7
- **/chime/lti/{env}/ltiPlatformJwkUri**: update value to the public keyset url which is provided by the LMS in step 7
- **/chime/lti/{env}/ltiPlatformAuthRequestUri**: update value to the auth request url as provided by the LMS in step 7

Please double check if there are two more properties in _Property Store_ called:

- **/chime/web/backendUrl**: which should contain an API gateway url. It points to the API backend of the Chime meetings app as it was installed in step 6.
- **/chime/web/frontendUrl**: which should contain a Cloudfront url. It points to the API frontend of the Chime meetings app as it was installed in step 6.

If any of these parameters are missing please ensure you've successfully completed step 6 of this guide.

### You're all set

Step 7 already provided you with instructions on how to create resource links from an LTI plugin in your LMS. You should now be able to click on these links and see this demo application in action.

**IMPORTANT NOTE**

The parameter values that you updated in step 8 act as default configuration values for any new LTI platform which sends a request to the LTI client API. This action creates a configuration item in a DynamoDB table named **chimePlatforms-{env}**. That said, in order to update configuration for an existing LTI platform setup you'll need to update values in the DynamoDB table instead of updating values in _Systems Manager's_ _Parameter Store_.
