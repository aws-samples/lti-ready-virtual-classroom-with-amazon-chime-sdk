# Setup instructions

The LTI-ready virtual classroom experience uses AWS Amplify to roll out a serverless web application to your AWS account as illustrated in the yellow box below. For this experience to work, you must also set up the Amazon Chime SDK meeting experience (frontend and backend) and an LTI platform such as a learning management system (LMS) like Moodle, Blackboard or Canvas.

![Architectural overview](../doc/chime-lti-architectural-overview.png)

There are four key components:

- **LMS system with the LTI plugin configured**: This is supported with the LTI Client API which provides endpoints to integrate as an LTI tool in an LMS like Moodle, Canvas, or Blackboard. This API also issues web tokens and uses AWS Secrets Manager to store a secret key.

- **Events Management Center**: a React web application that educators will use to create and maintain _events_ and by students to review these _events_. An event represents a scheduled Amazon Chime SDK meeting, e.g. a virtual classroom experience, with information like event title, date, time, and description. The web application is hosted in Amazon S3, distributed via Amazon CloudFront, and also uses Amazon DynamoDB tables to store data. Additionally, the Events Management Center subscribes to user events in Amazon Chime meetings (via Amazon EventBridge) and pulls in event data, e.g. meeting started, meeting ended, attendee joined, attendee left, started and stopped sharing screen, etc. The tool takes these events and augments them with relevant data like LTI user information and event details before aggregating metrics to present meaningful insight into Amazon Chime SDK meeting activities.

- **Events API**: a backend API for the web application which encapsulates persistence logic for _events_. Also, this API owns communication to the Amazon Chime web meetings API when initiating and joining actual Amazon Chime SDK meetings.

- **Amazon Chime SDK meeting experience**: where attendees can collaborate over audio/video and screen share.

## Prerequisites

**What you need to start this setup:**

- Installed on your local machine: Git, Node (12.x or 14.x), NPM, AWS Amplify CLI

**What you need to complete this setup and make it functional** (but is optional for installation):

- an LTI platform such as an LMS, e.g. Moodle, Canvas, or Blackboard which supports [LTI v1.3](https://www.imsglobal.org/spec/lti/v1p3/#overview) or later.
  - specifically you'll need to set up an LTI plugin and get the public keyset, auth request, and token URIs. Step 7 provides further instructions on how to set up an LTI plugin and get the listed information in the most popular LMS products.
- the Amazon Chime SDK meeting experience rolled out in your AWS account
  - specifically you'll need the Amazon CloudFront web and API url which are provided as outputs of the setup process

## Setup

### 1. Clone Git repository using the git repo url

```bash
git clone https://github.com/aws-samples/lti-ready-virtual-classroom-with-amazon-chime-sdk
```

### 2. Install and configure AWS Amplify

Please follow [these instruction steps](https://docs.amplify.aws/cli/start/install) to install and set up AWS Amplify CLI on your local machine.

### 3. Initialize AWS Amplify project

Navigate to the **/web** folder of this project run _amplify init_ from your commandline.

```bash
cd lti-components/web
amplify init
```

a) Name your environment e.g. "dev" or "prod"

b) Choose your preferred IDE to work on this project such as _Visual Studio Code_. If you're not sure select _None_

c) Select authentication method e.g. _AWS profile_ and select the AWS profile or AWS IAM credentials with administrative permissions. Most likely you'll use AWS credentials that you already created as part of configuring your local AWS Amplify CLI in step 2 of this guide.

### 4. Publish AWS Amplify project to AWS

From the **/web** folder of this project please run the following from your commandline:

```bash
npm run amplify:publish
```

When asked to continue, confirm with **Y (Yes)**. The initial setup can take some time. Please help yourself with a coffee.

Congratulations! You successfully deployed the LTI tool. Now it is time to configure it properly to work in conjunction with an LTI platform and the Amazon Chime Meetings App like it is illustrated at the top. Both of these components need to be set up seperately (covered in step 6 and 7 below).

### 5. Prepare for setting up LTI platform and Amazon Chime SDK meeting experience

To set up your LTI plugin in an LMS you'll need endpoint information from the LTI tool that you rolled out in the previous step.

a) Log in to your AWS account and go to _Systems Manager_.

b) From the _Systems Manager_ menu, select _Parameter Store_.

c) You should see the following parameters:

- **/chime/lti/{env}/ltiToolAuthUri**: is the Url to provide to an LTI platform when it asks for the tool url and redirect url.
- **/chime/lti/{env}/ltiToolLoginUri**: is the Url used by an LTI platform to initiate an external login.
- **/chime/lti/{env}/ltiToolJwkUri**: is the Url to provide to an LTI platform when it asks for a public keyset or token verification url.

_{env}_ represents the name of your AWS Amplify environment that you set in step 3 e.g. "dev" or "prod".
To receive the url value from these parameters click on them on copy the assigned _Value_.

If you don't see these parameter names please make sure your AWS Management Console is set to the AWS region which was targeted for deployment in step 4.

### 6. Deploy the Amazon Chime SDK meeting experience

Please go ahead and deploy the Amazon Chime SDK meeting experience from [Github](https://github.com/aws-samples/lti-ready-virtual-classroom-with-amazon-chime-sdk/tree/main/chime-sdk-components) by following the instructions.

When you are asked to provide the _Public JWK uri_ please use the value of **/chime/lti/{env}/ltiToolJwkUri** from the previous step.

### 7. Set up LTI plugin in your LMS

d) Now use this information to complete setting up an LTI plugin in your LMS.

- Read [detailed instructions for MOODLE LMS](README-Moodle.md)
- Read [detailed instructions for CANVAS LMS](README-Canvas.md)

If you're using a different LTI-enabled product please refer to its technical guidance on setting up LTI plugins.

### 8. Update platform configuration

The final step is to configure the LTI tool to work with the LMS and the Amazon Chime SDK meeting experience.

Please navigate to back to _Systems Manager_ in your AWS Management Console and go to _Property Store_. You'll find three more parameters that need their values updated to the following:

- **/chime/lti/{env}/ltiPlatformTokenUri**: update value and set to the auth token url as provided by the LMS in step 7
- **/chime/lti/{env}/ltiPlatformJwkUri**: update value to the public keyset url which is provided by the LMS in step 7
- **/chime/lti/{env}/ltiPlatformAuthRequestUri**: update value to the auth request url as provided by the LMS in step 7

Please double check if there are two more properties in _Property Store_ called:

- **/chime/web/backendUrl**: which should contain an API gateway url. It points to the API backend of the Amazon Chime meetings app as it was installed in step 6.
- **/chime/web/frontendUrl**: which should contain a Amazon CloudFront url. It points to the API frontend of the Amazon Chime meetings app as it was installed in step 6.

If any of these parameters are missing please ensure you've successfully completed step 6 of this guide.

### You're all set

Step 7 already provided you with instructions on how to create resource links from an LTI plugin in your LMS. You should now be able to click on these links and see this demo application in action.

**IMPORTANT NOTE**

The parameter values that you updated in step 8 act as default configuration values for any new LTI platform which sends a request to the LTI client API. This action creates a configuration item in an Amazon DynamoDB table named **chimePlatforms-{env}**. That said, in order to update configuration for an existing LTI platform setup you'll need to update values in the Amazon DynamoDB table instead of updating values in _Systems Manager's_ _Parameter Store_.
