import React, { Component } from 'react';
import { Hub } from 'aws-amplify';
import { Alert } from 'react-bootstrap';
import Principal from '../utils/Principal';
import EventHome from './EventHome';
import AppJoin from './AppJoin';
import UserInfo from './UserInfo';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faCalendar, faCog } from '@fortawesome/free-solid-svg-icons';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

class AppHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      principal: {},
      verified: false,
      status: `Verifiying ...`
    }

    this.onEventTabSelected = this.onEventTabSelected.bind(this);
    this.delegateSelectionHandling = this.delegateSelectionHandling.bind(this);
    this.onEventGroupConfigChanged = this.onEventGroupConfigChanged.bind(this);
  }

  componentDidMount() {
    const idToken = new URLSearchParams(this.props.location.search).get(`id_token`);

    Hub.listen(`eventGroupConfigUpdated`, (event) => {
      this.onEventGroupConfigChanged(event.payload);
    });

    return Principal.verify(idToken).then((principal) => {
      return this.setState(state => ({
        ...state,
        verified: true,
        principal: principal,
        status: ``
      }));
    }).catch((err) => {
      return this.setState(state => ({
        ...state,
        verified: false,
        principal: {},
        status: err.message
      }));
    });
  }

  delegateSelectionHandling = (hubEventId, hubEventPayload = {}) => {
    return Hub.dispatch(hubEventId, hubEventPayload);
  }

  onEventGroupConfigChanged = (config) => {
    return this.setState(state => ({
      ...state,
      principal: this.state.principal.withEventGroupConfiguration(config)
    }));
  }

  onEventTabSelected = (eventKey) => {
    return this.delegateSelectionHandling(`eventTabSelected`, { eventKey });
  }

  render() {
    return (
      <div className="App justify-content-start">
        {this.state.verified && (
          <>
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
              <Navbar.Brand href="#" className="ml-2">Events Management Center</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                  <NavDropdown title={`Scheduled Events`} id="eventDropdown">
                    <NavDropdown.Item onClick={() => this.onEventTabSelected(3)}><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Events this week</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => this.onEventTabSelected(4)}><FontAwesomeIcon icon={faCalendar} className="mr-2" /> Events next week</NavDropdown.Item>
                    <NavDropdown.Item onClick={() => this.onEventTabSelected(2)}><FontAwesomeIcon icon={faCalendar} className="mr-2" /> Events last week</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => this.onEventTabSelected(5)}><FontAwesomeIcon icon={faCalendar} className="mr-2" /> Events in future</NavDropdown.Item>
                    <NavDropdown.Item onClick={() => this.onEventTabSelected(1)}><FontAwesomeIcon icon={faCalendar} className="mr-2" /> Events in past</NavDropdown.Item>
                  </NavDropdown>
                </Nav>
                {this.state.principal.isModerator(true) && (
                  <Nav>
                    <Nav.Link>
                      <div className="mr-2" onClick={() => this.delegateSelectionHandling(`eventGroupConfigEditorToggle`)}>
                          <FontAwesomeIcon icon={faCog} /> Settings
                      </div>
                    </Nav.Link>
                  </Nav>
                )}
                <Nav>
                  <Nav.Link><UserInfo principal={this.state.principal} /></Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Navbar>
            <div className="App-header p-4 w-100">
              <Router>
                  <Switch>
                    <Route exact path="/" render={(props) => <EventHome {...props} principal={this.state.principal} />} />
                    <Route path="/join/:eventId" render={(props) => <AppJoin {...props} principal={this.state.principal} />} />
                  </Switch>
              </Router>
            </div>
          </>
        )}
        {!this.state.verified && <Alert>{this.state.status}</Alert>}
      </div>
    );
  }
}

export default AppHome;
