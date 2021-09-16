# Create LTI-ready virtual classroom experiences with Amazon Chime SDK

Many educational institutions are shifting academic instruction to a virtual format and education technology (EdTech) companies use the cloud to create and scale remote learning solutions. A recent [study](https://www.insidehighered.com/news/2021/03/24/student-experiences-during-covid-and-campus-reopening-concerns) of 2,000 undergraduate students shows that, despite an eager sentiment to return to in-person classes, most students still want to keep aspects of remote learning — 79% want lectures made available online for review and nearly half want the option to toggle between in-person classes and online attendance. Customers told us that the biggest challenges they face are creating custom, engaging, and secure virtual classroom experiences for educators and students alike. They want these experiences to be intuitive and accessible from familiar systems to mitigate the risks of supporting and training on multiple applications. They also wanted to capture data and insights to measure efficacy and ultimately student success.  

In this post we show you how to create [Learning Tools Interoperability](https://www.imsglobal.org/activity/learning-tools-interoperability) (LTI)-ready virtual classroom experiences with the Amazon Chime SDK. Developed by the IMS Global Learning Consortium, the LTI specification prescribes an easy way to connect education applications and tools with platforms like learning management systems (LMS). The LTI-ready virtual classroom experience helps educators and students easily navigate to and participate in virtual classes without ever leaving the LMS or launching a third-party application – minimizing the need to learn a new system. We’ll also demonstrate how educators and administrators can benefit from visibility into class participation metrics. Whether you work in EdTech or higher education, the LTI-ready virtual classroom experience can help enhance your existing remote learning tools by offering customization, actionable insights, and integration into your LMS. 

The [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk/) is a set of real-time communications components that developers can use to quickly add messaging, audio, video, and screen sharing capabilities to their web or mobile applications. Developers can choose from these building blocks to create their own unique virtual classroom experiences. In this post, you will learn how to use [AWS Amplify](https://aws.amazon.com/amplify/), [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/) and [Learning Tools Interoperability (LTI)](https://www.imsglobal.org/activity/learning-tools-interoperability) to integrate Amazon Chime SDK with your LMS.


## How it works
Let's take a closer look at how this works and walk through the steps to launch an LTI-ready virtual classroom experience that educators and students can access from their LMS.

While there are no costs associated with LTI, deploying this demo and receiving traffic from the demo created in this post can incur AWS charges. We recommend creating a budget through AWS Cost Explorer to help manage costs. Prices are subject to change. For full details, refer to the pricing webpage for each AWS service used in this solution.

 
![Overview](lti-components/doc/chime-lti-architectural-overview.png)


## Solution overview

1.	**LMS system with the LTI plugin configured**: This is supported with the LTI Client API which provides endpoints to integrate as an LTI tool ([version 1.3](https://www.imsglobal.org/spec/lti/v1p3/#overview) or later)  in an LMS like Moodle, Canvas, or Blackboard. This API also issues web tokens and uses AWS Secrets Manager to store a secret key.

2.	**Events Management Center**: a React web application that educators will use to create and maintain events and for students to review these events. An event represents a scheduled Amazon Chime SDK meeting, e.g. a virtual classroom experience, with information like event title, date, time, and description. The web application is hosted in Amazon Simple Storage Service (S3), distributed via Amazon CloudFront, and also uses Amazon DynamoDB tables to store data. Additionally, the Events Management Center subscribes to user events in Amazon Chime SDK meetings (via [Amazon EventBridge](https://docs.aws.amazon.com/chime/latest/ag/automating-chime-with-cloudwatch-events.html#events-sdk)) and pulls in event data, e.g. meeting started, ended, attendee joined, left, started and stopped sharing screen, etc. The tool takes these events and augments them with relevant data like LTI user information and event details before aggregating metrics to present meaningful insight into Amazon Chime SDK meeting activities.

3.	**Events API**: a backend API for the web application which encapsulates persistence logic for events. Also, this API owns communication to the Amazon Chime SDK meetings API when initiating and joining Amazon Chime SDK meetings.

4.	**Amazon Chime SDK Meetings Experience**: where attendees can collaborate over audio/video and screen share. 



## Deploying and configuring the experience
To get started with deploying this experience in your AWS account, follow the steps outlined below, and the instructions set out within the GitHub repository.

 **Step 1**: Deploy the [LTI Client API, Events Center, and Events API](/lti-components/)

 **Step 2**: Deploy the [Amazon Chime SDK Meeting components](/chime-sdk-components)

 **Step 3**: Configure the [LTI plugin](/lti-components/web/README.md) in your LMS 


Here is a short [how-to video](https://youtu.be/CT6hyFC1Zds) that demonstrates the experience and setup. 


## Conclusion
In this post we covered how you can create LTI-ready virtual classroom experiences with the Amazon Chime SDK to help enable educators and students to participate and collaborate from their LMS. We want to hear more on features and capabilities that you would like to see in these virtual learning experiences, so please provide feedback in GitHub using the ‘Issues’ feature. As you explore more of this setup, consider the below additional resources to augment your implementation of the Amazon Chime SDK.

You can find more information and examples of customer stories on the [Amazon Chime SDK Website](https://aws.amazon.com/chime/chime-sdk/). For more details on the Amazon Chime SDK use cases in education, see Blackboard’s blog post entitled [The Virtual Classroom of the Future is Here](https://blog.blackboard.com/the-classroom-of-the-future-is-here/).

The [Amazon Chime SDK Features](https://aws.amazon.com/chime/chime-sdk/features/) page provides details on the workload types that can be integrated with an Amazon Chime SDK build to meet a variety of use cases. [Amazon Chime SDK Developer Resources](https://aws.amazon.com/chime/chime-sdk/resources/) provides additional documentation.

Visit the AWS Business Productivity Blog to stay updated on new Amazon Chime SDK native features such as [Amazon Chime SDK Media Capture](https://aws.amazon.com/blogs/business-productivity/capture-amazon-chime-sdk-meetings-using-media-capture-pipelines/) to enable meetinn capture capabilities or [Amazon Chime SDK Live Transcription](https://aws.amazon.com/about-aws/whats-new/2021/08/amazon-chime-sdk-amazon-transcribe-amazon-transcribe-medical/) for real-time transcription powered by Amazon Transcribe. The blog also features resources that support common use cases such as:

 - [Building Breakout Room Experience with the Amazon Chime SDK](https://aws.amazon.com/blogs/business-productivity/breakout-room-amazon-chime-sdk-react-component-library/)
 - [Build chat feature into your application with Amazon Chime SDK messaging](https://aws.amazon.com/blogs/business-productivity/build-chat-features-into-your-application-with-amazon-chime-sdk-messaging/)
 - [Automate Moderation and sentiment analysis with Amazon Chime SDK messaging](https://aws.amazon.com/blogs/business-productivity/automated-moderation-and-sentiment-analysis-with-amazon-chime-sdk-messaging/)
 - [Monitoring and troubleshooting with Amazon Chime SDK meeting events](https://aws.amazon.com/blogs/business-productivity/monitoring-and-troubleshooting-with-amazon-chime-sdk-meeting-events/)

Updated Developer Guides can be found [here](https://docs.aws.amazon.com/en_us/chime/latest/dg/mtgs-sdk-mtgs.html).

Amazon Chime SDK customers also have a unique opportunity to engage with like-minded builders or even directly with Amazon Chime SDK service specialists via Github:
 - [Amazon Chime SDK on GitHub](https://github.com/aws/amazon-chime-sdk-js)
 - [Amazon Chime React Component Library and integrations with the Amazon Chime SDK](https://github.com/aws/amazon-chime-sdk-component-library-react)
 - [Amazon Chime SDK FAQ](https://aws.github.io/amazon-chime-sdk-js/modules/faqs.html)
