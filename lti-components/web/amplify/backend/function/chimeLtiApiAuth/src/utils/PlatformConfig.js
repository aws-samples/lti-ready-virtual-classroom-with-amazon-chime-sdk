`use strict`

const AWS = require(`aws-sdk`);
const DDB = new AWS.DynamoDB({apiVersion: '2012-10-08'});
const crypto = require(`crypto`);

const ATTRIBUTE_NAMES = {
    KEY: `platformId`,
    VALUE: `attributes`
}

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

    load = async () => {
        const getItemMessage = {
            TableName: process.env.PLATFORM_TABLE,
            Key: { 
                [ATTRIBUTE_NAMES.KEY]: { S: `${this.__platformIdEncrypted}` },
            }
        }

        return this.__configurationItem || DDB.getItem(getItemMessage).promise().then((data) => {
            if (data.Item) {
                this.__configurationItem = AWS.DynamoDB.Converter.unmarshall(data.Item)[ATTRIBUTE_NAMES.VALUE];
                return this;
            } else {
                throw new Error(`No configuration stored for platform with id '${this.__platformId}'`);
            }
        });
    }
};