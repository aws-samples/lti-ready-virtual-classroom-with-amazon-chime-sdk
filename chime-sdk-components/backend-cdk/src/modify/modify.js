var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();
const meetingsTable = process.env.MEETINGS_TABLE_NAME;
const roleTable = process.env.ROLE_TABLE_NAME;

function isEmpty (object) {
    return Object.keys(object).length === 0;
}


async function getPermissions (role) {
    var params = {
        TableName: roleTable,
        Key: {
            RoleId: role
        }
    };


    try {
        const response = await docClient.get(params).promise()
        console.log("In Try")
        return response
    } catch (err){
        console.log("In error")
        return err
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
        console.log(response)
        return response
    } catch (err){
        console.log("In error")
        return err
    }
}

async function updateUser (eventStatus) {
    console.log('Updating User')
    console.log(eventStatus)
    var params = {
        TableName: meetingsTable,
        Key: {
            "eventId": eventStatus.Item.eventId
        },
        UpdateExpression: "set meetingId = :m, participants = :p, attendees = :a",
        ExpressionAttributeValues: {
            ":m": eventStatus.Item.meetingId,
            ":a": eventStatus.Item.attendees,
            ":p": eventStatus.Item.participants,
        }        
    };
    
    try {
        console.log("in try")
        const response = await docClient.update(params).promise()
        console.log("after update")
        return response
    } catch (err) {
        console.log("Error updating")
        console.log(err)
    }
}

exports.handler = async (event) => {
    console.log(event)
    const body = JSON.parse(event.body)
    console.log(body)

    const eventStatus = await getEvent(body.EventID)
    console.log(eventStatus)
    if (isEmpty(eventStatus)) {
        const eventResponse = "No EventID found."
        console.log(eventResponse)
        const response = {
            statusCode: 404,
            body: JSON.stringify(eventResponse),
        };
        return response
    } 
    console.log("EventID Found.  Updating User")
    
    for (var x in eventStatus.Item.participants) {
        console.log(eventStatus.Item.participants[x])
        console.log(body.ParticipantInfo)
        if (eventStatus.Item.participants[x].ParticipantID === body.ParticipantInfo.ParticipantID) {
            var permissions = {}
            if (body.ParticipantInfo.RoleID) {
                console.log("found Role Id")
                permissions = await getPermissions(body.ParticipantInfo.RoleID)
                console.log(permissions)
            } else {
                console.log("didn't find Role.")
                 permissions = (body.ParticipantInfo.Permissions) || eventStatus.Item.participants[x].Permissions
                 console.log(permissions)
            }
            
            eventStatus.Item.participants[x] = {
                ParticipantID: eventStatus.Item.participants[x].ParticipantID,
                Permissions: permissions.Item.Permissions,
                ParticipantName: (body.ParticipantInfo.ParticipantName) || eventStatus.Item.participants[x].ParticipantName,
                RoleID: (body.ParticipantInfo.RoleID) || eventStatus.Item.participants[x].RoleID,
                AttendeeID: eventStatus.Item.participants[x].AttendeeID
            }
            console.log(eventStatus.Item.participants[x])

            await updateUser(eventStatus)
            const updatedStatus = await getEvent(body.EventID)
            
            const response = {
                statusCode: 200,
                headers: {
                        'Content-Type':'application/json'
                },
                body: JSON.stringify(updatedStatus.Item.participants[x]),
            };
            return response
        }
    }


};