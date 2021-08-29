// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  ControlBar,
  AudioInputControl,
  VideoInputControl,
  ContentShareControl,
  AudioOutputControl,
  ControlBarButton,
  useUserActivityState,
  Dots
} from 'amazon-chime-sdk-component-library-react';

import EndMeetingControl from '../EndMeetingControl';
import { useNavigation } from '../../providers/NavigationProvider';
import { StyledControls } from './Styled';
import { useAppState } from '../../providers/AppStateProvider';


const MeetingControls = () => {
  const { toggleNavbar, closeRoster, showRoster } = useNavigation();
  const { isUserActive } = useUserActivityState();
  const { role } = useAppState();

  const handleToggle = () => {
    if (showRoster) {
      closeRoster();
    }

    toggleNavbar();
  };
  if(role=='Host'){
    return (
      <StyledControls className="controls" active={!!isUserActive}>
        <ControlBar
          className="controls-menu"
          layout="undocked-horizontal"
          showLabels
        >
          <ControlBarButton
            className="mobile-toggle"
            icon={<Dots />}
            onClick={handleToggle}
            label="Menu"
          />
          <AudioInputControl />
          <VideoInputControl />
          <ContentShareControl />
          <AudioOutputControl />
          <EndMeetingControl />
        </ControlBar>
      </StyledControls>
    );
  }
  //remove conditions if non-host
  else {
    return (
      <StyledControls className="controls" active={!!isUserActive}>
        <ControlBar
          className="controls-menu"
          layout="undocked-horizontal"
          showLabels
        >
          <ControlBarButton
            className="mobile-toggle"
            icon={<Dots />}
            onClick={handleToggle}
            label="Menu"
          />
          <AudioInputControl />
          <VideoInputControl />
          <ContentShareControl />
          <AudioOutputControl />
          <EndMeetingControl />
        </ControlBar>
      </StyledControls>
    );
  }
  
};

export default MeetingControls;
