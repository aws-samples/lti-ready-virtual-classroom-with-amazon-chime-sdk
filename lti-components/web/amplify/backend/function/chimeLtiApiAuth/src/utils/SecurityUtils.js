`use strict`

const AWS = require(`aws-sdk`);
const rasha = require(`rasha`);
const got = require(`got`);
const jwt = require(`jsonwebtoken`);
const SecretsManager = new AWS.SecretsManager();
const { generateKeyPairSync, randomBytes } = require(`crypto`);

const SecurityUtils = class {
    static async getJwkFromSecret(secretId) {
        return SecurityUtils.getSecret(secretId).then((secret) => {
            return rasha.import({ pem: secret.publicKey }).then((jwk) => {
                return {
                    keys: [
                        {
                            ...jwk,
                            alg: `RS256`,
                            use: `sig`,
                            kid: secret.keyID
                        }
                    ]
                };
            });
        });
    }

    static getIssuerFromToken(token) {
        return jwt.decode(token, { complete: true }).payload.iss;
    }

    static async verifyToken(token, publicKeySetUrl) {
        return got.get(publicKeySetUrl, { timeout: 5000, retry: 2 }).json().then((res) => {
            return rasha.export({ jwk: res.keys[0] }).then((key) => {
                return jwt.verify(token, key);
            });
        }).catch((err) => {
            throw new Error(`Could not initiate token verification. (${err.name}: ${err.message})`);
        });
    }

    static async sign(signObject, secretId, expiresIn = `1h`) {
        // make sure expiration can be overridden
        delete signObject.exp;

        return SecurityUtils.getSecret(secretId).then((secret) => {
            return jwt.sign(signObject, { key: secret.privateKey, passphrase: secret.keyID }, {
                expiresIn: expiresIn,
                algorithm: `RS256`
            });
        });
    }

    static async getSecret(secretId) {
        return SecretsManager.getSecretValue({ SecretId: secretId }).promise().then((data) => {
            if (data.SecretString === `__blank__`) {
                const keySet = SecurityUtils.generateNewKeySet();
                return SecurityUtils.updateSecret(secretId, keySet);
            } else {
                const keySet = data.SecretString || Buffer.from(data.SecretBinary, `base64`).toString(`ascii`);
                return JSON.parse(keySet);
            }
        });
    }

    static async updateSecret(secretId, secret) {
        return SecretsManager.updateSecret({
            SecretId: `${secretId}`,
            SecretString: JSON.stringify(secret)
        }).promise().then((data) => {
            console.info(`Secret updated: ${data.ARN}.`);
            return secret;
        });
    }

    static generateNewKeySet(keyId) {
        const kid = keyId || randomBytes(16).toString(`hex`);

        const keyPair = generateKeyPairSync(`rsa`, {
            modulusLength: 4096,
            publicKeyEncoding: { type: `spki`, format: `pem` },
            privateKeyEncoding: { type: `pkcs8`, format: `pem`, cipher: `aes-256-cbc`, passphrase: kid }
        });

        /*const sign = createSign(`RSA-SHA256`);
        sign.update(`ConsumerClientID`);
        const signature = sign.sign({ key: keyPair.privateKey, passphrase: kid }, `base64`);
        
        const verify = createVerify(`RSA-SHA256`);
        verify.update(`ConsumerClientID`);
        verify.verify(keyPair.publicKey, signature, `base64`);
        */

        return Object.assign({ keyID: kid }, keyPair);
    }
};

module.exports = SecurityUtils;