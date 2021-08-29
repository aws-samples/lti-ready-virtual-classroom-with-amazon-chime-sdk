import React, { Component } from 'react';
import { Alert, Button, Form, Modal, Spinner, Col, Dropdown, DropdownButton } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCog, faInfoCircle, faClock, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import "react-datetime/css/react-datetime.css";
import ApiClient from '../utils/ApiClient';
import { Hub } from 'aws-amplify';

const WEEK_START_ENUM = {
    0: `Sunday`,
    1: `Monday`,
    2: `Tuesday`,
    3: `Wednesday`,
    4: `Thursday`,
    5: `Friday`,
    6: `Saturday`
};

const TIME_FORMAT = {
    true: `24 hours`,
    false: `12 hours`
}

class ConfigEditor extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            show: false,
            lock: false,
            config: {
                weekStart: 0, // 0 = sunday
                time24h: false, // true = show time in 12h AM/PM format 
                ...props.principal.eventGroupConfig,
                title: props.principal.title
            },
            alert: {
                variant: ``,
                message: ``
            }
        };

        this.handleVisibility = this.handleVisibility.bind(this);
        this.handleConfigChange = this.handleConfigChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePropagation = this.handlePropagation.bind(this);
    }

    componentDidMount() {
        Hub.listen(`eventGroupConfigEditorToggle`, () => {
          this.handleVisibility();
        });
    }

    handleConfigChange = (attributeName, attributeValue) => {
        this.setState(state => ({
            ...state,
            config: {
                ...state.config,
                [attributeName]: attributeValue
            }
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

    handleSubmit = (event) => {
        event.preventDefault();
        const data = {
            ...this.state.config,
            // ensure title is set. if blank, fall back to context title
            title: (this.state.config.title||``).trim() || this.props.principal.context.title
        };

        // lock form
        this.setState(state => ({ ...state, lock: true, config: data, alert: {} }));

        return new ApiClient(this.props.principal).updateEventGroup(data).then(() => {
            this.handlePropagation(`Configuration updated successfully.`, `success`);
            this.handleVisibility();
        }).then(() => {
            Hub.dispatch(`eventGroupConfigUpdated`, data);
        }).catch((err) => {
            this.handlePropagation(`Failed to update configuration. (${err.message||``})`);
        });
    };

    handleVisibility = () => {
        this.setState(state => ({ 
            ...state,
            show: !(state.show),
            alert: !(state.show) ? {} : state.alert
        }));
    }

    render() {
        return (
            <>
            <Button variant={`link`} className={this.props.size||'btn'} onClick={this.handleVisibility}>
                <FontAwesomeIcon icon={faCog} />
            </Button>
    
            <Modal show={this.state.show} onHide={this.handleVisibility} >
                <Form onSubmit={this.handleSubmit}>
                    <Modal.Header closeButton>
                    <Modal.Title>Page settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                            {this.state.alert.message && (
                                <Alert variant={this.state.alert.variant||`info`}><FontAwesomeIcon icon={this.state.alert.icon} /> {this.state.alert.message||``}</Alert>
                            )}
                            <Form.Group controlId="formTitle">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> <Form.Label><b>Page title:</b></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={this.state.config.title.substring(0, 200)}
                                    onChange={(e)=>this.handleConfigChange(`title`, e.target.value)}
                                    disabled={this.state.lock} />
                            </Form.Group>

                            <Form.Group controlId="formDetail">
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-1"/> <Form.Label><b>Page details:</b></Form.Label>
                                <Form.Control as="textarea" rows={3} value={(this.state.config.detail||``).substring(0, 1000)} onChange={(e)=>this.handleConfigChange(`detail`, e.target.value)} disabled={this.state.lock}></Form.Control>
                            </Form.Group>

                            <Form.Group controlId="formDateTime">
                                <Form.Row>
                                    <Col xs={6}>
                                        <FontAwesomeIcon icon={faCalendarDay} className="mr-1" /> <Form.Label><b>Start of week:</b></Form.Label>
                                        <DropdownButton variant={'light'} id="formStartofWeek" title={WEEK_START_ENUM[this.state.config.weekStart]}>
                                            {Object.entries(WEEK_START_ENUM).map(([index, title]) => (
                                                <Dropdown.Item 
                                                    active={this.state.config.weekStart===index}
                                                    key={`${index}`}
                                                    eventKey={index}
                                                    onSelect={(key) => this.handleConfigChange(`weekStart`, key)}>{title}</Dropdown.Item>
                                            ))}
                                        </DropdownButton>
                                    </Col>
                                    <Col xs={6}>
                                        <FontAwesomeIcon icon={faClock} className="mr-1" /> <Form.Label><b>Time display</b></Form.Label>
                                        <DropdownButton variant={'light'} id="formTimeFormat" title={TIME_FORMAT[this.state.config.time24h]}>
                                            {Object.entries(TIME_FORMAT).map(([index, title]) => (
                                                <Dropdown.Item 
                                                    active={this.state.config.time24h===index}
                                                    key={`${index}`}
                                                    eventKey={index}
                                                    onSelect={(key) => this.handleConfigChange(`time24h`, key)}>{title}</Dropdown.Item>
                                            ))}
                                        </DropdownButton>
                                    </Col>
                                </Form.Row>
                            </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={this.state.lock}>
                            {this.state.lock && (<Spinner as="span" variant="light" size="sm" role="status" aria-hidden="true" animation="border" className="mr-2" />)} Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            </>
        );
    }
}

export default ConfigEditor;