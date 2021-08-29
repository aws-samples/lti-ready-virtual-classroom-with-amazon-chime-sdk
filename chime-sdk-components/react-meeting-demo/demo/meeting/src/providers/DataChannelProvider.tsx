import { ReactNode, useContext, useEffect, useState } from 'react';
import React from 'react';
import { DataMessage } from 'amazon-chime-sdk-js';
import { v4 } from 'uuid';
import { useAppState } from './AppStateProvider';
import { RealtimeData } from './DataChannelSubscribeProvider';
import { updateParticipant } from '../utils/api';
import {
  useAudioVideo
} from 'amazon-chime-sdk-component-library-react';

type Props = {
  children: ReactNode;
};

type DataMessageType = 'CHAT';

export interface DataChannelStateValue {
  chatData: RealtimeData[];
  sendChatData: (attendeeId: string, participantId: string) => void;
}

const DataChannelStateContext = React.createContext<DataChannelStateValue | null>(
  null
);

export const useDataChannelState = (): DataChannelStateValue => {
  const state = useContext(DataChannelStateContext);
  if (!state) {
    throw new Error('Error using DataChannel State in context!');
  }
  return state;
};

export const DataChannelStateProvider = ({ children }: Props) => {
  const audioVideo = useAudioVideo();
  const { participantInfo, eventId, token, refreshPermissions } = useAppState();
  const [chatData] = useState([] as RealtimeData[]);

  const sendChatData = async (receivingAttendeeId: string, receivingParticipantId: string) => {
    
    //update receiving attendee role in Database
    const updateResponse = await updateParticipant(
        eventId,
        receivingParticipantId,
        token
      );
    console.log('Update attendee response is', updateResponse);

    const mess: RealtimeData = {
      uuid: v4(),
      action: 'sendmessage',
      cmd: 'TEXT',
      data: receivingAttendeeId,
      createdDate: new Date().getTime(),
      senderName: participantInfo.ParticipantID
    };
    audioVideo!.realtimeSendDataMessage(
      'CHAT' as DataMessageType,
      JSON.stringify(mess)
    );
    // setChatData([...chatData, mess]);
  };

  const receiveChatData = async (mess: DataMessage) => {
    console.log('Data Channel Message received..');
    console.log(mess);
    // const senderId = mess.senderAttendeeId
    const data = JSON.parse(mess.text()) as RealtimeData;
    // data.senderId = senderId
    console.log(data);
    console.log(
      'Checking if participant ID is the same as sent data ',
      participantInfo.AttendeeID.AttendeeId,
      ' : ',
      data.data
    );
    console.log(participantInfo.AttendeeID.AttendeeId === data.data);
    //MAKE AN API CALL TO REFRESH STATE OF PARTICIPANT
    if(participantInfo.AttendeeID.AttendeeId === data.data){
        console.log(`Incoming request by meeting host/moderator: ${data.senderName} to upgrade your permissions - `);
        // TODO: Change to refresh status with a new function in app state provider
        // setRole('Moderator');
        alert('Fetching latest permissions!');
        refreshPermissions();
    }
  };

  useEffect(() => {
    console.log('data channel open...');
    audioVideo!.realtimeSubscribeToReceiveDataMessage(
      'CHAT' as DataMessageType,
      receiveChatData
    );
    return () => {
      console.log('data channel closed!');
      audioVideo!.realtimeUnsubscribeFromReceiveDataMessage(
        'CHAT' as DataMessageType
      );
    };
  });

  const providerValue = {
    chatData,
    sendChatData
  };
  return (
    <DataChannelStateContext.Provider value={providerValue}>
      {children}
    </DataChannelStateContext.Provider>
  );
};
