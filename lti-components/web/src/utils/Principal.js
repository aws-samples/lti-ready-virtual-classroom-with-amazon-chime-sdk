import * as rasha from 'rasha';
import * as jwt from 'jsonwebtoken';
import ApiClient from './ApiClient';

const Principal = class {
    __token;
    get token() { return `${this.__token}`; }

    __decodedToken;
    __decodedToken() { return this.__decodedToken; }

    __context = {};
    get context() { return this.__context; }

    __source = {};
    get source() { return this.__source; }

    __platformConfig = {};
    get platformConfig() { return this.__platformConfig || {}; }

    __eventGroupConfig = {};
    get eventGroupConfig () { return this.__eventGroupConfig || {}; }

    get title() {
        return this.__eventGroupConfig.title || this.__context.title || this.__context.label || ``; 
    }

    __user = {};
    get user() {
        return this.__user; 
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

    hasRole = (roleName) => {
        return (this.__user.roles || []).includes(roleName);
    }

    constructor(decodedToken, token) {
        this.__token = token;
        this.__decodedToken = decodedToken;

        this.__user = Object.assign({
            id: ``,
            name: ``,
            email: ``,
            roles: [ ]
        }, decodedToken[`user`] || {});

        this.__context = Object.assign({
            id: ``,
            title: ``
        }, decodedToken[`context`] || {});

        this.__source = Object.assign({
            id: ``,
            return_url: ``
        }, decodedToken[`source`] || {});

        this.__platformConfig = decodedToken[`config`];
    }

    withPlatformConfiguration = (platformConfig) => {
        this.__platformConfig = platformConfig;
        return this;
    }

    withEventGroupConfiguration = (eventGroupConfig) => {
        this.__eventGroupConfig = eventGroupConfig;
        return this;
    }

    static verify = async(idToken) => {
        const handleError = (err = {}, customMessage = `Unknown error`) => {
            throw new Error(`Access denied. ${customMessage} (${err.name}: ${err.message})`);
        }
        // load public keyset for token verification
        const response = await ApiClient.getLtiJwk().catch((err) => handleError(err, `Could not access public keyset to verify token.`));
        // look for public keyset in payload
        if (Array.isArray(response.keys) && response.keys.length > 0) {
            // export public key from keyset payload
            const key = await rasha.export({ jwk: response.keys[0]} ).catch((err) => handleError(err, `Public keyset appears to be corrupt.`));

            try {
                // verify and decode token
                const decodedToken = jwt.verify(idToken, key, { algorithms: [`RS256`] });
                const principal = new Principal(decodedToken, idToken);
                const apiClient = new ApiClient(principal);
                // read configuration stored for the platform and event group
                const evCfg = await apiClient.getEventGroup().catch((err) => handleError(err, `Failed to load event group configration.`));
                // augment principal object with configuration data
                return principal.withEventGroupConfiguration((evCfg ||{}).attributes);
            }
            catch(err) {
                handleError(err, `Token could not be verified.`);
            }
        } else {
            throw new Error(`Access denied. Could not initiate token verification due to missing public key.`);
        }
    }
};

export default Principal;