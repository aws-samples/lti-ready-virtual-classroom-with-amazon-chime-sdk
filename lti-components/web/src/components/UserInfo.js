import React, { Component } from 'react';
import { Badge, Button, Col, Container, Row, Form, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import "react-datetime/css/react-datetime.css";

class UserInfo extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            show: false
        };

        this.handleVisibility = this.handleVisibility.bind(this);
    }

    handleVisibility = () => {
        this.setState(state => ({ 
            ...state,
            show: !(state.show)
        }));
    }

    render() {
        return (
            <>
            <div onClick={this.handleVisibility}>
                <FontAwesomeIcon icon={faUser} className="mr-1" /> {this.props.principal.user.name||``}
            </div>
    
            <Modal show={this.state.show} onHide={this.handleVisibility} >
                <Form>
                    <Modal.Header closeButton>
                        
                    <Modal.Title><FontAwesomeIcon icon={faUser} className="mr-1" /> {this.props.principal.user.name||``}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    <Container>
                        <Row className="mb-2">
                            <Col xs={3}><b>Name</b></Col>
                            <Col xs={1}>:</Col>
                            <Col xs={8}>{this.props.principal.user.name||``}</Col>
                        </Row>
                        <Row className="mb-2">
                            <Col xs={3}><b>Email</b></Col>
                            <Col xs={1}>:</Col>
                            <Col xs={8}>{this.props.principal.user.email||``}</Col>
                        </Row>
                        <Row>
                            <Col xs={3}><b>Privileges</b></Col>
                            <Col xs={1}>:</Col>
                            <Col xs={8}>
                                {this.props.principal.user.roles.map((role, idx) => {
                                    return (<Badge key={`userRole${idx}`} className="mr-2" variant="info">{role}</Badge>)
                                })}
                            </Col>
                        </Row>
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

export default UserInfo;