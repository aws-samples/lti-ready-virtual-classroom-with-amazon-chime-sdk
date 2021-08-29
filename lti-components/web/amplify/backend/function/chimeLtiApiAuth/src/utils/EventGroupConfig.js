`use strict`

const AWS = require(`aws-sdk`);
const DDB = new AWS.DynamoDB({apiVersion: '2012-10-08'});
const crypto = require(`crypto`);

const ATTRIBUTE_NAMES = {
    KEY: `platformId`,
    KEY2: `eventGroupId`,
    VALUE: `attributes`
}

module.exports = class {
    __platformConfig;
    get platformConfig() { return this.__platformConfig; }

    __eventGroupId;
    get eventGroupId() { return this.__eventGroupId; }

    __configurationItem;
    get configurationItem() { return this.__configurationItem; }
    
    __ltiMessage;

    constructor(message, platformConfig) {
        this.__ltiMessage = message;
        this.__eventGroupId = message.context.id;
        this.__platformConfig = platformConfig;
    }

    getAttr = (key) => {
        return (this.__configurationItem || {})[`${key}`];
    }

    load = async () => {
        const getItemMessage = {
            TableName: process.env.EVENTGROUPS_TABLE,
            Key: { 
                [ATTRIBUTE_NAMES.KEY]: { S: `${this.__platformConfig.platformIdEncrypted}` },
                [ATTRIBUTE_NAMES.KEY2]: { S: `${this.__eventGroupId}` }
            }
        }

        return this.__configurationItem || DDB.getItem(getItemMessage).promise().then(async(data) => {
            if (data.Item) {
                this.__configurationItem = AWS.DynamoDB.Converter.unmarshall(data.Item)[ATTRIBUTE_NAMES.VALUE];
            } else {
                this.__configurationItem = await this.create();
            }
        });
    }

    create = async () => {
        const configurationItem = {
            ...this.__platformConfig.getAttr(`group`),
            
        };

        const putItemMessage = {
            TableName: process.env.EVENTGROUPS_TABLE,
            Item: AWS.DynamoDB.Converter.marshall({
                [ATTRIBUTE_NAMES.KEY]: `${this.__platformConfig.platformIdEncrypted}`,
                [ATTRIBUTE_NAMES.KEY2]: `${this.__eventGroupId}`,
                [ATTRIBUTE_NAMES.VALUE]: configurationItem
            })
        };

        return DDB.putItem(putItemMessage).promise().then(() => {
            console.log(`Default configuration stored for eventGroup with id '${this.__eventGroupId}'.`);
            return configurationItem;
        }).catch((err) => {
            console.warn(`Error creating eventGroup configuration with id ${this.__eventGroupId}. (Reason: ${err.message})`);
            throw err;
        });
    }
};