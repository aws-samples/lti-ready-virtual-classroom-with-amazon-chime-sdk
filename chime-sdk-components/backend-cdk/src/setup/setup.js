var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;
const roleTable = process.env.ROLE_TABLE_NAME;

function isEmppty (object) {
    return Object.keys(object).length === 0;
}

async function createEvent (setupRequest) {
    console.info(`Creating Event: ${setupRequest}`)    
    const participants = []
    
    for (var i in setupRequest.Participants) {
        console.log(setupRequest.Participants[i])
        
        var participantRole = setupRequest.Participants[i].RoleID || "User"
        var permissions = await getPermissions(participantRole)
        console.log(permissions)
        participants[i] = {
            "ParticipantID": (setupRequest.Participants[i].ParticipantID || "" ),
            "ParticipantName": (setupRequest.Participants[i].ParticipantName || ""),
            "RoleID": (setupRequest.Participants[i].RoleID || "User"),
            "Permissions" : permissions.Item.Permissions,
        }
    }
    
    var params = {
        TableName: meetingsTable,
        Item: {
            "eventId": setupRequest.EventID,
            "participants": participants,
            "meetingStatus": "Scheduled",
            "meetingTitle": setupRequest.Title
        }
    }
    
    try {
        await docClient.put(params).promise()
    } catch (err) {
        throw new Error(`Could not get put params (${err.name}: ${err.message})`)
    }
    return null
}

async function getPermissions (role) {
    console.info(`Getting Permissions ${role}`)
    var params = {
        TableName: roleTable,
        Key: {
            RoleId: role
        }
    };

    try {
        const response = await docClient.get(params).promise()
        return response
    } catch (err){
        throw new Error(`Could not get Permissions (${err.name}: ${err.message})`)
    }
}

async function getEvent (eventId) {
    console.info(`Getting Event Id ${eventId}`)
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
        throw new Error(`Could not get Event Id (${err.name}: ${err.message})`)
    }
}

exports.handler = async (event) => {
    // console.log(event)
    const body = JSON.parse(event.body)

    const [ eventID ] = event.path.split(`/`).filter(Boolean).slice(-1);
    console.info(`Event ID: ${eventID}`);

    const setupRequest = {
        "EventID": eventID,
        "Title": body.Title,
        "Participants": body.Participants
    }
    
    const eventStatus = await getEvent(eventID)
    console.info(`Event Status: ${eventStatus}`)
    if (isEmppty(eventStatus)) {
        const eventResponse = "No EventID found.  Creating EventID"
        console.info(`Event response: ${eventResponse}`);
        const createResponse = await createEvent(setupRequest)
        console.log('createResponse: ', createResponse)
        const response = {
            statusCode: 200,
            body: JSON.stringify("Create Successful"),
                headers: {
                    'Access-Control-Allow-Origin':'*',
                    'Content-Type':'application/json'
                }
        };
        return response
        
    } else {
        const eventResponse = "EventID found.  Not creating EventID"
        console.info(`Event Response: ${eventResponse}`)
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
};
