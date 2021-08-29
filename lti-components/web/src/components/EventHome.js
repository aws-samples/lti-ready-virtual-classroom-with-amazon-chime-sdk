import React, { Component } from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import EventEditor from './EventEditor';
import EventPanel from './EventPanel';
import ConfigEditor from './ConfigEditor';
import ExpandableText from './EventCard/ExpandableText';

class EventHome extends Component {
    render() {
        return (
            <>
                <div className="text-center">
                    <h2>
                        {this.props.principal.title ?? ''} {this.props.principal.isModerator(true) && (<ConfigEditor principal={this.props.principal} />)}
                    </h2>
                    <ExpandableText text={this.props.principal.eventGroupConfig.detail} chars={200} />
                </div>
                <div>
                    <ButtonGroup className="Lobby-Toolbar d-inline-block">
                        {this.props.principal.isModerator(true) && (
                            <div className="mb-3 mt-3">
                                <EventEditor 
                                    title={'Create Event'} 
                                    label={'Create Event'} 
                                    mode={'create'} 
                                    principal={this.props.principal} 
                                />
                            </div>
                        )}
                    </ButtonGroup>
                </div>
                <div className="w-100 justify-content-center d-flex align-content-start">
                    <EventPanel principal={this.props.principal} />
                </div>
            </>
        );
    }
}

export default EventHome;