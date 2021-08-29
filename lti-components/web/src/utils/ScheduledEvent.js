import moment from 'moment';

const ScheduledEvent = class {
    __eventGroupId = ``;

    static STATUS = {
        CANCELLED: `cancelled`,
        SCHEDULED: `scheduled`,
        OPEN: `open`,
        CLOSED: `closed`,
        HIDDEN: `hidden`
    };

    static CONFIG = {
        START_WINDOW_PRIOR: 5
    }

    __meeetingMetrics = {};
    get meetingMetrics() { return this.__meeetingMetrics; }

    __meetingInfo = {};
    get meetingInfo() { return this.__meetingInfo; }

    __payload = {
        eventId: ``,
        eventGroupId: ``,
        created: moment().toISOString(),
        attributes: {
            date: moment().add(1, `hour`).startOf(`hour`).toISOString(),
            duration: 60 * 60,
            title: ``,
            detail: ``,
            hosts: ``,
            attachments: [],
            comments: [
                /*{
                    user: ``,
                    date: moment(`2021-04-30 09:30`),
                    text: ``
                }*/
            ],
            settings: {
                disableAutoLaunch: false,
                disableCamera: false,
                disableAudio: false,
                autoLaunchMinuteWindow: 0
            },
            meeting: {
                status: ScheduledEvent.STATUS.SCHEDULED
            }
        }
    };
    get payload() { return this.__payload; }
    get eventGroupId() { return this.__payload.eventGroupId; }
    get eventId() { return this.__payload.eventId; }
    get status() { return this.getAttr(`meeting`, {}).status || ScheduledEvent.STATUS.SCHEDULED; }

    getAttr = (attributeName, defaultValue) => {
        return this.__payload.attributes[attributeName] || defaultValue;
    }

    setAttr = (attributeName, attributeValue) => {
        this.__payload.attributes[attributeName] = attributeValue; return this;
    }

    hasStatus = (...status) => {
        return (status || []).includes(this.status);
    }

    isCancelled = () => {
        return this.hasStatus(ScheduledEvent.STATUS.CANCELLED);
    }

    isHidden = () => {
        return this.hasStatus(ScheduledEvent.STATUS.HIDDEN);
    }

    isOpen = () => {
        return this.hasStatus(ScheduledEvent.STATUS.OPEN);
    }

    isScheduled = () => {
        return this.hasStatus(ScheduledEvent.STATUS.SCHEDULED);
    }

    isClosed = () => {
        return this.hasStatus(ScheduledEvent.STATUS.CLOSED);
    }

    meetingCanBeJoined = () => {
        return this.isOpen() && moment().isSameOrBefore(this.__momentEnd);
    }

    meetingCanStart = () => {
        const earliestStartTime = this.__moment.clone().subtract(ScheduledEvent.CONFIG.START_WINDOW_PRIOR, `minutes`);
        const activeStartWindow = moment().isSameOrAfter(earliestStartTime) && moment().isSameOrBefore(this.__momentEnd);
        return this.isScheduled() && activeStartWindow;
    }

    meetingScheduleActive = () => {
        return this.isScheduled() && moment().isSameOrBefore(this.__momentEnd);
    }

    setStatus = (statusName, principal, statusReason = ``) => {
        const status = {
            status: statusName,
            statusReason: statusReason,
            statusUpdate: moment().toISOString()
        };

        if (principal) {
            status.statusUpdateBy = {
                userId: principal.id,
                userName: principal.name
            };
        }
        return this.setAttr(`meeting`, {
            ...this.getAttr(`meeting`, {}),
            ...status
        });
    }

    getSetting = (settingName) => {
        return this.getAttr(`settings`, {})[settingName];
    }

    setSetting = (settingName, settingValue) => {
        this.__payload.attributes.settings[settingName] = settingValue; return this;
    }

    __moment;
    get moment() { return this.__moment; }
    set moment(value) { this.__moment = value; }

    __momentEnd;
    get momentEnd() { return this.__momentEnd; }
    set momentEnd(value) { this.__momentEnd = value; }

    constructor(eventPayload = {}, principal) {
        this.__payload.eventId = eventPayload.eventId || ``;
        this.__payload.eventGroupId = eventPayload.eventGroupId || ``;

        this.__meeetingMetrics = eventPayload.meetingMetrics;
        this.__meetingInfo = eventPayload.meetingInfo;

        Object.entries(eventPayload.attributes || {}).forEach(([attributeName, attributeValue]) => {
            this.setAttr(attributeName, attributeValue);
        });

        if (this.__payload.attributes.date) {
            this.__moment = moment(this.__payload.attributes.date);
            this.__momentEnd = moment(this.__payload.attributes.date).add(this.getAttr(`duration`, 3600), `seconds`);
        }

        if (!this.__payload.attributes.meeting.status) {
            this.setStatus(ScheduledEvent.STATUS.SCHEDULED, principal);
        }
    }

    withTitle = (title = ``) => {
        return this.setAttr(`title`, title);
    }

    withDetail = (detail = ``) => {
        return this.setAttr(`detail`, detail);
    }

    withHosts = (hostnames = ``) => {
        return this.setAttr(`hosts`, hostnames);
    }

    withDateTime = (date, time) => {
        if (time) {
            date.hour(time.hour()).minute(time.minute());
        }
        this.__moment = date;
        return this.setAttr(`date`, date.seconds(0).milliseconds(0).toISOString());
    }

    withSettings = (settings) => {
        Object.entries(settings || {}).forEach(([settingName, settingValue]) => {
            this.setSetting(settingName, settingValue);
        });
        return this;
    }

    withEventGroupId = (eventGroupId) => {
        this.__eventGroupId = eventGroupId;
        this.__payload.eventGroupId = eventGroupId;
        return this;
    }

    withNewEventId = (id) => {
        this.__payload.eventId = id || Math.random().toString(36).substring(2, 15);
        return this;
    }
};

export default ScheduledEvent;