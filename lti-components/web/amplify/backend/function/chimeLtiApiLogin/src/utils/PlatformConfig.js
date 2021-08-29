`use strict`;

const AWS = require(`aws-sdk`);
const DDB = new AWS.DynamoDB({apiVersion: '2012-10-08'});
const SSM = new AWS.SSM();
const crypto = require(`crypto`);

const ATTRIBUTE_NAMES = {
    KEY: `platformId`,
    ALIAS: `platformAlias`,
    VALUE: `attributes`
};

module.exports = class {
    __platformId;
    get platformId() { return this.__platformId; }

    __platformIdEncrypted;
    get platformIdEncrypted() { return this.__platformIdEncrypted; }

    __configurationItem;
    get configurationItem() { return this.__configurationItem; }

    constructor(platformId) {
        this.__platformId = platformId;
        this.__platformIdEncrypted = crypto.createHash(`md5`).update(`${platformId}`).digest(`hex`);
    }

    getAttr = (key) => {
        return (this.__configurationItem || {})[`${key}`];
    }
    
    load = async (clientId, deploymentId) => {
        const getItemMessage = {
            TableName: process.env.PLATFORM_TABLE,
            Key: { 
                [ATTRIBUTE_NAMES.KEY]: { S: `${this.__platformIdEncrypted}` }
            }
        }

        if (this.verify(clientId)) {
            if (!this.__configurationItem) {
                const data = await DDB.getItem(getItemMessage).promise().catch((err) => {
                    console.warn(`Error loading platform configuration with id ${this.__platformId}. (Reason: ${err.message})`);
                    throw err;
                });
                if (data.Item) {
                    this.__configurationItem = AWS.DynamoDB.Converter.unmarshall(data.Item)[ATTRIBUTE_NAMES.VALUE];
                } else {
                    this.__configurationItem = await this.create(clientId, deploymentId);
                }
            }
            return this;
        } else {
            const message = `LTI provier platform '${platformId}' with client '${clientId}' isn't authorized to be used with this tool. Contact administrator to request authorization.`;
            console.warn(message);
            throw new Error(message);
        }
    }

    verify = (clientId) => {
        const allowedPlatformIds = (process.env.LTI_PROVIDER_PLATFORM_IDS || `*`).split(`,`).filter(Boolean).map((p) => p.trim());
        const allowedClientIds = (process.env.LTI_PROVIDER_CLIENT_IDS || `*`).split(`,`).filter(Boolean).map((p) => p.trim());

        if ([ this.__platformId, `*` ].some(p => allowedPlatformIds.includes(p)) && [ clientId, `*` ].some(c => allowedClientIds.includes(c))) {
            return true;
        } else {
            return false;
        }
    }

    createDeployment = async (clientId, deploymentId = 1) => {
        if (!this.__configurationItem) {
            
            //this.__configurationItem = await
            const getParametersRequest = {
                Names: [ 
                    process.env.SSM_PARAM_LTI_TOKEN_URI,
                    process.env.SSM_PARAM_LTI_AUTH_REQUEST_URI,
                    process.env.SSM_PARAM_LTI_JWK_URI,
                    process.env.SSM_PARAM_LTI_TOKEN_EXPIRATION_TIME,
                    process.env.SSM_PARAM_CHIME_FRONTEND_URI,
                    process.env.SSM_PARAM_CHIME_BACKEND_URI
                ]
              };

              this.__configurationItem = await SSM.getParameters(getParametersRequest).promise().then((data) => {
                    const getParameter = (name, defaultValue = ``) => {
                        const p = (data.Parameters || []).find((parameter) => parameter.Name === name);
                        return p ? `${p.Value}`.replace(/\/$/, ``) : defaultValue;
                    };

                    let chimeFrontendUrl = getParameter(process.env.SSM_PARAM_CHIME_FRONTEND_URI);
                    if (!chimeFrontendUrl.startsWith(`https://`)) {
                        chimeFrontendUrl = `https://${chimeFrontendUrl}`;
                    }

                    let chimeBackendUrl = getParameter(process.env.SSM_PARAM_CHIME_BACKEND_URI);
                    if (!chimeBackendUrl.startsWith(`https://`)) {
                        chimeBackendUrl = `https://${chimeBackendUrl}`;
                    }

                    return {
                        system: {
                            // system settings are relevant only outside of the web interface
                            publicKeySetUrl: getParameter(process.env.SSM_PARAM_LTI_JWK_URI),
                            accessTokenUrl: getParameter(process.env.SSM_PARAM_LTI_TOKEN_URI),
                            authRequestUrl: getParameter(process.env.SSM_PARAM_LTI_AUTH_REQUEST_URI),
                            tokenExpiresIn: getParameter(process.env.SSM_PARAM_LTI_TOKEN_EXPIRATION_TIME, `4h`)
                        },
                        token: {
                            // token settings are added to the token and forwarded to the web interface
                            chimeMeetingApiUrl: chimeBackendUrl,
                            chimeMeetingWebUrl: chimeFrontendUrl
                        },
                        group: {
                            // group settings act as defaults for eventGroup settings
                            // event group moderators will be able to overwrite these settings locally
                            weekStart: 0, // 0 = sunday, 1 = monday, etc.
                            time24h: false, // true = shows time in 12h AM/PM format
                        },
                        clients: {
                            // list of clients coming in from the associated platform
                        }
                    };
              });
        }

        if (clientId) {
            if (!this.__configurationItem.clients[clientId]) {
                this.__configurationItem.clients[`${clientId}`] = { deployments: { [`${deploymentId}`]: {}}};
            } else if (deploymentId && !this.__configurationItem.clients[`${clientId}`].deployments[`${deploymentId}`]) {
                this.__configurationItem.clients[`${clientId}`].deployments[`${deploymentId}`] = {}
            }
        }
        return this.__configurationItem;
    }

    create = async (clientId, deploymentId = 1) => {
        const configurationItem = await this.createDeployment(clientId, deploymentId);

        const putItemMessage = {
            TableName: process.env.PLATFORM_TABLE,
            Item: AWS.DynamoDB.Converter.marshall({
                [ATTRIBUTE_NAMES.KEY]: `${this.__platformIdEncrypted}`,
                [ATTRIBUTE_NAMES.ALIAS]: `${this.__platformId}`,
                [ATTRIBUTE_NAMES.VALUE]: configurationItem
            })
        };

        return DDB.putItem(putItemMessage).promise().then(() => {
            console.log(`Default configuration stored for platform with id '${this.__platformId}'.`);
            return configurationItem;
        }).catch((err) => {
            console.warn(`Error creating platform configuration with id ${this.__platformId}. (Reason: ${err.message})`);
            throw err;
        });
    }
};