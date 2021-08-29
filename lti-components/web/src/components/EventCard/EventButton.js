import React, { Component } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faClock, faTimes, faEyeSlash, faSync } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { Hub } from 'aws-amplify';
import ScheduledEvent from '../../utils/ScheduledEvent';
import ApiClient from '../../utils/ApiClient';

class EventButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            event: props.event,
            user: {
                canJoin: props.principal.isUser(true),
                canStart: props.principal.isModerator(true)
            },
            button: {
                visible: false,
                locked: false
            },
            buttonRefresh: {
                visible: false,
                locked: false
            },
            timeFormat: `${props.principal.eventGroupConfig.time24h}` === `true` ? `HH:mm` : `h:mm a`
        };

        this.handleEventUpdate = this.handleEventUpdate.bind(this);
        this.handleEventRefresh = this.handleEventRefresh.bind(this);
        this.handleEventAction = this.handleEventAction.bind(this);
    }

    componentDidMount() {
        Hub.listen(`eventUpdated${this.state.event.eventId}`, (event) => {
            this.handleEventUpdate(new ScheduledEvent(event.payload, this.props.principal));
        });
        // perform initial event update to render current information after mount
        return this.handleEventUpdate(this.state.event);
    }

    handleEventRefresh = () => {
        // lock button
        this.setState((state) => ({ ...state, buttonRefresh: { ...state.buttonRefresh, locked: true } }));
        // trigger event data refresh
        Hub.dispatch(`eventRefresh${this.state.event.eventId}`, { 
            eventGroupId: this.state.event.eventGroupId,
            eventId: this.state.event.eventId
        });
    }

    setButtonLock = (locked = true) => {
        return this.setState((state) => ({ ...state, button: { ...state.button, locked: locked } }));
    }

    handleEventAction = () => {
        // lock button
        this.setButtonLock(true);

        const wantToJoin = this.state.user.canJoin && this.state.event.meetingCanBeJoined();
        const wantToSetup = this.state.user.canStart && this.state.event.meetingCanStart();

        const apiClient = new ApiClient(this.props.principal);

        return apiClient.getEvent(this.state.event.eventId).then((event) => {
            if (wantToJoin && event.meetingCanBeJoined()) {
                return apiClient.joinMeeting(event.eventId).then((joinedEvent) => {
                    console.log(`Set up meeting successful`);
                    // propagage event status update
                    Hub.dispatch(`eventUpdated${this.state.event.eventId}`, joinedEvent.payload);
                }).catch((err) => {
                    Hub.dispatch(`eventAction${this.state.event.eventId}`, {
                        message: `Could not set up meeting (${err.message})`
                    });
                    this.setButtonLock(false);
                });
            }
            else if (wantToSetup && event.meetingCanStart()) {
                apiClient.setupMeeting(event).then((startedEvent) => {
                    console.log(`Set up meeting successful`);
                    // propagage event status update
                    Hub.dispatch(`eventUpdated${this.state.event.eventId}`, startedEvent.payload);
                }).catch((err) => {
                    Hub.dispatch(`eventAction${this.state.event.eventId}`, {
                        message: `Could not join meeting (${err.message})`
                    });
                    this.setButtonLock(false);
                });
            }
            else {
                Hub.dispatch(`eventAction${this.state.event.eventId}`, {
                    message: `This meeting cannot be ${wantToSetup ? `set up` : `joined`} anymore.`
                });
                Hub.dispatch(`eventUpdated${this.state.event.eventId}`, event.payload);
            }
        });
    }

    handleEventUpdate = (updatedEvent) => {
        const event = updatedEvent || this.state.event;
        
        let buttonState = {};
        let buttonRefreshState = {};

        if (event.isCancelled()) {
            buttonState = {
                visible: true,
                disabled: true,
                label: `Event cancelled`,
                icon: faTimes,
                hint: event.getAttr(`meeting`, {}).statusReason || `Meeting has been cancelled.`,
                variant: `danger`
            }
        }
        else if (event.isHidden()) {
            buttonState = {
                visible: true,
                disabled: true,
                label: `Event hidden`,
                icon: faEyeSlash,
                hint: event.getAttr(`meeting`, {}).statusReason || `Meeting is invisible to all users.`,
                variant: `warning`
            }
        }
        else if (this.state.user.canJoin && event.meetingCanBeJoined()) {
            buttonState = {
                visible: true,
                disabled: false,
                label: `Join Meeting`,
                icon: faPlay,
                hint: `Click to enter this meeting.`,
                variant: `success`
            }
        }
        else if (event.meetingCanStart()) {
            if (this.state.user.canStart) {
                buttonState = {
                    visible: true,
                    disabled: false,
                    label: `Start Meeting`,
                    icon: faPlay,
                    hint: `Click to start this meeting.`,
                    variant: `success`
                }
            } else {
                buttonState = {
                    visible: true,
                    disabled: true,
                    label: `Waiting for host`,
                    icon: faClock,
                    hint: `Waiting for host to start this meeting.`,
                    variant: `success`
                }
                buttonRefreshState = {
                    visible: true
                };
            }
        }
        else if (this.state.user.canJoin && event.meetingScheduleActive()) {
            const minutesDiff = Math.abs(moment().diff(event.moment, `minutes`));
            let timeStart = ``;
            let hint = `Meeting scheduled for ${event.moment.format(`MMMM Do`)}`

            if (minutesDiff < 5*60 || moment().isSame(event.moment, `day`)) {
                timeStart = `${event.moment.format(this.state.timeFormat)}`
                buttonRefreshState = {
                    visible: true
                };
            } else if (moment().add(1, `day`).isSame(event.moment, `day`)) {
                timeStart = `TOMORROW`;
            } else if (moment().add(6, `days`).isAfter(event.moment, `day`)) {
                timeStart = `${event.moment.format(`dddd`)}`;
            } else {
                timeStart = `${event.moment.format(`MMMM Do`)}`;
            }

            buttonState = {
                visible: true,
                disabled: true,
                label: `Starts ${timeStart}`,
                icon: faClock,
                hint: hint,
                variant: `secondary`
            }
        }
        else {
            buttonState = {
                visible: false,
                disabled: true
            }
        }

        return this.setState((state) => ({
            ...state,
            event: event,
            button: {
                visible: false,
                disabled: true,
                loading: false,
                label: ``,
                icon: null,
                hint: ``,
                variant: `secondary`,
                allowRefresh: false,
                locked: false,
                ...buttonState
            },
            buttonRefresh: {
                visible: false,
                locked: false,
                ...buttonRefreshState
                //visible: true,
            }
        }));
    }

    render() {
        const joinable = this.state.user.canJoin && this.state.event.meetingCanBeJoined();
        return this.state.button.visible && (
            <ButtonGroup className="Lobby-Toolbar d-inline-block">
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">{this.state.button.hint || this.state.button.label}</Tooltip>}>
                    <span className="d-inline-block">
                        { joinable && (<Button variant="success" href={`/join/${this.state.event.eventId}?id_token=${this.props.principal.token}`} target={this.state.event.eventId}><FontAwesomeIcon icon={faPlay} /> Join meeting</Button>)}
                        { !joinable && (<Button variant={this.state.button.variant} onClick={this.handleEventAction} disabled={this.state.button.disabled||this.state.button.locked}>
                            {this.state.button.locked && (<Spinner as="span" variant="light" size="sm" role="status" aria-hidden="true" animation="border" className="mr-2" />)} {this.state.button.icon && !this.state.button.locked && (<FontAwesomeIcon icon={this.state.button.icon} className="mr-1" />)} {this.state.button.label}
                        </Button>)}
                    </span>
                </OverlayTrigger>
                {this.state.buttonRefresh.visible && (<Button variant="link" onClick={this.handleEventRefresh} disabled={this.state.buttonRefresh.locked}>{this.state.buttonRefresh.locked && (<Spinner as="span" variant="dark" size="sm" role="status" aria-hidden="true" animation="border" className="mr-2" />)} {!this.state.buttonRefresh.locked && (<FontAwesomeIcon icon={faSync} />)} refresh</Button>)}
            </ButtonGroup>
        );
    }
}

export default EventButton;