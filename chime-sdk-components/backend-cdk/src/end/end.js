var AWS = require("aws-sdk");
const chime = new AWS.Chime({ region: 'us-east-1' });
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;
const roleTable = process.env.ROLE_TABLE_NAME;

function isEmppty (object) {
    return Object.keys(object).length === 0;
}

async function deleteEvent (eventStatus) {
    const deleteRequest = {
        MeetingId: eventStatus.Item.meetingId.Meeting.MeetingId
    }

    console.log(deleteRequest)
    const meetingDelete = await chime.deleteMeeting(deleteRequest).promise();
}
    

async function cleanupDatabase (eventStatus) {
    var params = {
        TableName: meetingsTable,
        Key: {
            "eventId": eventStatus.Item.eventId,
        },
        UpdateExpression: "set meetingId = :m, participants = :p, attendees = :a, meetingStatus = :s, meetingTitle = :t",
        ExpressionAttributeValues:{
            ":m": null,
            ":a": null,
            ":p": null,
            ":s": 'Ended',
            ":t": null,
        }
    }
    console.log(params)
    try {
        const response = await docClient.update(params).promise()
        console.log(response)
    } catch (err) {
        console.log("Error updating")
        console.log(err)
    }
}


async function getEvent (eventId) {
    console.log(eventId)
    var params = {
        TableName: meetingsTable,
        Key:{
            "eventId": eventId
        }
    };
    
    try {
        const response = await docClient.get(params).promise()
        return response
    } catch (err){
        console.log("In error")
        return err
    }
}

exports.handler = async (event) => {
    console.log(event)

    if (event.detail !== undefined) {
        console.log("eventType found")
        const eventStatus = await getEvent(event.detail.externalMeetingId)
        if (eventStatus.Item.meetingId === '' || eventStatus.Item.meetingId === undefined || eventStatus.Item.meetingId === null)  {
            console.log("Nothing to clean up.")
            return
        } else {
            await cleanupDatabase(eventStatus)
            const eventResponse = "Event ended by timeout.  Cleaning up database"
            console.log(eventResponse)
            const response = {
                statusCode: 200,
                body: JSON.stringify(eventResponse)
            }
            return response
        }
    } else {
        const body = JSON.parse(event.body)
        console.log(body)
        console.log("event type not found")
        const eventStatus = await getEvent(body.EventID)
        console.log(eventStatus)
        if (isEmppty(eventStatus)) {
            const eventResponse = "No EventID found."
            console.log(eventResponse)
            const response = {
                statusCode: 404,
                body: JSON.stringify(eventResponse),
            };
            return response
        }
        console.log(eventStatus.Item.meetingId)
        if (eventStatus.Item.meetingId === '' || eventStatus.Item.meetingId === undefined || eventStatus.Item.meetingId === null)  {
            const eventResponse = "Event ID found.  No Meeting Info found."
            const response = {
                statusCode: 404,
                body: JSON.stringify(eventResponse)
            }
            return response
        } else {
            const eventResponse = "EventID found. Deleting Meeting Info"
            console.log(eventResponse)
            await deleteEvent(eventStatus)
            await cleanupDatabase(eventStatus)
            const response = {
                statusCode: 200,
                body: JSON.stringify(eventResponse),
            };
            return response
        }
    }    
};
