var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;


function isEmppty (object) {
    return Object.keys(object).length === 0;
}

async function getEvent (eventId) {
    console.log(`Getting Event: ${eventId}`)
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
        console.log(err)
        return err
    }
}

exports.handler = async (event) => {
    console.log(JSON.stringify(event, 2))

    const [ eventID ] = event.path.split(`/`).filter(Boolean).slice(-1);
    console.info(`Event ID: ${eventID}`);
    
    var participants = []
    const eventStatus = await getEvent(eventID)
    console.log(eventStatus)
    if (isEmppty(eventStatus)) {
        const eventResponse = "No EventID found."
        console.log(eventResponse)
        const response = {
            statusCode: 200,
            body: JSON.stringify("EventID not found"),
        };
        return response
        
    } else {
        for (var x in eventStatus.Item.participants) {
            participants.push({
                ParticipantID: eventStatus.Item.participants[x].ParticipantID,
                ParticipantName:eventStatus.Item.participants[x].ParticipantName,
                RoleID: eventStatus.Item.participants[x].RoleID,
                Permissions: eventStatus.Item.participants[x].Permissions
            })
        }
        const queryResponse = {
            EventID: eventStatus.Item.eventId,
            Title: eventStatus.Item.meetingTitle,
            Status: eventStatus.Item.meetingStatus,
            Participants: participants
        }
        
        
        const response = {
            statusCode: 200,
            body: JSON.stringify(queryResponse),
            headers: {
                        'Access-Control-Allow-Origin':'*',
                        'Content-Type':'application/json'
                    }            
        };
        return response
    }
    
};