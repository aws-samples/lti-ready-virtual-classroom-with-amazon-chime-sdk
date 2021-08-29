// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useState, ReactNode } from 'react';
import { fetchMeeting } from './../utils/api';

type Props = {
  children: ReactNode;
};

interface AppStateValue {
  meetingId: string;
  meetingTitle:string;
  localUserName: string;
  theme: string;
  region: string;
  eventId: string;
  participantId: string;
  role:string;
  token:string;
  participantInfo:any;
  setRole: any;
  setParticipantInfo: any;
  setMeetingTitle: any;
  refreshPermissions: any;
  toggleTheme: () => void;
  setAppMeetingInfo: (meetingId?: string, name?: string, region?: string,eventId?:string,participantId?:string, role?: string, participantInfo?:any) => void;
}

const AppStateContext = React.createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const state = useContext(AppStateContext);

  if (!state) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return state;
}

const query = new URLSearchParams(location.search);

function parseJwt(token:string) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

export function AppStateProvider({ children }: Props) {
  const [meetingId, setMeeting] = useState(query.get('meetingId') || '');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [region, setRegion] = useState(query.get('region') || '');
  const [token, setToken] = useState(query.get('token') || '');
  const [eventId, setEvent] = useState(query.get('eventId') || parseJwt(token).eventId || '');
  const [participantId, setParticipant] = useState(query.get('participantId') || parseJwt(token).participantId || '');
  const [participantInfo, setParticipantInfo] = useState(null);
  const [role, setRole] = useState('');
  const [localUserName, setLocalName] = useState('');
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme || 'light';
  });

  const toggleTheme = (): void => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  };

  const refreshPermissions = async (): Promise<any> => {
    // Refresh meeting permissions
    const { ParticipantInfo } = await fetchMeeting(eventId, participantId, token);
    setParticipantInfo(ParticipantInfo);
    setParticipant(ParticipantInfo.ParticipantID);
    setRole(ParticipantInfo.RoleID);
  };

  const setAppMeetingInfo = (
    meetingId?: string,
    name?: string,
    region?: string,
    eventId?:string,
    participantId?:string,
    role?:string,
    participantInfo?: any
  ) => {
    setRegion(region || '');
    setMeeting(meetingId || '');
    setMeetingTitle(meetingTitle || '');
    setLocalName(name || '');
    setEvent(eventId || '');
    setParticipant(participantId || '');
    setRole(role || '');
    setToken(token || '');
    setParticipantInfo(participantInfo || null);
  };

  const providerValue = {
    meetingId,
    meetingTitle,
    localUserName,
    theme,
    region,
    eventId,
    participantId,
    role,
    token,
    participantInfo,
    setRole,
    setMeetingTitle,
    setParticipantInfo,
    toggleTheme,
    setAppMeetingInfo,
    refreshPermissions,
  };

  return (
    <AppStateContext.Provider value={providerValue}>
      {children}
    </AppStateContext.Provider>
  );
}
