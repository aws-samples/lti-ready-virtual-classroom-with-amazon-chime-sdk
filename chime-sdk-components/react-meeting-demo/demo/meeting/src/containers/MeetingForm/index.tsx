// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import {
  //Input,
  Flex,
  Heading,
  //FormField,
  PrimaryButton,
  useMeetingManager,
  Modal,
  ModalBody,
  ModalHeader
} from 'amazon-chime-sdk-component-library-react';

import { getErrorContext } from '../../providers/ErrorProvider';
import routes from '../../constants/routes';
import Card from '../../components/Card';
import Spinner from '../../components/Spinner';
import DevicePermissionPrompt from '../DevicePermissionPrompt';
// import RegionSelection from './RegionSelection';
import { fetchMeeting, createGetAttendeeCallback } from '../../utils/api';
import { useAppState } from '../../providers/AppStateProvider';

const MeetingForm: React.FC = () => {
  const meetingManager = useMeetingManager();
  const {
    setAppMeetingInfo,
    setMeetingTitle,
    // region: appRegion,
    meetingId: appMeetingId,
    localUserName: appAttendeeName,
    eventId: appEventId,
    participantId: appParticipantId,
    token: appToken
  } = useAppState();
  const [meetingId, setMeetingId] = useState(appMeetingId);
  const [eventId, setEventId] = useState(appEventId);
  const [participantId, setParticipant] = useState(appParticipantId);
  const [token, setToken] = useState(appToken);
  // const [meetingErr, setMeetingErr] = useState(false);
  const [name, setName] = useState(appAttendeeName);;
  // const [nameErr, setNameErr] = useState(false);
  // const [region, setRegion] = useState(appRegion);
  const [isLoading, setIsLoading] = useState(false);
  const { errorMessage, updateErrorMessage } = useContext(getErrorContext());
  const history = useHistory();

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId || !participantId) {
      if (!eventId) {
        console.log("No event Id found..")
        //setNameErr(true);
        updateErrorMessage("No event Id found..");
      }

      if (!participantId) {
        console.log("No participant Id found..")
        //setMeetingErr(true);
        updateErrorMessage("No participant Id found..");
      }

      if (!token) {
        console.log("No token found..")
        //setMeetingErr(true);
        updateErrorMessage("No token found..");
      }

      return;
    }

    setIsLoading(true);
    

    try {
      const { EventInfo, MeetingInfo, ParticipantInfo, MeetingTitle } = await fetchMeeting(eventId, participantId, token);
      meetingManager.getAttendee = await createGetAttendeeCallback(eventId, token);
      await meetingManager.join({
        meetingInfo: MeetingInfo.Meeting,
        attendeeInfo: ParticipantInfo.attendeeInfo
      });
      await setAppMeetingInfo(MeetingInfo.Meeting.MeetingId, name, MeetingInfo.Meeting.MediaRegion,EventInfo,ParticipantInfo.ParticipantID,ParticipantInfo.ParticipantRole, ParticipantInfo);
      await setName(ParticipantInfo.ParticipantName);
      await setMeetingTitle(MeetingTitle);
      history.push(routes.DEVICE);
    } catch (error) {
      updateErrorMessage(error.message);
    }
  };

  const closeError = (): void => {
    updateErrorMessage('');
    setMeetingId('');
    setEventId('');
    setParticipant('');
    setToken('');
    setIsLoading(false);
  };

  return (
    <form>
       <Heading tag="h1" level={4} css="margin-bottom: 1rem">
        LTI-ready virtual classroom experiences with Amazon Chime SDK
      </Heading>
      {/* <Heading tag="h1" level={4} css="margin-bottom: 1rem">
        Join a meeting
      </Heading>
      <FormField
        field={Input}
        label="Event Id"
        value={meetingId}
        infoText="Anyone with access to the meeting ID can join"
        fieldProps={{
          name: 'eventId',
          placeholder: 'Enter Event Id'
        }}
        errorText="Please enter a valid event ID"
        error={meetingErr}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setMeetingId(e.target.value);
          if (meetingErr) {
            setMeetingErr(false);
          }
        }}
      />
      <FormField
        field={Input}
        label="Name"
        value={name}
        fieldProps={{
          name: 'name',
          placeholder: 'Enter Your Name'
        }}
        errorText="Please enter a valid name"
        error={nameErr}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setName(e.target.value);
          if (nameErr) {
            setNameErr(false);
          }
        }}
      />
      <RegionSelection setRegion={setRegion} region={region} /> */}
      <Flex
        container
        layout="fill-space-centered"
        style={{ marginTop: '2.5rem' }}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <PrimaryButton label="Continue" onClick={handleJoinMeeting} />
        )}
      </Flex>
      {errorMessage && (
        <Modal size="md" onClose={closeError}>
          <ModalHeader title={`Meeting ID: ${meetingId}`} />
          <ModalBody>
            <Card
              title="Unable to join meeting"
              description="There was an issue finding that meeting. The meeting may have already ended, or your authorization may have expired."
              smallText={errorMessage}
            />
          </ModalBody>
        </Modal>
      )}
      <DevicePermissionPrompt />
    </form>
  );
};

export default MeetingForm;
