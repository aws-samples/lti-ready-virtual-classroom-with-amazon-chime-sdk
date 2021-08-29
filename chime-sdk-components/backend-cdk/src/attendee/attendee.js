var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;

const response = {
    statusCode: "",
    body: "",
    headers: {
        'Access-Control-Allow-Origin':'*',
        'Content-Type':'application/json'
    }                
};
       
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
    const body = JSON.parse(event.body)
    console.log(body)
    const eventStatus = JSON.parse(await getEvent(body.EventID))
    console.log(eventStatus)
    if (isEmpty(eventStatus)) {
        response.body = JSON.stringify("No EventID found.")
        response.statusCode = 404
        console.log(response)
        return response
    } 
    console.log("EventID Found.  Checking for Meeting Info")
    
    if (eventStatus.Item.meetingId === undefined) {
        response.body = "EventID found.  No Meeting Info Found"
        response.statusCode = 404
        console.log(response)
        return response
    }
    console.log("Event ID Found.  Meeting Info Found.  Checking for Participant")
    console.log("AttendeeID: ", body.AttendeeID)
    console.log("Participants: ", JSON.stringify(eventStatus.Item.participants, null, 2))
    for (var i in eventStatus.Item.participants) {
        console.log("Participant Info: ", eventStatus.Item.participants[i])
        if (eventStatus.Item.participants[i].attendeeInfo === undefined) {
            response.body = JSON.stringify("EventID found.  Participant List found. No Attendee Info found")
            response.statusCode = 404
            console.log(response)            
            return response
        } 

        if (eventStatus.Item.participants[i].attendeeInfo.AttendeeId === body.AttendeeID) {
            console.log ("Found EventId.  Found MeetingInfo.  Found AttendeeID.")
            response.body = JSON.stringify({
                "MeetingInfo" : eventStatus.Item.meetingId,
                "ParticipantInfo" : eventStatus.Item.participants[i],
                "EventInfo": eventStatus.Item.eventId,
                "MeetingTitle": eventStatus.Item.meetingTitle
            })
            response.statusCode = 200
            console.log(response)
            return response
        }
    }

    response.body = JSON.stringify("EventID found.  Participant List found. " + body.AttendeeID + " not found")
    response.statusCode = 404
    console.log(response)            
    return response
    
 };