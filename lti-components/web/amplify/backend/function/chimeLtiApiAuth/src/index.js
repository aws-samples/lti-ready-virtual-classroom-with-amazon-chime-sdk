`use strict`

const HttpResponse = require(`./utils/HttpResponse`);
const PlatformConfig = require(`./utils/PlatformConfig`);
const EventGroupConfig = require(`./utils/EventGroupConfig`);
const SecurityUtils = require(`./utils/SecurityUtils`);
const LTIMessage = require(`./utils/LTIMessage`);
const qs = require(`querystring`);

const AWS = require(`aws-sdk`);
const S3 = new AWS.S3();

module.exports.handler = async (event) => {
  const body = qs.parse(event.body || {});
  const token = body.id_token || (event.queryStringParameters || {}).id_token;
  //console.log(`${JSON.stringify(event, null, 2)}`);
  //console.log(`token: ${body.id_token}`);

  try {
    if (!token) throw new Error(`Missing token. Calling party does not present a valid id_token parameter.`);

    const platformId = SecurityUtils.getIssuerFromToken(token);

    if (!platformId) throw new Error(`Missing issuer information. Calling party does not present an 'iss' parameter in its token.`);

    const platformConfig = await new PlatformConfig(platformId).load();
    const systemSettings = platformConfig.getAttr(`system`);
    const decodedToken = await SecurityUtils.verifyToken(token, systemSettings.publicKeySetUrl);

    if (decodedToken) {
      const message = new LTIMessage(decodedToken, platformConfig);
      const payload = message.getPayload();

      await Promise.all([
        // ensure eventGroup configuration exists in Dynamo
        new EventGroupConfig(payload, platformConfig).load(),
        // write user data to S3 for analytical purposes
        S3.putObject({
          Body: JSON.stringify(message.getUserPayload()),
          Bucket: process.env.ANALYTICS_BUCKET_NAME,
          Key: `${process.env.ANALYTICS_BUCKET_USER_FOLDER}/${message.user.id}.json`
        }).promise().catch((e) => {
          // fail gracefully as this is a non-critical operation
          console.warn(`Failed to write data for user with id: '${message.user.id}' to S3 (Reason: ${e.message})`);
        })
      ]);

      if (payload.user.roles.length > 0) {
        return SecurityUtils.sign(payload, process.env.STORED_SECRET, systemSettings.tokenExpiresIn).then((encodedToken) => {
          const location = `${process.env.WEB_FRONTEND_URL}?id_token=${encodedToken}`;
          console.log(`Redirecting to ${location}`);
          return new HttpResponse(302).send(`Redirecting to ${location}`, { Location: location });
        });
      }
      else throw new Error(`Identity in token does not have any qualified LTI permission roles.`);
    }
    else throw new Error(`Failed to verify received JWT.`);
  }
  catch (err) {
    console.error(`Error: ${err.message}`);
    console.trace();
    return new HttpResponse(500).send(`${err.message}. Please contact an Administrator or support team for help.`);
  }
}