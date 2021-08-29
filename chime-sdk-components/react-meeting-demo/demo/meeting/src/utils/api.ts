// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// import routes from '../constants/routes';
import { API_URL } from '../constants';

export const BASE_URL = API_URL;
//routes.HOME;

interface MeetingResponse {
  MeetingInfo: any,
  ParticipantInfo: any,
  EventInfo:any,
  MeetingTitle:any
}

export async function fetchMeeting(
  eventId: string,
  participantId: string,
  token: string
): Promise<MeetingResponse> {
  const response = await fetch(
    `${BASE_URL}info/${eventId}`,
    {
      method: 'POST',
      headers:{"Authorization": token},
      body: JSON.stringify({"EventID":eventId, "ParticipantID":participantId})
    }
  );
  const data = await response.json();

  if (data.error) {
    throw new Error(`Server error: ${data.error}`);
  }

  return data;
}

export function createGetAttendeeCallback(eventId: string,token: string) {
  return async (chimeAttendeeId: string, externalUserId?: string) => {
    const response = await fetch(
      `${BASE_URL}attendee/${eventId}`,
      {
        method: 'POST',
        headers:{"Authorization": token},
        body: JSON.stringify({"EventID":eventId, "AttendeeID":chimeAttendeeId})
      }
    );
    const { ParticipantInfo, error } = await response.json();
    console.log("Found participant info: ", ParticipantInfo);
  
    if (error) {
      throw new Error(`Server error: ${error}`);
    }

    return {
      name: ParticipantInfo?.ParticipantName || chimeAttendeeId,
      ParticipantInfo
    };
  };
}

export async function updateParticipant(
  eventId: string,
  participantId: string,
  token: string
): Promise<any> {

  const body = {
                "EventID": eventId,
                "ParticipantInfo": {
                    "ParticipantID": participantId,
                    "Permissions": {
                        "CanDemote": true,
                        "CanPromote": true,
                        "CanEnd": true,
                        "CanVideo": true,
                        "CanUnmute": true,
                        "CanShare": true,
                        "CanKick": true
                    },
                    "RoleID": "Moderator"
                }
            }

  const response = await fetch(
    `${BASE_URL}modifyUser/${eventId}`,
    {
      method: 'POST',
      headers:{"Authorization": token},
      body: JSON.stringify(body)
    }
  );
  const data = await response.json();

  console.log("API RESPONSE IS ", data)

  if (data.error) {
    throw new Error(`Server error: ${data.error}`);
  }

  return data;
}

export async function endMeeting(eventId: string, token: string) {
  const response = await fetch(
    `${BASE_URL}end/${eventId}`,
    {
      method: 'POST',
      headers:{"Authorization": token},
      body: JSON.stringify({"EventID":eventId})
    }
  );
  const data = await response.json();

  console.log("End Meeting API response is ", data)

  if (!response.ok) {
    throw new Error('Server error ending meeting');
  }
}
