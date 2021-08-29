import React, { Component } from 'react';
import { Alert, Button, Col, Form, Modal, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faInfoCircle, faClock, faTimes, faFlag, faEdit, faUser } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import ApiClient from '../utils/ApiClient';
import ScheduledEvent from '../utils/ScheduledEvent';
import { Hub } from 'aws-amplify';

class EventEditor extends Component {
    constructor(props) {
        super(props);
        // apply event data for existing event (event update editor), or create new event template (event creation editor)
        const event = props.event || new ScheduledEvent({ eventGroupId: props.principal.context.id }, props.principal).withNewEventId().withHosts(`${props.principal.user.name}; `);
        
        this.state = {
            show: false,
            lock: false,
            event: event,
            date: event.moment,
            time: event.moment.clone(),
            timeEnd: event.momentEnd,
            duration: event.momentEnd.diff(event.moment, `seconds`),
            alert: {
                variant: ``,
                message: ``
            },
            timeFormat: `${props.principal.eventGroupConfig.time24h}` === `true` ? `HH:mm` : `h:mm a`
        };

        this.handleVisibility = this.handleVisibility.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.handleEventChange = this.handleEventChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePropagation = this.handlePropagation.bind(this);
    }

    handleChange = (attributeName, attributeValue) => {
       return this.setState(state => ({
            ...state,
            [attributeName]: attributeValue
        }));
    }

    handleTimeChange = (attributeName, attributeValue) => {
        if (!moment(attributeValue).isValid()) {
            return;
        }

        const date = attributeName === `date` ? attributeValue : this.state.date;
        const timeStart = attributeName === `time` ? attributeValue : this.state.time;
        const timeEnd = attributeName === `timeEnd` ? attributeValue : this.state.timeEnd;
        
        const dayStart = date.startOf(`day`);
        // merge start date and time 
        const dateStart = dayStart.clone().hour(timeStart.hour()).minute(timeStart.minute()).startOf(`minute`);
        // ensure end date on same day as start date with its individual end time
        const dateEnd = dayStart.clone().hour(timeEnd.hour()).minute(timeEnd.minute()).startOf(`minute`);

        if (dateEnd.diff(dayStart, `minutes`) < dateStart.diff(dayStart, `minutes`)) {
            dateEnd.add(1, `day`);
        }
        
        return this.setState(state => ({
            ...state,
            date: dayStart,
            time: dateStart,
            timeEnd: dateEnd,
            duration: dateEnd.diff(dateStart, `seconds`)
        }));
    }

    handlePropagation = (message, variant = `danger`) => {
        return this.setState(state => ({
            ...state,
            lock: false,
            alert: {
                message: message,
                variant: variant,
                icon: faTimes
            }
        }));
    }

    handleEventChange = (attributeName, event) => {
        return this.setState(state => ({
            ...state,
            event: state.event.setAttr(attributeName, event.target.value)
        }));
    }

    handleSettingChange = (settingName, settingValue) => {
        return this.setState(state => ({
            ...state,
            event: state.event.setSetting(settingName, settingValue)
        }));
    }

    handleStatusChange = (status, statusReason) => {
        return this.setState(state => ({
            ...state,
            event: state.event.setStatus(status || state.event.status, this.props.principal, statusReason)
        }));
    }

    handleSubmit = (event) => {
        event.preventDefault();
        const date = this.state.date.startOf(`minute`);
        const dateString = date.toISOString();
        const eventPayload = this.state.event.payload;

        const data = {
            ...eventPayload,
            date: dateString,
            attributes: {
                ...eventPayload.attributes,
                date: dateString,
                duration: this.state.duration
            }
        }

        // lock form
        this.setState(state => ({ ...state, lock: true, alert: {} }));
        
        if (!data.attributes.title) {
            this.handlePropagation(`The event title must not be empty.`);
        } else if (this.props.mode === `create` && moment().isAfter(date.clone().add(this.state.duration, `seconds`))) {
            this.handlePropagation(`The event end date/time must not be in the past.`);
        } else if (this.state.duration < 60) {
            this.handlePropagation(`The event duration must be at least 1 minute.`);
        } else {
            const apiClient = new ApiClient(this.props.principal);

            if (this.props.mode === `create`) {
                return apiClient.putEvent(data).then(() => {
                    console.log(`Event has been created successfully.`);
                    // reset event source to prepare for next input
                    const newEvent = new ScheduledEvent({ eventGroupId: this.props.principal.context.id }).withNewEventId().withHosts(`${this.props.principal.user.name}; `);
                    return this.setState(state => ({
                        ...state,
                        show: false,
                        lock: false,
                        event: newEvent,
                        date: newEvent.moment,
                        time: newEvent.moment
                    }));
                }).then(() => {
                    Hub.dispatch(`eventCreated`, data);
                }).catch((err) => {
                    this.handlePropagation(`Failed to create new event. (${err.message||``})`);
                });
            } else {
                return apiClient.updateEvent(data).then(() => {
                    console.log(`Event has been updated successfully.`);
                    this.handlePropagation(`Event info updated successfully.`, `success`);
                    this.handleVisibility();
                }).then(() => {
                    Hub.dispatch(`eventUpdated${eventPayload.eventId}`, data);
                }).catch((err) => {
                    this.handlePropagation(`Failed to update event info. (${err.message||``})`);
                });
            }
        }
    };

    handleVisibility = () => {
        this.setState(state => ({ 
            ...state,
            show: !(state.show),
            alert: !(state.show) ? {} : state.alert
        }));
    }

    render() {
        const timeStart = this.state.date.hour(this.state.time.hour()).minute(this.state.time.minute()).startOf(`minute`);
        const timeDuration = moment.duration(this.state.timeEnd.diff(timeStart));
        const allowEditStatus = this.props.mode !== `create` && [ ScheduledEvent.STATUS.SCHEDULED, ScheduledEvent.STATUS.CANCELLED, ScheduledEvent.STATUS.HIDDEN ].includes(this.state.event.status);

        return (
            <>
            <Button variant={this.props.variant||`primary`} className={this.props.size||'btn'} onClick={this.handleVisibility}>
                <FontAwesomeIcon icon={faEdit} /> {this.props.label}
            </Button>
    
            <Modal show={this.state.show} onHide={this.handleVisibility} >
                <Form onSubmit={this.handleSubmit}>
                    <Modal.Header closeButton>
                        
                    <Modal.Title>{this.state.event.getAttr(`title`, ``)}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                            {this.state.alert.message && (
                                <Alert variant={this.state.alert.variant||`info`}><FontAwesomeIcon icon={this.state.alert.icon} /> {this.state.alert.message||``}</Alert>
                            )}
                            <Form.Group controlId="formTitle">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1"/> <Form.Label><b>Event Title:</b></Form.Label>
                                <Form.Control type="text" value={this.state.event.getAttr(`title`, ``).substring(0, 100)} onChange={(e)=>this.handleEventChange(`title`, e)} placeholder={`Enter title`} disabled={this.state.lock} />
                            </Form.Group>

                            <Form.Group controlId="formHosts">
                                <FontAwesomeIcon icon={faUser} className="mr-1"/> <Form.Label><b>Event Host(s):</b></Form.Label>
                                <Form.Control type="text" value={this.state.event.getAttr(`hosts`, ``).substring(0, 200)} onChange={(e)=>this.handleEventChange(`hosts`, e)} disabled={this.state.lock} />
                            </Form.Group>
    
                            <Form.Group controlId="formDetail">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1"/> <Form.Label><b>Event Information:</b></Form.Label>
                                <Form.Control as="textarea" rows={3} value={this.state.event.getAttr(`detail`, ``).substring(0, 1000)} onChange={(e)=>this.handleEventChange(`detail`, e)} disabled={this.state.lock}></Form.Control>
                            </Form.Group>
    
                            <Form.Group controlId="formDateTime">
                                <Form.Row>
                                    <Col xs={6}>
                                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-1"/> <Form.Label><b>Event date:</b></Form.Label>
                                        <Datetime 
                                            value={this.state.date} 
                                            onChange={(e)=>this.handleTimeChange(`date`, e)} 
                                            dateFormat={'ddd, MMMM Do, YYYY'} 
                                            timeFormat={false} 
                                            closeOnSelect={true} />
                                    </Col>
                                    <Col xs={3}>
                                        <FontAwesomeIcon icon={faClock} className="mr-1"/> <Form.Label><b>Start</b></Form.Label>
                                        <Datetime 
                                            value={this.state.time} 
                                            onChange={(e)=>this.handleTimeChange(`time`, e)} 
                                            dateFormat={false} 
                                            timeFormat={this.state.timeFormat} 
                                            disabled={this.state.lock} />
                                    </Col>
                                    <Col xs={3}>
                                        <FontAwesomeIcon icon={faClock} className="mr-1"/> <Form.Label><b>End</b></Form.Label>
                                        <Datetime 
                                            value={this.state.timeEnd} 
                                            onChange={(e)=>this.handleTimeChange(`timeEnd`, e)} 
                                            dateFormat={false} 
                                            timeFormat={this.state.timeFormat} 
                                            disabled={this.state.lock} />
                                    </Col>
                                </Form.Row>
                                <Form.Row>
                                    <Col xs={12} className="mt-2">
                                        <Alert variant={`none`} className="text-center"><FontAwesomeIcon icon={faClock} className="mr-1"/> Duration: <b>{timeDuration.hours()} hours</b> and <b>{timeDuration.minutes()} minutes</b></Alert>
                                    </Col>
                                </Form.Row>
                            </Form.Group>

                            { allowEditStatus && (<Form.Group controlId="formSettings">
                                    <FontAwesomeIcon icon={faFlag} className="mr-1"/> <Form.Label><b>Event status:</b></Form.Label>
                                    <Form.Check type={'radio'} id={'eventStatus'}>
                                        <Form.Check.Input type='radio'
                                            checked={this.state.event.status === ScheduledEvent.STATUS.SCHEDULED} 
                                            onClick={()=>this.handleStatusChange(ScheduledEvent.STATUS.SCHEDULED)} 
                                        />
                                        <Form.Check.Label><b>Scheduled</b> (meeting will be open to join by students)</Form.Check.Label>
                                    </Form.Check>
                                    <Form.Check type={'radio'} id={'eventStatus'}>
                                        <Form.Check.Input type='radio' 
                                            checked={this.state.event.status === ScheduledEvent.STATUS.CANCELLED} 
                                            onClick={()=>this.handleStatusChange(ScheduledEvent.STATUS.CANCELLED)} 
                                        />
                                        <Form.Check.Label><b>Cancelled</b> (shown as cancelled; meeting won&apos;t start)</Form.Check.Label>
                                    </Form.Check>
                                    <Form.Check type={'radio'} id={'eventStatus'}>
                                        <Form.Check.Input type='radio' 
                                            checked={this.state.event.status === ScheduledEvent.STATUS.HIDDEN} 
                                            onClick={()=>this.handleStatusChange(ScheduledEvent.STATUS.HIDDEN)} 
                                        />
                                        <Form.Check.Label><b>Hidden</b> (invisible for students; meeting won&apos;t start)</Form.Check.Label>
                                    </Form.Check>
                                </Form.Group>)
                            }
                            { allowEditStatus && this.state.event.status !== ScheduledEvent.STATUS.SCHEDULED && (
                                    <Form.Group controlId="formDetail">
                                        <Form.Label><b>Status Reason:</b></Form.Label>
                                        <Form.Control as="textarea" rows={2} value={(this.state.event.getAttr(`meeting`).statusReason||``).substring(0, 200)} onChange={(e)=>this.handleStatusChange(null, e.target.value)} disabled={this.state.lock}></Form.Control>
                                    </Form.Group>
                                )
                            }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" type="submit" disabled={this.state.lock}>
                            {this.state.lock && (<Spinner as="span" variant="light" size="sm" role="status" aria-hidden="true" animation="border" className="mr-2" />)}
                            {this.props.mode === `create` ? `Create Event` : `Save Changes`}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            </>
        );
    }
}

export default EventEditor;