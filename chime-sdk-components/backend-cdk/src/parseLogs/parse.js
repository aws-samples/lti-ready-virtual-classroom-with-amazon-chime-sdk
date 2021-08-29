var AWS = require("aws-sdk");

const participantTable = process.env.PARTICIPANT_TABLE_NAME;
const docClient = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();
var participantId;

async function getParticipantId(externalUserId) {
    var params = {
        TableName: participantTable,
        Key: {
            "externalUserId": externalUserId
        }
    };

    try {
        const { Item } = await docClient.get(params).promise()
        participantId = Item["participantId"]
        return Item
    } catch (err) {
        return err
    }
}

exports.handler = async (event) => {
    console.log("Event received:\n", event)
    try {
        if (event.detail.externalUserId != undefined) {
            const eventResponse = await getParticipantId(event.detail.externalUserId)
            // Add participantId to event
            event["detail"]["participantId"] = participantId
            var params = {
                Entries: [
                    {
                        Detail: JSON.stringify(event['detail']),
                        DetailType: event['detail-type'],
                        EventBusName: process.env["CHIME_CUSTOM_EVENT_BUS_NAME"],
                        Resources: event['resources'],
                        Source: process.env["CHIME_CUSTOM_EVENT_SOURCE_NAME"],
                        Time: event['time'],
                    }
                ]
            };
            // Add modified event to EventBridge
            var eb_resp = await eventBridge.putEvents(params).promise();
            console.log("EventBridge response is \n", eb_resp)
            return JSON.stringify(eventResponse)
        } else {
            const eventResponse = "externalUserId not found, not augmenting this event"
            return JSON.stringify(eventResponse)
        }
    } catch (err) {
        return {
            statusCode: 400,
            body: `An error occurred: ${err}`,
        };
    }
}