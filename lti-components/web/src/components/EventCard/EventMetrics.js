import React, { Component } from 'react';
import { Button, Spinner, Col, Container, Row, Form, Modal } from 'react-bootstrap';
import { Hub } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faChartBar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import "react-datetime/css/react-datetime.css";
import ApiClient from '../../utils/ApiClient';

class EventMetrics extends Component {
    constructor(props) {
        super(props);

        this.state = {
            event: props.event,
            show: false,
            buttonRefresh: {
                locked: false
            }
        };

        this.handleVisibility = this.handleVisibility.bind(this);
        this.handleEventRefresh = this.handleEventRefresh.bind(this);
    }

    handleVisibility = () => {
        this.setState(state => ({
            ...state,
            show: !(state.show)
        }));

        const status = (this.state.event.meetingInfo || {}).Status || this.state.event.status;

        if (!this.state.show && (!this.state.event.meetingMetrics || status === `Active`)) {
            // do refresh on first show or always on active meetings
            this.handleEventRefresh();
        }
    }

    handleEventRefresh = () => {
        // lock button
        this.setState((state) => ({ ...state, buttonRefresh: { ...state.buttonRefresh, locked: true } }));

        return new ApiClient(this.props.principal).getEvent(this.state.event.eventId).then((event) => {
            this.setState((state) => ({
                ...state,
                event: event,
                buttonRefresh: {
                    ...state.buttonRefresh,
                    locked: false
                }
            }));

            // propagage event status update
            Hub.dispatch(`eventUpdated${this.state.event.eventId}`, event.payload);
        });
    }

    render() {
        const status = (this.state.event.meetingInfo || {}).Status || this.state.event.status;
        const attendeeCount = ((this.state.event.meetingInfo || {}).Participants || []).length;
        const attendeeNames = ((this.state.event.meetingInfo || {}).Participants || []).map((p) => p.ParticipantName).filter(Boolean).join(`, `);

        return (
            <>
                <Button variant={this.props.variant || `primary`} className={this.props.size || 'btn'} onClick={this.handleVisibility}>
                    <FontAwesomeIcon icon={faChartBar} /> Info
                </Button>

                <Modal show={this.state.show} onHide={this.handleVisibility} >
                    <Form>
                        <Modal.Header closeButton>
                            <Modal.Title><FontAwesomeIcon icon={faChartBar} className="mr-1" /> Event info <Button variant="link" onClick={this.handleEventRefresh} disabled={this.state.buttonRefresh.locked}>{this.state.buttonRefresh.locked && (<Spinner as="span" variant="dark" size="sm" role="status" aria-hidden="true" animation="border" className="mr-2" />)} {!this.state.buttonRefresh.locked && (<FontAwesomeIcon icon={faSync} />)} Refresh</Button></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Container>
                                <Row className="mb-2">
                                    <Col xs={4}><b>Title</b></Col>
                                    <Col xs={1}>:</Col>
                                    <Col xs={7}>{(this.state.event.meetingMetrics || {}).title || this.state.event.getAttr(`title`)}</Col>
                                </Row>
                                <Row className="mb-2">
                                    <Col xs={4}><b>Status</b></Col>
                                    <Col xs={1}>:</Col>
                                    <Col xs={7}>{status}</Col>
                                </Row>
                                {attendeeNames && (
                                    <Row className="mb-2">
                                        <Col xs={4}><b>Attendees</b></Col>
                                        <Col xs={1}>:</Col>
                                        <Col xs={7}>{attendeeNames} </Col>
                                    </Row>
                                )}
                                {this.state.event.meetingMetrics && this.state.event.meetingMetrics.events && (
                                    <>
                                        <Row className="mb-2">
                                            <Col xs={4}><b>Started by</b></Col>
                                            <Col xs={1}>:</Col>
                                            <Col xs={7}>{this.state.event.meetingMetrics.hostUserName || `n/a`}</Col>
                                        </Row>
                                        {this.state.event.meetingMetrics.events['chime:MeetingStarted'] && (
                                            <>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Start time</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{this.state.event.meetingMetrics.events['chime:MeetingStarted'][0].firstStart}</Col>
                                                </Row>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Duration</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{Math.round((this.state.event.meetingMetrics.events['chime:MeetingStarted'][0].totalDuration || 0) / 60)} minutes</Col>
                                                </Row>
                                            </>
                                        )}
                                        {this.state.event.meetingMetrics.events['chime:AttendeeJoined'] && (
                                            <>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Attendees</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{Math.max(attendeeCount, this.state.event.meetingMetrics.events['chime:AttendeeJoined'][0].totalUsers)}</Col>
                                                </Row>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Attended time</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{Math.round((this.state.event.meetingMetrics.events['chime:AttendeeJoined'][0].totalDuration || 0) / 60)} minutes</Col>
                                                </Row>
                                            </>
                                        )}
                                        {this.state.event.meetingMetrics.events['chime:AttendeeVideoStarted'] && (
                                            <>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Video Shared</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{this.state.event.meetingMetrics.events['chime:AttendeeVideoStarted'][0].totalCount} shares by {this.state.event.meetingMetrics.events['chime:AttendeeVideoStarted'][0].totalUsers} attendees for {Math.round((this.state.event.meetingMetrics.events['chime:AttendeeVideoStarted'][0].totalDuration || 0))} seconds total</Col>
                                                </Row>
                                            </>
                                        )}
                                        {this.state.event.meetingMetrics.events['chime:AttendeeContentVideoStarted'] && (
                                            <>
                                                <Row className="mb-2">
                                                    <Col xs={4}><b>Screen Shared</b></Col>
                                                    <Col xs={1}>:</Col>
                                                    <Col xs={7}>{this.state.event.meetingMetrics.events['chime:AttendeeContentVideoStarted'][0].totalCount} shares by {this.state.event.meetingMetrics.events['chime:AttendeeContentVideoStarted'][0].totalUsers} attendees for {Math.round((this.state.event.meetingMetrics.events['chime:AttendeeContentVideoStarted'][0].totalDuration || 0))} seconds total</Col>
                                                </Row>
                                            </>
                                        )}
                                    </>
                                )}
                                {status==='Active' && (
                                    <>
                                        <FontAwesomeIcon icon={faInfoCircle} /> <span className="mb-2 text-muted"> metrics for active meetings are delayed by up to 7 minutes. Hit Refresh to check for updates.</span>
                                    </>
                                )}
                                {!this.state.event.meetingMetrics && !this.state.event.meetingInfo && (
                                    <>
                                        No metrics available.
                                    </>
                                )}
                            </Container>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={this.handleVisibility}>Close</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </>
        );
    }
}

export default EventMetrics;