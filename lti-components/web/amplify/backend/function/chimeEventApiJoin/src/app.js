// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/*
function for joining a Amazon Chime SDK meeting
*/

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

app.post('/join/:platformId/:eventGroupId/:eventId', function (req, res) {
  const event = req.apiGateway.event;
  const authorizerContext = event.requestContext.authorizer || {};
  const payload = {
    ParticipantID: authorizerContext.userID,
    ParticipantName: authorizerContext.userName
  };

  const eventId = `${req.params.eventId}-${req.params.eventGroupId}`;
  const targetUrl = `${authorizerContext.chimeMeetingApiUrl}/join/${eventId}`;

  //console.log(`Request payload: ${JSON.stringify(payload)}`);

  fetch(targetUrl, FETCH_REQUEST({ Authorization: event.headers.Authorization }, payload)).then(response => {
    const responsePayload = response.json();
    if (!response.ok) {
      console.error(`Error returned from Chime API. Could not join meeting.`);
      console.error(response.status);
      console.error(JSON.stringify(responsePayload, null, 2));
      response.headers.forEach((header) => console.log(JSON.stringify(header, null, 2)));
    }
    res.status(response.status).json({ ok: response.ok, status: response.status, payload: responsePayload });
  });
});

app.listen(3000, function () {
  console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
