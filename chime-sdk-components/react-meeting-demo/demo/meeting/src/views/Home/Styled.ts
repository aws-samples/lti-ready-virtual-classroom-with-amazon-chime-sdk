// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import styled from 'styled-components';
import img from '../../images/AdobeStock_422946225.jpeg';

export const StyledLayout = styled.main`
  display: block;
  min-height: 100%;
  margin: auto;
  background-image: url(${img});
  height: 100vh;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  color: gainsboro;

  @media (min-width: 600px) and (min-height: 600px) {
    display: flex;
    align-items: left;
    justify-content: left;
    padding: 2rem;
  }
`;
