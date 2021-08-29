`use strict`

const HttpResponse = require(`./utils/HttpResponse`);
const PlatformConfig = require(`./utils/PlatformConfig`);
const Url = require(`url-parse`);
const qs = require(`querystring`);
const crypto = require(`crypto`);

module.exports.handler = async (event) => {
    // expects: https://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
    console.log(JSON.stringify(event, null, 2));
    const body = qs.parse(event.body || {});
    const clientId = body.client_id || `default`;

    return new PlatformConfig(body.iss).load(clientId, body.lti_deployment_id)
        .then((platformConfig) => {
            const url = new Url(platformConfig.getAttr(`system`).authRequestUrl);
            // comply with: https://www.imsglobal.org/spec/security/v1p0/#step-2-authentication-request
            url.set(`query`, qs.stringify({
                scope: `openid`,
                response_type: `id_token`,
                response_mode: `form_post`,
                prompt: `none`,
                client_id: clientId,
                redirect_uri: body.target_link_uri,
                login_hint: body.login_hint,
                lti_message_hint: body.lti_message_hint || ``,
                state: crypto.randomBytes(30).toString(`hex`),
                nonce: crypto.randomBytes(25).toString(`hex`)
            }));
            return new HttpResponse(302).send(`Redirecting...`, { Location: url.href });
        })
        .catch((err) => {
            console.error(err);
            return new HttpResponse(500).send(`${err.message}. Please contact an Administrator or support for help.`);
        });
}