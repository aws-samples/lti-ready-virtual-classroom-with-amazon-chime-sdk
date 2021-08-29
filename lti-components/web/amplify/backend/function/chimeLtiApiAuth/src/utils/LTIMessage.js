const ltiRoleMap = require(`../spec/ltiv1p3/ltiRoleMap`);
const crypto = require(`crypto`);

const LTIMessage = class {
    __token;
    get token() { return this.__token; }

    __platformConfig;
    get platformConfig() { return this.__platformConfig; }

    __issuer;
    get issuer() { return this.__issuer; }

    __context = {};
    get context() { return this.__context; }

    __launchPresentation = {};
    get launchPresentation() { return this.__launchPresentation; }

    __deploymentId = ``;
    get deploymentId() { return this.__deploymentId; }

    __clientId = ``;
    get clientId() { return this.__clientId; }

    __resourceId = ``;
    get resourceId() { return this.__resourceId; }

    __user = {};
    get user() {
        return this.__user;
    }

    __roles = [];
    get roles() { return this.__roles; }

    __highestPrivilegeRole = ``;
    getHighestPrivilegeRole() { return this.__highestPrivilegeRole; }

    isAdministrator = () => {
        return this.hasRole(`Administrator`);
    }

    isModerator = (implyFromHigherPrivilege = false) => {
        return this.hasRole(`Moderator`) || (implyFromHigherPrivilege && this.isAdministrator(true));
    }

    isUser = (implyFromHigherPrivilege = false) => {
        return this.hasRole(`User`) || (implyFromHigherPrivilege && this.isModerator(true));
    }

    hasRole = (roleName) => {
        return (this.__roles || []).includes(roleName);
    }

    constructor(token, platformConfig) {
        this.__token = token;
        this.__platformConfig = platformConfig;

        this.__deploymentId = token[`https://purl.imsglobal.org/spec/lti/claim/deployment_id`] || ``;
        this.__clientId = token[`aud`] || ``;
        this.__resourceId = (token[`https://purl.imsglobal.org/spec/lti/claim/resource_link`] || {}).id || ``;

        const context = token[`https://purl.imsglobal.org/spec/lti/claim/context`] || {};
        // ensure deployment-wide uniqueness of resource id
        const contextId = crypto.createHash(`md5`).update(`${this.__platformConfig.platformId}:${this.__deploymentId}:${context.id}:${this.__resourceId}`).digest(`hex`);

        // according to https://www.imsglobal.org/spec/lti/v1p3/#context-claim
        this.__context = {
            title: ``,
            label: ``,
            type: [],
            ...context,
            id: contextId,
            externalId: context.id
        };

        // ensure platform-wide uniqueness of user id
        const userId = crypto.createHash(`md5`).update(`${this.__platformConfig.platformId}:${token.sub}`).digest(`hex`);

        // according to https://www.imsglobal.org/spec/lti/v1p3/#user-identity-claims
        this.__user = {
            id: userId,
            name: token.name || (`${token.givenName || ``} ${token.family_name || ``}`),
            email: token.email
        };

        // according to http://www.imsglobal.org/spec/lti/v1p3/#launch-presentation-claim
        this.__launchPresentation = Object.assign({
            document_target: ``,
            return_url: ``,
        }, token[`https://purl.imsglobal.org/spec/lti/claim/launch_presentation`] || {});

        // resolving https://www.imsglobal.org/spec/lti/v1p3/#role-vocabularies
        const ltiRoles = token[`https://purl.imsglobal.org/spec/lti/claim/roles`] || [];
        this.__roles = ltiRoleMap.resolveRoles(...ltiRoles).map((role) => role.name);
        this.__highestPrivilegeRole = (ltiRoleMap.resolveToMostPrivilegedRole(...ltiRoles) || {}).name;

        this.__issuer = token[`iss`];
    }

    getUserPayload = () => {
        return {
            ...this.__user,
            roles: this.__roles.join(`,`),
            externalId: this.__token.sub || ``
        }
    }

    getPayload = () => {
        return {
            iss: this.__issuer,
            user: {
                ...this.__user,
                roles: this.__roles
            },
            context: {
                ...this.__context,
                // ensure context id is unique for link in any of multi platform / tool / deployment scenarios
                title: this.__context.title || this.__context.label || ``
            },
            source: {
                ...this.__launchPresentation,
                id: this.__platformConfig.platformIdEncrypted
            },
            config: {
                // add token settings from platform configuration
                ...this.__platformConfig.getAttr(`token`) || {}
            },
            chime: {
                event: {
                    id: `.+(-${this.__context.id})$` // describe id pattern of valid event ids
                },
                participant: {
                    id: this.__user.id,
                    name: this.__user.name,
                    email: this.__user.email,
                    role: this.__highestPrivilegeRole,
                },
                data: {
                    /* reserved for custom data needed to pass on to the Chime web client */
                }
            }
        }
    }
};

module.exports = LTIMessage;