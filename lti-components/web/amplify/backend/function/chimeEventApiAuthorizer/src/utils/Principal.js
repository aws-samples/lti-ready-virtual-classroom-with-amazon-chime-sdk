const rasha = require(`rasha`);
const got = require(`got`);
const jwt = require(`jsonwebtoken`);

const Principal = class {
    __token;
    get token() { return this.__token; }

    __context = {};
    get context() { return this.__context; }

    __source = {};
    get source() { return this.__source; }

    get title() {
        return this.__context.title || this.__context.label || ``;
    }

    __user = {};
    get user() {
        return this.__user;
    }

    get authorizerContext() {
        const exports = {
            userID: this.__user.id,
            userName: this.__user.name,
            userEmail: this.__user.email,
            contextTitle: this.title,
            contextExternalId: this.__context.externalId,
            platformId: this.__source.id,
            ...(this.__token.config || {})
        };

        (this.__user.roles || []).forEach((role, id) => {
            exports[`userRole${id + 1}`] = role;
        });

        return exports;
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
        return (this.__user.roles || []).includes(roleName);
    }

    constructor(token) {
        this.__token = token;

        this.__user = Object.assign({
            id: ``,
            name: ``,
            email: ``,
            roles: []
        }, token[`user`] || {});

        this.__context = Object.assign({
            id: ``,
            externalId: ``,
            title: ``
        }, token[`context`] || {});

        this.__source = Object.assign({
            return_url: ``
        }, token[`source`] || {});
    }

    static verify = async (publicKeySetUrl, idToken) => {
        return got.get(publicKeySetUrl, { timeout: 5000, retry: 2 }).json().then((response) => {
            return rasha.export({ jwk: response.keys[0] }).then((key) => {
                try {
                    const decodedToken = jwt.verify(idToken, key, { algorithms: [`RS256`] });
                    return new Principal(decodedToken);
                }
                catch (err) {
                    throw new Error(`Token could not be verified. (${err.name}: ${err.message})`);
                }
            })
        }).catch((err) => {
            throw new Error(`Could not initiate token verification. (${err.name}: ${err.message})`);
        });
    }
};

module.exports = Principal;