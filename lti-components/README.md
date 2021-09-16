# Architecture Overview

This post provides code resources to roll out a web application to AWS which integrates Amazon Chime SDK meeting experience into an  [LTI](https://www.imsglobal.org/activity/learning-tools-interoperability) tool in a learning management system (LMS) like Moodle, Canvas, or Blackboard. To set up and deploy the LTI-ready virtual classroom experience, please follow the [setup instructions](./web/README.md).

## What you get

This experience uses AWS Amplify to roll out AWS CloudFormation stacks to cover all functional components -- which we call the LTI tool -- illustrated inside the yellow box below. It provides an interface so that a virtual classroom experience can be integrated as an LTI plugin into a course or module pages within an LMS (LTI refers to these as resource links). On the backend, the LTI tool acts as a client to utilize the Amazon Chime SDK meeting experience as a communications tool for educators and students. This experience is supported with the LTI Client API which provides endpoints to integrate as an LTI tool in an LMS. The API also issues web tokens and uses AWS Secrets Manager to store a secret key.

Additionally, the LTI-ready virtual classroom experience provides the Events Management Center, a React web application that creates an interface that educators can use to create and maintain events and for students to review these events. An event represents a scheduled Amazon Chime SDK meeting, e.g. a virtual classroom experience, with information like event title, date, time, and description. The web application is hosted in Amazon S3, distributed via Amazon CloudFront, and also uses Amazon DynamoDB tables to store data. Additionally, the Events Management Center subscribes to user events in Amazon Chime SDK meetings via Amazon EventBridge and pulls in event data, e.g. meeting started, meeting ended, attendee joined, attendee left, started and stopped sharing screen, etc. The tool takes these events and augments them with relevant data like LTI user information and event details before aggregating metrics to present meaningful insight into Amazon Chime SDK meeting activities.

![Architectural overview](doc/chime-lti-architectural-overview.png)

## What you need

The complete scenario requires you to have the following (either before or after the initial deployment of this application):

1. A configured LTI plugin in an externally hosted platform like a LMS such as Moodle, Canvas, Blackboard which supports [LTI v1.3](https://www.imsglobal.org/spec/lti/v1p3/#overview) or later.

2. Amazon Chime SDK meeting experience.

To get started, please follow [these setup instructions](./web/README.md) to deploy the LTI tool.

## How it works

To better understand the technical components and their purpose in this sample, let's walk through all steps necessary to start and join an Amazon Chime SDK meeting experience as an educator or student coming from an LMS.

![Architectural overview](doc/chime-lti-architectural-overview-steps.png)

### Step 1) LTI plugin setup (by Admin)

An Administrator sets up a new LTI plugin in an LMS by providing endpoint information from the LTI Client API. This process is described as part of the [setup instructions](./web/README.md).

### Step 2) LTI resource link creation (by Educator)

Once the LTI plugin is set up and enabled in the LMS, educators and faculty members can embed hyperlinks in various locations within the LMS e.g. on a course page. They may choose to label these links as _"Enter virtual classroom for course XY"_ etc.

### Step 3) Click on LTI resource link (by Educators and Students)

Anyone with access to this LMS course page is now able to see and click on this link in order to enter this tools web page.

### Step 4) Verify incoming access request

As soon as the link is clicked, the user will be forwarded to the LTI tool. An OpenID authorization is processed between the LMS on the left (the OpenID provider) and the LTI tool on the right (the OpenID client). The LTI tool verifies the authenticity of the incoming access request and receives some information about the source and the user's identity. Any newly verified LMS platform will get its own configuration profile in the LTI tool. Stored in Amazon DynamoDB, these configuration profiles allow Administrators to maintain global settings like LMS endpoints but also default UX settings such as display formats for date and time.

### Step 5) Issue token with source and user info

Once the incoming request is verified, the LTI tool extracts relevant information from the LMS OpenID token, such as course title, user name, and roles. It translates the LTI schema into its own data structure and issues its own OpenID token using a private JWK which is securely stored in AWS Secrets Manager. At this point, the LTI Client API becomes the new internal authority for verifying the user identity as it moves along all the following steps.

### Step 6) Cache user information

When a user enters the LTI tool from an LMS, some relevant user information is securely stored in Amazon S3. The main purpose of storing user data in Amazon S3 is to later merge this information with user actions taken in Amazon Chime SDK meetings to run insightful analytics on student engagement.

### Step 7) Enter Events Management Center web interface

After the verification process is done, the user who clicked on the link is forwarded to the LTI tools web interface. The LTI Client API also forwards its newly issued token with all relevant information about the user and the source (e.g. the course page).

### Step 8) Create, schedule and review events (Educators, Students)

The web interface allows educators to create and schedule events for their course such as an upcoming workshop. An educator will add a title, a description, event runtime, and host information for the event. Students will see the scheduled events and their details. Event information is stored as data records in Amazon DynamoDB and accessed through an API which uses OpenID token authorization.

### Step 9) Start and join Amazon Chime SDK meeting experience (Educators, Students)

As soon as a scheduled event becomes current, the web interface renders a "Start meeting" button for educators, and "Join meeting" buttons for students. Clicking on these buttons call the Amazon Chime SDK meetings API. This step will initiate a new Amazon Chime SDK meeting experience. An OpenID token is used to secure access to Amazon Chime SDK meeting resources.

When new meetings are initiated the LTI tool securely stores event details like event title in Amazon S3 for analytical purposes.

### Step 10) Enter Amazon Chime SDK meeting experience (Educators, Students)

Educators and students who enter the newly created meeting by clicking on a "Join meeting" button are forwarded to the Amazon Chime SDK meeting experience in their web browser. A new browser tab opens up. The user successfully entered an Amazon Chime SDK meeting that was scheduled as an event for the course they're enrolled in the LMS.

### Step 11) Receive engagement events

While Amazon Chime SDK meeting experience is running, the [Amazon Chime SDK events](https://docs.aws.amazon.com/chime/latest/ag/automating-chime-with-cloudwatch-events.html#events-sdk) are sent to Amazon EventBridge e.g. when a meeting started or ended, an attendee joined, dropped or left, and when an attendee starts and stops sharing video. The LTI tool subscribes to relevant events in two ways as described in step 12 and 13.

### Step 12) Process engagement events

Amazon Chime SDK event messages are sent to a Amazon Kinesis Data Firehose to store raw event data in Amazon S3.

### Step 13) Query engagement events

Amazon Chime SDK event messages are also sent to Amazon SQS to trigger an AWS Lambda function execution. The AWS Lambda function starts an Amazon Athena query to aggregate raw Amazon Chime SDK events and augment with user information and event details. Amazon SQS is configured to deduplicate messages by meeting ID so that only one Amazon Athena query is executed per Amazon Chime SDK meeting which propagated user activity within a certain time interval.

### Step 14) Process and cache query results

An AWS Lambda function loads Amazon Athena query results into a Amazon DynamoDB table to cache aggegrated metrics per meeting. This AWS Lambda function is triggered by an Amazon SQS queue message containing an Amazon Athena query execution id. The Amazon SQS message was sent by the AWS Lambda function starting the Amazon Athena execution as described in step 13.

### Step 15) Read and display Amazon Chime SDK meeting experience engagement metrics

The web application reads from the cached results in Amazon DynamoDB and renders performance information about the Amazon Chime SDK meeting experience in the web browser. Educators can get insights into user activities in Amazon Chime SDK meetings in near realtime.
