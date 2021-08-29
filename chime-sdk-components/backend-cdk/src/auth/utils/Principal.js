const rasha = require(`rasha`);
const got = require(`got`);
const jwt = require(`jsonwebtoken`);

const Principal = class {
    __token;
    get token() { return this.__token; }

    __chimeInfo = {};
    get chimeInfo() { return this.__chimeInfo }

    get authorizerContext() {
        return {
            participantID: this.__chimeInfo.participant.id,
            participantName: this.__chimeInfo.participant.name,
            participantEmail: this.__chimeInfo.participant.email,
            participantRole: this.__chimeInfo.participant.role,
            data: JSON.stringify(this.__chimeInfo.data || {})
        };
    }

    isAdministrator = () => {
        return this.hasRole(`Administrator`);
    }

    isModerator = (implyFromHigherPrivilege = false) => {
        return this.hasRole(`Moderator`) || (implyFromHigherPrivilege && this.isAdministrator(true));
    }

    isUser = (implyFromHigherPrivilege = false) => {
        return this.hasRole(`User`) || (implyFromHigherPrivilege && this.isModerator(true));
    }

    isGuest = (implyFromHigherPrivilege = false) => {
        return this.hasRole(`Guest`) || (implyFromHigherPrivilege && this.isUser(true));
    }

    hasRole = (roleName) => {
        return `${this.__chimeInfo.participant.role}`.toLowerCase() === `${roleName}`.toLowerCase();
    }

    constructor(token) {
        this.__token = token;


        this.__chimeInfo = Object.assign({
            id: ``,
            name: ``,
            email: ``,
            role: ``,
            data: {}
        }, token[`chime`] || {});
    }

    static verify = async(publicKeySetUrl, idToken) => {
        return got.get(publicKeySetUrl).json().then((response) => {
            return rasha.export({ jwk: response.keys[0]} ).then((key) => {
                try {
                    const decodedToken = jwt.verify(idToken, key, { algorithms: [`RS256`] });
                    return new Principal(decodedToken);
                }
                catch(err) {
                    throw new Error(`Token could not be verified. (${err.name}: ${err.message})`);
                }
            })
        }).catch((err) => {
            throw new Error(`Could not initiate token verification. (${err.name}: ${err.message})`);
        });
    }
};

module.exports = Principal;
