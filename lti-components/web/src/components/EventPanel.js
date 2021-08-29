import React, { Component } from 'react';
import { Hub } from 'aws-amplify';
import { Alert, Tab, Tabs } from 'react-bootstrap';
import moment from 'moment';
import EventCard from './EventCard/EventCard';
import ApiClient from '../utils/ApiClient';
import ScheduledEvent from '../utils/ScheduledEvent';

class EventPanel extends Component {

    constructor(props) {
        super(props);

        this.state = {
            events: [],
            eventsLoaded: false,
            status: `Please wait ...`,
            showHiddenEvents: props.principal.isModerator(true),
            selectedTab: 3
        };

        moment.updateLocale(`en`, {
            week: {
                dow: props.principal.eventGroupConfig.weekStart || 0
            }
        });

        this.handleScheduledEventCreatedWithPayload = this.handleScheduledEventCreatedWithPayload.bind(this);
        this.handleScheduledEventCreated = this.handleScheduledEventCreated.bind(this);
        this.isEventOfPast = this.isEventOfPast.bind(this);
        this.isEventOfLastWeek = this.isEventOfLastWeek.bind(this);
        this.isEventOfThisWeek = this.isEventOfThisWeek.bind(this);
        this.isEventOfNextWeek = this.isEventOfNextWeek.bind(this);
        this.isEventOfFuture = this.isEventOfFuture.bind(this);
        this.sortEvents = this.sortEvents.bind(this);
        this.visibleEvent = this.visibleEvent.bind(this);
        this.handleEventTabSelection = this.handleEventTabSelection.bind(this);
    }

    handleEventTabSelection(eventKey) {
        return this.setState(state => {
            return ({
                ...state,
                selectedTab: eventKey
            })
        });
    }

    handleScheduledEventCreatedWithPayload(eventPayload) {
        return this.handleScheduledEventCreated(new ScheduledEvent(eventPayload));
    }

    handleScheduledEventCreated(scheduledEvent) {
        return this.setState(state => {
            return ({
                ...state,
                events: [
                    ...state.events.filter((event) => event.eventId !== scheduledEvent.eventId),
                    scheduledEvent
                ].filter(this.visibleEvent),
                eventsLoaded: true,
                status: ``
            })
        });
    }

    componentDidMount() {
        Hub.listen(`eventCreated`, (event) => {
            return this.handleScheduledEventCreatedWithPayload(event.payload);
        });

        Hub.listen(`eventTabSelected`, (event) => {
            return this.handleEventTabSelection(event.payload.eventKey);
        });

        return new ApiClient(this.props.principal).getEvents().then((events) => {
            return this.setState({
                events: events.filter(this.visibleEvent).sort(this.sortEvents),
                eventsLoaded: true,
                status: ``
            });
        }).catch((err) => {
            console.error(err);
            return this.setState({
                events: [],
                eventsLoaded: false,
                status: `${err.message}`
            });
        });
    }

    visibleEvent = (e) => this.state.showHiddenEvents || !e.isHidden();
    sortEvents = (e1, e2) => {
        if (moment().isSame(e1.moment, `day`)) return -1;
        else if (moment().isSame(e2.moment, `day`)) return 1;
        else return e2.moment.valueOf() - e1.moment.valueOf();
    }
    isEventOfPast = (e) => moment().subtract(1, `week`).isAfter(e.moment, `week`);
    isEventOfLastWeek = (e) => moment().subtract(1, `week`).isSame(e.moment, `week`);
    isEventOfThisWeek = (e) => moment().isSame(e.moment, `week`);
    isEventOfNextWeek = (e) => moment().add(1, `week`).isSame(e.moment, `week`);
    isEventOfFuture = (e) => moment().add(1, `week`).isBefore(e.moment, `week`);

    render() {
        return (
            <div className="w-100">
                {this.state.eventsLoaded && (
                    <Tabs 
                        activeKey={this.state.selectedTab} 
                        onSelect={this.handleEventTabSelection} 
                        id="eventTab" 
                        className="w-100 justify-content-center d-flex mt-3">
                        <Tab className="w-100" eventKey={1} title={`Past Weeks [${this.state.events.filter(this.isEventOfPast).length}]`}>
                            <div className="w-100 justify-content-center d-flex flex-wrap mt-3">
                            {
                                this.state.events.filter(this.isEventOfPast).map((event) => {
                                    return <EventCard 
                                        key={event.eventId} 
                                        principal={this.props.principal} 
                                        event={event} />
                                })
                            }
                            </div>
                        </Tab>
                        <Tab className="w-100" eventKey={2} title={`Last Week [${this.state.events.filter(this.isEventOfLastWeek).length}]`}>
                            <div className="w-100 justify-content-center d-flex flex-wrap mt-3">
                            {
                                this.state.events.filter(this.isEventOfLastWeek).map((event) => {
                                    return <EventCard 
                                        key={event.eventId}
                                        principal={this.props.principal} 
                                        event={event} />
                                })
                            }
                            </div>
                        </Tab>
                        <Tab className="w-100" eventKey={3} title={`This Week [${this.state.events.filter(this.isEventOfThisWeek).length}]`}>
                            <div className="w-100 justify-content-center d-flex flex-wrap mt-3">
                            {
                                this.state.events.filter((e) => moment().isSame(e.moment, `week`)).map((event) => {
                                    return <EventCard 
                                        key={event.eventId}
                                        principal={this.props.principal}
                                        event={event} />
                                })
                            }
                            </div>
                        </Tab>
                        <Tab className="w-100" eventKey={4} title={`Next Week [${this.state.events.filter(this.isEventOfNextWeek).length}]`}>
                            <div className="w-100 justify-content-center d-flex flex-wrap mt-3">
                            {
                                this.state.events.filter(this.isEventOfNextWeek).map((event) => {
                                    return <EventCard 
                                        key={event.eventId}
                                        principal={this.props.principal} 
                                        event={event} />
                                })
                            }
                            </div>
                        </Tab>
                        <Tab className="w-100" eventKey={5} title={`After Next Weeks [${this.state.events.filter(this.isEventOfFuture).length}]`}>
                            <div className="w-100 justify-content-center d-flex flex-wrap mt-3">
                            {
                                this.state.events.filter(this.isEventOfFuture).map((event) => {
                                    return <EventCard 
                                        key={event.eventId}
                                        principal={this.props.principal}
                                        event={event} />
                                })
                            }
                            </div>
                        </Tab>
                    </Tabs>
                )}
                {!this.state.eventsLoaded && (<Alert>{this.state.status}</Alert>)}
            </div>
        );
    }
}

export default EventPanel;