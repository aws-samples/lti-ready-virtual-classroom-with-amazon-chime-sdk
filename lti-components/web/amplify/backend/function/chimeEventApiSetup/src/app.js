/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const AWS = require('aws-sdk')
const S3 = new AWS.S3()
const moment = require('moment');

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const fetch = require('node-fetch');

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

const FETCH_REQUEST = (headers = {}, body = {}) => {
  const request = {
    method: `POST`,
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      Accept: `application/json`,
      [`Content-Type`]: `application/json`,
      ...headers
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(body)
  };
  return request;
}

app.post('/setup/:platformId/:eventGroupId/:eventId', function (req, res) {
  const event = req.apiGateway.event;
  const authorizerContext = event.requestContext.authorizer || {};
  const eventData = req.body || {};

  const eventRecord = {
    externalEventId: `${req.params.eventId}-${req.params.eventGroupId}`,
    eventId: req.params.eventId,
    eventGroupId: req.params.eventGroupId,
    eventGroupExternalId: authorizerContext.contextExternalId,
    eventGroupExternalTitle: authorizerContext.contextTitle,
    platformId: authorizerContext.platformId,
    scheduledAt: moment(eventData.attributes.date).format(`YYYY-MM-DDTHH:mm:ss[Z]`),
    scheduledDuration: eventData.attributes.duration,
    hostInfo: eventData.attributes.hosts,
    hostUserId: authorizerContext.userID,
    hostUserName: authorizerContext.userName,
    title: eventData.attributes.title,
    detail: eventData.attributes.detail,
  };

  const payload = {
    Title: eventRecord.title,
    Participants: [
      {
        ParticipantID: eventRecord.hostUserId,
        ParticipantName: eventRecord.hostUserName,
        RoleID: `Host`
      }
    ]
  };

  const targetUrl = `${authorizerContext.chimeMeetingApiUrl}/setup/${eventRecord.externalEventId}`;

  //console.log(`Request payload: ${JSON.stringify(payload)}`);

  fetch(targetUrl, FETCH_REQUEST({ Authorization: event.headers.Authorization }, payload)).then(response => {
    const responsePayload = response.json();
    if (!response.ok) {
      console.error(`Error returned from Chime API. Did not setup meeting.`);
      console.error(response.status);
      console.error(JSON.stringify(responsePayload, null, 2));
      response.headers.forEach((header) => console.log(JSON.stringify(header, null, 2)));
    } else {
      return S3.putObject({
        Body: JSON.stringify(eventRecord),
        Bucket: process.env.ANALYTICS_BUCKET_NAME,
        Key: `${process.env.ANALYTICS_BUCKET_EVENTS_FOLDER}/${eventRecord.eventGroupId}/${eventRecord.eventId}.json`
      }).promise().catch((e) => {
        // fail gracefully as this is a non-critical operation
        console.warn(`Failed to write data for event with id: '${eventRecord.externalEventId}' to S3 (Reason: ${e.message})`);
      }).then(() => {
        res.status(response.status).json({ ok: response.ok, status: response.status, payload: responsePayload });
      });
    }
  });
});

app.listen(3000, function () {
  console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
