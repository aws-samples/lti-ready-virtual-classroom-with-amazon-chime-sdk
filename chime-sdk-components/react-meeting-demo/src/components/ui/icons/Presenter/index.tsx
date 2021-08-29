// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import Svg, { SvgProps } from '../Svg';

const Presenter: React.SFC<SvgProps> = (props) => {
  return (
    <Svg {...props}>
      <path d="M12.966 10c1.662 0 3.013 1.343 3.034 3h.731c.425 0 .82.216 1.055.579.248.379.287.855.103 1.272l-1.237 3.804c-.069.211-.265.345-.476.345-.05 0-.103-.008-.155-.024-.263-.086-.405-.369-.32-.631l1.255-3.85c.064-.154.055-.274-.007-.37-.03-.047-.1-.125-.218-.125H7.276c-.118 0-.187.078-.218.125-.062.096-.07.216-.024.323l1.272 3.897c.085.262-.057.545-.32.631-.052.016-.104.024-.155.024-.21 0-.406-.134-.476-.345L6.1 14.804c-.166-.37-.127-.846.121-1.225.237-.363.63-.579 1.055-.579h.732c.02-1.657 1.372-3 3.034-3zm0 1h-1.924c-1.112 0-2.018.894-2.038 2h6c-.02-1.106-.927-2-2.038-2zm-.87-6c1.104 0 2 .897 2 2s-.896 2-2 2c-1.102 0-2-.897-2-2s.898-2 2-2zm0 1c-.551 0-1 .449-1 1 0 .551.449 1 1 1 .553 0 1-.449 1-1 0-.551-.447-1-1-1z" />
    </Svg>
  );
};

Presenter.displayName = 'Presenter';

export default Presenter;