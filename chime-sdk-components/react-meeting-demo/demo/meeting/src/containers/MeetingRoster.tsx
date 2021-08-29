// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, ChangeEvent } from 'react';
import {
  Roster,
  RosterHeader,
  RosterGroup,
  useRosterState,
  RosterAttendee,
  // PopOver,
  // PopOverHeader,
  // PopOverSeparator,
  PopOverItem,
  // PopOverSubMenu,
} from 'amazon-chime-sdk-component-library-react';

import { useNavigation } from '../providers/NavigationProvider';
import { useAppState } from '../providers/AppStateProvider';
import { useDataChannelState } from '../providers/DataChannelProvider';

const MeetingRoster = () => {
  const { roster } = useRosterState();
  const [filter, setFilter] = useState('');
  const { closeRoster } = useNavigation();
  const { participantInfo } = useAppState();
  const { chatData, sendChatData } = useDataChannelState();
  
  let attendees = Object.values(roster);

  if (filter) {
    attendees = attendees.filter((attendee: any) =>
      attendee?.name.toLowerCase().includes(filter.trim().toLowerCase())
    );
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  if(chatData) console.log("Chat Data set");

  const attendeeItems = attendees.map((attendee: any) => {
    const { chimeAttendeeId } = attendee || {};
    console.log("Chime Attendee Item: ", attendee)
    if(participantInfo?.Permissions?.CanPromote && (participantInfo?.AttendeeID?.AttendeeId !== chimeAttendeeId)) {
      return (
        <RosterAttendee key={chimeAttendeeId} attendeeId={chimeAttendeeId} menu={<PopOverItem
          as='button'
          onClick={() => { 
            console.log("PROMOTED...", chimeAttendeeId);
            sendChatData(chimeAttendeeId, attendee.ParticipantInfo.ParticipantID)
          }}
          children={<span>Promote</span>}
        />} />
      );
    }
    return (
      <RosterAttendee key={chimeAttendeeId} attendeeId={chimeAttendeeId} />
    );
    
  });

  return (
    <Roster className="roster">
      <RosterHeader
        searchValue={filter}
        onSearch={handleSearch}
        onClose={closeRoster}
        title="Present"
        badge={attendees.length}
      />
      <RosterGroup>{attendeeItems}</RosterGroup>
    </Roster>
  );
};

export default MeetingRoster;
