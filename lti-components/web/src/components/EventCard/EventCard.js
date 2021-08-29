import React, { Component } from 'react';
import { Hub } from 'aws-amplify';
import { Alert, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import EventEditor from '../EventEditor';
import EventButton from './EventButton';
import EventMetrics from './EventMetrics';
import EventTimeInfo from './EventTimeInfo';
import EventDateInfo from './EventDateInfo';
import EventHostInfo from './EventHostInfo';
import ExpandableText from './ExpandableText'
import ScheduledEvent from '../../utils/ScheduledEvent';
import ApiClient from '../../utils/ApiClient';

class EventCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            event: props.event,
            status: {
                visible: false,
                variant: `danger`,
                message: ``
            }
        }

        this.handleEventRefreshRequest = this.handleEventRefreshRequest.bind(this);
        this.handleEventActionResult = this.handleEventActionResult.bind(this);
    }

    componentDidMount() {
        Hub.listen(`eventUpdated${this.props.event.eventId}`, (event) => {
            return this.setState((state) => ({
                ...state,
                event: new ScheduledEvent(event.payload, this.props.principal)
            }));
        });

        Hub.listen(`eventRefresh${this.state.event.eventId}`, (event) => {
            return this.handleEventRefreshRequest(event.payload);
        });

        Hub.listen(`eventAction${this.state.event.eventId}`, (event) => {
            return this.handleEventActionResult(event.payload);
        });
    }

    handleEventRefreshRequest = (request) => {
        return new ApiClient(this.props.principal).getEvent(request.eventId).then((event) => {
            Hub.dispatch(`eventUpdated${this.props.event.eventId}`, event.payload);
        }).catch((err) => {
            console.error(err);
        });
    }

    handleEventActionResult(result) {
        // lock button
        this.setState((state) => ({
            ...state,
            status: {
                visible: result.message ? true : false,
                message: result.message || ``,
                variant: result.variant || `danger`,
                icon: result.icon || faTimes
            }
        }));
    }

    render() {
        return (
            <Card className="Lobby-EventPane min-vw-50 ml-3 mr-3 mt-2 mb-4" style={{
                width: '32rem',
                opacity: `${this.state.event.isHidden() ? '0.6' : '1'}`
            }} key={this.props.event.eventId}>
                <Card.Header as="h5">
                    <div className="d-flex">
                        <div className="mr-auto">
                            {this.state.event.getAttr(`title`, ``)}
                            {
                                <> {this.props.principal.isModerator(true) && (
                                    <>
                                        <EventEditor
                                            event={this.state.event}
                                            eventGroupId={this.props.principal.context.id}
                                            principal={this.props.principal}
                                            label={'Edit'}
                                            mode={'edit'}
                                            size={'btn-sm'}
                                            variant={`link`}
                                        />
                                        <EventMetrics
                                            event={this.state.event}
                                            principal={this.props.principal}
                                            label={'Edit'}
                                            mode={'edit'}
                                            size={'btn-sm'}
                                            variant={`link`}
                                        />
                                    </>
                                )} </>
                            }
                        </div>
                        <div>
                            <EventDateInfo event={this.state.event} />
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Card.Text><EventTimeInfo event={this.state.event} format24h={this.props.principal.eventGroupConfig.time24h} /></Card.Text>
                    <Card.Text><EventHostInfo event={this.state.event} /></Card.Text>
                    <Card.Text><ExpandableText text={this.state.event.getAttr(`detail`, ``)} chars={200} /></Card.Text>
                    {this.state.event.getAttr(`comments`, []).map((comment, idx) => {
                        return (
                            <Card.Subtitle key={idx} className="mb-2 text-muted">{comment.user}: {comment.text}</Card.Subtitle>
                        )
                    })}
                    <EventButton event={this.state.event} principal={this.props.principal} />
                    {this.state.status.visible && (
                        <Alert className="mt-2" variant={this.state.status.variant || `info`}><FontAwesomeIcon icon={this.state.status.icon || faTimes} /> {this.state.status.message || ``}</Alert>)
                    }
                </Card.Body>
            </Card>
        )
    }
}

export default EventCard;