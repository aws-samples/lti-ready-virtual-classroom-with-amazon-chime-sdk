var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;


function isEmpty (object) {
    return Object.keys(object).length === 0;
}

async function getEvent (eventId) {
    console.log("Getting event from DDB for eventId", eventId)
    var params = {
        TableName: meetingsTable,
        Key:{
            "eventId": eventId
        }
    };
    
    try {
        const response = JSON.stringify(await docClient.get(params).promise())
        console.log(response)
        return response
    } catch (err){
        console.log("In error")
        return err
    }
}

exports.handler = async (event) => {
    console.log(event)
    const body = JSON.parse(event.body)
    console.log(body)

    const eventStatus = JSON.parse(await getEvent(body.EventID))
    console.log(eventStatus)
    if (isEmpty(eventStatus)) {
        const eventResponse = "No EventID found."
        console.log(eventResponse)
        const response = {
            statusCode: 404,
            body: JSON.stringify(eventResponse),
            headers: {
                        'Access-Control-Allow-Origin':'*',
                        'Content-Type':'application/json'
                    }
        };
        return response
    } 
    console.log("EventID Found.  Checking for Meeting Info")
    
    if (eventStatus.Item.meetingId === undefined) {
        const eventResponse = "EventID found.  No Meeting Info Found"
        console.log(eventResponse)
        const response = {
            statusCode: 404,
            body: JSON.stringify(eventResponse),
            headers: {
                        'Access-Control-Allow-Origin':'*',
                        'Content-Type':'application/json'
                    }
        };
        return response
    }
    console.log("Event ID Found.  Meeting Info Found.  Checking for Participant")
    
    for (var i in eventStatus.Item.participants) {
        console.log(eventStatus.Item.participants[i].ParticipantID)
        if (eventStatus.Item.participants[i].ParticipantID === body.ParticipantID) {
            console.log("Participant ID found: ", eventStatus.Item.participants[i].ParticipantID)
            console.log("AttendeeID: ", eventStatus.Item.participants[i].attendeeInfo)
            if (eventStatus.Item.participants[i].attendeeInfo === undefined) {
                const eventResponse = "EventID found.  Participant List found. " + body.ParticipantID + "  found.  No Attendee Info found"
                console.log(eventResponse)
                const response = {
                    statusCode: 404,
                    body: JSON.stringify(eventResponse),
                    headers: {
                        'Access-Control-Allow-Origin':'*',
                        'Content-Type':'application/json'
                    }
                };
                return response
            } else {
                console.log ("Found EventId.  Found MeetingInfo.  Found Participant.  Found AttendeeInfo")
                const eventResponse = {
                    "MeetingInfo" : eventStatus.Item.meetingId,
                    "ParticipantInfo" : eventStatus.Item.participants[i],
                    "EventInfo": eventStatus.Item.eventId,
                    "MeetingTitle": eventStatus.Item.meetingTitle
                }
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(eventResponse),
                    headers: {
                        'Access-Control-Allow-Origin':'*',
                        'Content-Type':'application/json'
                    }
                };
                return response
            }
        }
    }     
    
    const eventResponse = "EventID found.  Participant List found. " + body.ParticipantID + " not found."
    console.log(eventResponse)
    const response = {
        statusCode: 404,
        body: JSON.stringify(eventResponse),
        headers: {
            'Access-Control-Allow-Origin':'*'
        }
    };
    return response

};