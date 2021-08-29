var AWS = require("aws-sdk");
const chime = new AWS.Chime({ region: 'us-east-1' });
AWS.config.update({region: "us-east-1"});
var docClient = new AWS.DynamoDB.DocumentClient();
const {"v4": uuidv4} = require('uuid');
const axios = require('axios');
var ttlDate = new Date();


const meetingsTable = process.env.MEETINGS_TABLE_NAME;
const roleTable = process.env.ROLE_TABLE_NAME;
const participantTable = process.env.PARTICIPANT_TABLE_NAME;
var meetingInfo = {}

ttlDate.setDate(ttlDate.getDate() + 1);


const response = {
    statusCode: "",
    body: "",
    headers: {
            'Access-Control-Allow-Origin':'*',
            'Content-Type':'application/json'
        }
};

async function updateEvent(meetingInfo) {
    console.log("Updating Event Info")
    console.log("TTL: " + ttlDate.valueOf())
    var params = {
        TableName: meetingsTable,
        Key: {
            "eventId": meetingInfo.eventID,
        },
        UpdateExpression: "set meetingId = :m, participants = :p, attendees = :a, meetingStatus = :s, #TTLDate = :t",
        ExpressionAttributeNames: {"#TTLDate" : "TTL"},
        ExpressionAttributeValues:{
            ":m": meetingInfo.meetingID,
            ":a": meetingInfo.attendees,
            ":p": meetingInfo.participants,
            ":s": 'Active',
            ":t": ttlDate.valueOf()
        }
    }
    console.log(params)
    try {
        const response = await docClient.update(params).promise()
        console.log("UPDATE EVENT DDB UPDATE REPONSE:", response)
    } catch (err) {
        console.log("Error updating")
        console.log(err)
    }
}

async function updateParticipantTable(meetingInfo) {
    console.log("Updating Participant Info")
    var params = {
        TableName: participantTable,
        Key: {
            "externalUserId": meetingInfo.participant.attendeeInfo.ExternalUserId,
        },
        UpdateExpression: "set participantId = :p, #TTLDate = :t",
        ExpressionAttributeNames: { "#TTLDate" : "TTL" },        
        ExpressionAttributeValues:{
            ":p": meetingInfo.participant.ParticipantID,
            ":t": ttlDate.valueOf()
        }
    }
    console.log(params)
    try {
        const response = await docClient.update(params).promise()
        console.log("UPDATE EVENT DDB UPDATE REPONSE:", response)
    } catch (err) {
        console.log("Error updating")
        console.log(err)
    }
}

async function createAttendees(meetingInfo) {
    const attendeeRequest = []

    for (var x = 0; x < 5;  x++) {
        attendeeRequest.push({
            "ExternalUserId": uuidv4()
        })
    }
    
    console.log(attendeeRequest)
    
    console.info('Adding batch attendees');
    const attendees = (await chime.batchCreateAttendee({
      MeetingId: meetingInfo.meetingID.Meeting.MeetingId,
      Attendees: attendeeRequest,
    }).promise());
    return attendees
}

async function assignAttendee(meetingInfo) {
    console.log("Assinging Attendee: ", JSON.stringify(meetingInfo, null, 3));
    
    if (meetingInfo.eventStatus.attendees === null || meetingInfo.eventStatus.attendees.Attendees.length === 0) {
        meetingInfo.eventStatus.attendees = await createAttendees(meetingInfo)
    }
    
    meetingInfo.participant.attendeeInfo = meetingInfo.eventStatus.attendees.Attendees.pop();
    if (meetingInfo.eventStatus.participants === undefined || meetingInfo.eventStatus.participants === null) {
        meetingInfo.participants = [meetingInfo.participant];
    } else {
        meetingInfo.eventStatus.participants.forEach((id, index) => {
            if (meetingInfo.eventStatus.participants[index].ParticipantID === meetingInfo.participant.ParticipantID) {
                meetingInfo.eventStatus.participants.splice(index, 1)
            }
        })
        meetingInfo.participants = meetingInfo.eventStatus.participants
        meetingInfo.participants.push(meetingInfo.participant);
    }
    meetingInfo.attendees = meetingInfo.eventStatus.attendees

    return meetingInfo;
}


async function createMeeting(meetingInfo) {
    console.log("Creating MeetingID")

    const meetingRequest = {
      ClientRequestToken: meetingInfo.eventID,
      MediaRegion: 'us-east-1',
      ExternalMeetingId: meetingInfo.eventID,
    };
    
    console.log("meetingRequest params: ", meetingRequest)
    meetingInfo.meetingID = await chime.createMeeting(meetingRequest).promise();
    console.log("meetingID: ", JSON.stringify(meetingInfo.MeetingID, null, 2))
    meetingInfo.eventStatus.attendees = await createAttendees(meetingInfo)
    console.log("attendees: ", JSON.stringify(meetingInfo.eventStatus.attendees, null, 2))

    console.log(JSON.stringify(meetingInfo, null, 3))
    return meetingInfo
}

async function setupEvent (meetingInfo) {
    console.log("Setting Up EventID")

    try {
        const setupReponse = await axios({
            url: meetingInfo.URL + meetingInfo.eventID,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer' + " " + meetingInfo.bearerToken,
                'Accept': '*/*'
            },
            data: {
                'Title': ''
            }
        });
        console.log('setupResponse: ', setupReponse.status)
        return setupReponse.status
    } catch (err) {
        console.log('setupResponse: ', err.response)
        return (err)
    }
}

// function isEmppty (object) {
//     return Object.keys(object).length === 0;
// }

async function getEvent (eventId) {
    var params = {
        TableName: meetingsTable,
        Key:{
            "eventId": eventId
        }
    };
    
    try {
        const { Item } = await docClient.get(params).promise()
        console.log("REPONSE FROM DDB IS ", Item)
        return Item
    } catch (err){
        return err
    }
}

exports.handler = async (event) => {
    
    console.log(JSON.stringify(event, 2))
    var responseMessage = {};
    meetingInfo.URL = 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage + '/setup/'
    meetingInfo.eventID = event.path.split(`/`).filter(Boolean).slice(-1)[0];
    meetingInfo.eventStatus = await getEvent(meetingInfo.eventID)
    meetingInfo.bearerToken = event.headers.Authorization.split(' ')[1]
    meetingInfo.participant = {
        'ParticipantID': event.requestContext.authorizer.participantID,
        'ParticipantName': event.requestContext.authorizer.participantName,
        'ParticipantRole': event.requestContext.authorizer.participantRole,
    } 
    console.log("Constructed meeting info:\n")
    console.log(JSON.stringify(meetingInfo, null, 3))
    
    // CHECK IF EVENT IS CREATED, OR ELSE SETUP A NEW EVENT (Won't be used for current demo app, since setup is called separately)
    if (meetingInfo.eventStatus === undefined) {
        console.log("No EventID found. Creating EventID")
        var setupResponse = await setupEvent(meetingInfo)
        meetingInfo.eventStatus = {
            "eventId": meetingInfo.eventID,
            "meetingStatus": "Scheduled",
            "participants": [],
            "meetingTitle": ""
        }
        console.log("Creating Meeting")
        meetingInfo = await createMeeting(meetingInfo)
    } else 
    // IF EVENT IS CREATED, CHECK IF MEETING IS CREATED, OR ELSE CREATE ONE
    {
        console.log("EventID found.  Not creating EventID")
        meetingInfo.attendeeInfo = meetingInfo.eventStatus.attendees
        meetingInfo.meetingID = meetingInfo.eventStatus.meetingId
        // IF MEETING IS NOT CREATED, CREATE ONE, AND ASSIGN ATTENDEE
        if (meetingInfo.eventStatus.meetingId === undefined || meetingInfo.eventStatus.meetingId === null) {
            console.log("No MeetingID found.  Creating meetingId")
            meetingInfo = await createMeeting(meetingInfo)
            await assignAttendee(meetingInfo)
            await updateEvent(meetingInfo)
            await updateParticipantTable(meetingInfo)
            console.log('Meeting created - attendee assigned, dynamodb updated ', JSON.stringify(meetingInfo, null, 3))
        } 
        // IF MEETING ALREADY EXISTS, CHECK IF PARTICIPANT IS ALREADY ASSIGNED AN ATTENDEE OR NOT
        else {
            var participantExists = false
            for ( let participant in meetingInfo.eventStatus.participants){
                if (meetingInfo.eventStatus.participants[participant].ParticipantID === meetingInfo.participant.ParticipantID) {
                    participantExists = true
                    //Ensure that the existing attendee Info is assigned to the participant
                    meetingInfo.participant.attendeeInfo = meetingInfo.eventStatus.participants[participant].attendeeInfo
                }
            }
            console.log("Participant exists?:",participantExists)
            if(!participantExists) {
                await assignAttendee(meetingInfo)
                await updateEvent(meetingInfo)
                await updateParticipantTable(meetingInfo)
            }
        }
    }
    console.log("Join complete!")
    response.statusCode = '200'
    responseMessage = {
        "Status": "Join Complete",
        "participantId" : meetingInfo.participant.ParticipantID,
        "externalUserId": meetingInfo.participant.attendeeInfo.ExternalUserId
    }
    response.body = JSON.stringify(responseMessage)

    return response
    
};