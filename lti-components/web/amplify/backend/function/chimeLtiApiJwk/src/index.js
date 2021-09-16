// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

`use strict`

const SecurityUtils = require(`./utils/SecurityUtils`);
const HttpResponse = require(`./utils/HttpResponse`);

exports.handler = () => {
  return SecurityUtils.getJwkFromSecret(process.env.STORED_SECRET)
        .then((jwk) => new HttpResponse().send(jwk))
        .catch((err) => {
          console.error(err);
          return new HttpResponse(500).send(`${err.message}. Please contact an Administrator or support for help.`);
      });
};
