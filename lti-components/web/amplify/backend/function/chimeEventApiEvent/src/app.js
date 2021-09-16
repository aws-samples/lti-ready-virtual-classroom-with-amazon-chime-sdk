// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/*
function for maintaining scheduled events
*/

const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')
const fetch = require('node-fetch');

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "chimeEvents";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "eventGroupId";
const partitionKeyType = "S";
const sortKeyName = "eventId";
const sortKeyType = "S";
const hasSortKey = sortKeyName !== "";
const path = "/events/:platformId";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
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

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch (type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}

// query Chime meeting API for additional event info
const queryMeeting = (req) => {
  const event = req.apiGateway.event;

  const authorizerContext = event.requestContext.authorizer || {};
  const externalEventId = `${req.params.eventId}-${req.params.eventGroupId}`;
  const targetUrl = `${authorizerContext.chimeMeetingApiUrl}/query/${externalEventId}`;

  const fetchRequest = {
    method: `POST`,
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      Accept: `application/json`,
      [`Content-Type`]: `application/json`,
      Authorization: event.headers.Authorization
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: {}
  };

  return fetch(targetUrl, fetchRequest).then(response => {
    const responsePayload = response.json();
    if (!response.ok) {
      console.error(`Error returned from Chime API. Could not join meeting.`);
      console.error(response.status);
      console.error(JSON.stringify(responsePayload, null, 2));
      response.headers.forEach((header) => console.log(JSON.stringify(header, null, 2)));
    }
    return responsePayload;
  });
};

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + hashKeyPath, function (req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [convertUrlType(req.params[partitionKeyName], partitionKeyType)];
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: 'Wrong column type ' + err });
    }
  }

  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  }

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({ error: 'Could not load items: ' + err });
    } else {
      res.json(data.Items);
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get(path + hashKeyPath + sortKeyPath, function (req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: 'Wrong column type ' + err });
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: 'Wrong column type ' + err });
    }
  }

  Promise.all([
    dynamodb.get({ TableName: tableName, Key: params }).promise(),
    dynamodb.get({ TableName: process.env.METRICS_TABLE_NAME, Key: params }).promise(),
    queryMeeting(req).catch(err => {
      // gracefully fail as getting realtime info from meetings for now is considered non-critical
      console.error(`Failed to query meeting info for event. Fail gracefully and return event info without meeting info. (Reason: ${err.message})`);
      return {};
    })
  ]).then((data) => {
    if (data[0].Item) {
      res.json({
        ...data[0].Item,
        meetingMetrics: data[1].Item || {},
        meetingInfo: data[2] || {}
      });
    } else {
      throw new Error(`Did not find event record in DynamoDB.`)
    }
  }).catch((err) => {
    res.statusCode = 500;
    res.json({ error: `Error reading event data. (Reason: ${err.message}` });
  });
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path + hashKeyPath, function (req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  // check if eventGroupId in URL matches eventGroupId in the body
  if (req.params[partitionKeyName] !== req.body[partitionKeyName]) {
    res.statusCode = 403;
    res.json({ error: `Partition key ('${req.body[partitionKeyName]}') in body does not match authorized key in URL ('${req.params[partitionKeyName]}'). `, url: req.url, body: req.body });
  } else {
    let putItemParams = {
      TableName: tableName,
      Item: req.body
    }
    dynamodb.put(putItemParams, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.json({ error: err, url: req.url, body: req.body });
      } else {
        res.json({ success: 'put call succeed!', url: req.url, data: data })
      }
    });
  }
});

/************************************
* HTTP post method for insert object *
*************************************/

app.post(path + hashKeyPath + sortKeyPath, function (req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  // check if eventGroupId and eventId in URL matches eventGroupId in the body
  if (req.params[partitionKeyName] !== req.body[partitionKeyName] || req.params[sortKeyName] !== req.body[sortKeyName]) {
    res.statusCode = 403;
    res.json({ error: `Partition key ('${req.body[partitionKeyName]}') in body does not match authorized key in URL ('${req.params[partitionKeyName]}'). `, url: req.url, body: req.body });
  } else {
    let putItemParams = {
      TableName: tableName,
      Item: req.body
    }
    dynamodb.put(putItemParams, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.json({ error: err, url: req.url, body: req.body });
      } else {
        res.json({ success: 'post call succeed!', url: req.url, data: data })
      }
    });
  }
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete(path + hashKeyPath + sortKeyPath, function (req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: 'Wrong column type ' + err });
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: 'Wrong column type ' + err });
    }
  }

  let removeItemParams = {
    TableName: tableName,
    Key: params
  }
  dynamodb.delete(removeItemParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({ error: err, url: req.url });
    } else {
      res.json({ url: req.url, data: data });
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
