import { API } from 'aws-amplify';
import ScheduledEvent from './ScheduledEvent';

// Amplify Ids of APIs in this project
const CHIME_EVENT_API_ID = `chimeEventApi`;
const CHIME_LTI_API_ID = `chimeLtiApi`;

const API_PATH = (...pathSegments) => `/${pathSegments.join(`/`)}`;
const EVENT_API_PATH = (...pathSegments) => API_PATH(`events`, ...pathSegments);
const PLATFORM_API_PATH = (...pathSegments) => API_PATH(`platform`, ...pathSegments);
const EVENTGROUP_API_PATH = (...pathSegments) => API_PATH(`eventGroup`, ...pathSegments);

const DEFAULT_HEADERS = {
    Accept: `application/json`,
    [`Content-Type`]: `application/json`
}

const AUTH_HEADER_FOR_PRINCIPAL = (principal) => {
    return {
        Authorization: `Bearer ${principal.token}`
    };
}

const ApiClient = class {
    __principal;

    constructor(principal) {
        this.__principal = principal;
    }

    static getLtiJwk = async () => {
        return API.get(CHIME_LTI_API_ID, API_PATH(`jwk`), {
            headers: {
                ...DEFAULT_HEADERS
            }
        });
    }

    putEvent = async (event) => {
        const eventData = event instanceof ScheduledEvent ? event.payload : { ...event || {} };

        return API.put(CHIME_EVENT_API_ID, EVENT_API_PATH(this.__principal.source.id, this.__principal.context.id), {
            body: eventData,
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }

    updateEvent = async (event) => {
        const eventData = event instanceof ScheduledEvent ? event.payload : { ...event || {} };

        return API.post(CHIME_EVENT_API_ID, EVENT_API_PATH(this.__principal.source.id, this.__principal.context.id, eventData.eventId), {
            body: eventData,
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }

    deleteEvent = async (event) => {
        const eventData = event instanceof ScheduledEvent ? event.payload : { ...event || {} };

        return API.delete(CHIME_EVENT_API_ID, EVENT_API_PATH(this.__principal.source.id, this.__principal.context.id, eventData.eventId), {
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }

    getEvents = async () => {
        return API.get(CHIME_EVENT_API_ID, EVENT_API_PATH(this.__principal.source.id, this.__principal.context.id), {
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        }).then((events) => events.map((event) => new ScheduledEvent(event)));
    }

    getEvent = async (eventId) => {
        return API.get(CHIME_EVENT_API_ID, EVENT_API_PATH(this.__principal.source.id, this.__principal.context.id, eventId), {
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        }).then((event) => new ScheduledEvent(event));
    }

    getJoinMeetingUrl = (eventId) => {
        return `${this.__principal.platformConfig.chimeMeetingWebUrl}/?eventId=${eventId}-${this.__principal.context.id}&participantId=${this.__principal.user.id}&token=${this.__principal.token}`;
    }

    joinMeeting = async (eventId) => {
        return API.post(CHIME_EVENT_API_ID, API_PATH(`join`, this.__principal.source.id, this.__principal.context.id, eventId), {
            body: {},
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Chime meeting could not be joined.`);
            }
            else {
                return this.getJoinMeetingUrl(eventId);
            }
        });
    }

    setupMeeting = async (event) => {
        const eventData = event instanceof ScheduledEvent ? event.payload : { ...event || {} };

        return API.post(CHIME_EVENT_API_ID, API_PATH(`setup`, this.__principal.source.id, this.__principal.context.id, eventData.eventId), {
            body: eventData,
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        }).then(response => {
            if (!response.ok) throw new Error(`Chime meeting setup returned an error.`);
            else {
                event.setStatus(ScheduledEvent.STATUS.OPEN);
                return this.updateEvent(event).then(() => {
                    return event;
                });
            }
        });
    }

    getPlatform = async () => {
        return API.get(CHIME_EVENT_API_ID, PLATFORM_API_PATH(this.__principal.source.id), {
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }

    getEventGroup = async () => {
        return API.get(CHIME_EVENT_API_ID, EVENTGROUP_API_PATH(this.__principal.source.id, this.__principal.context.id), {
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }

    updateEventGroup = async (config) => {
        return API.post(CHIME_EVENT_API_ID, EVENTGROUP_API_PATH(this.__principal.source.id, this.__principal.context.id), {
            body: {
                platformId: this.__principal.source.id,
                eventGroupId: this.__principal.context.id,
                attributes: config
            },
            headers: {
                ...DEFAULT_HEADERS,
                ...AUTH_HEADER_FOR_PRINCIPAL(this.__principal)
            }
        });
    }
}

export default ApiClient;
