import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import ApiClient from '../utils/ApiClient';

class AppJoin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      joined: false,
      status: `Join meeting. Please wait ...`
    }
  }

  componentDidMount() {
    const { eventId } = this.props.match.params;

    return new ApiClient(this.props.principal).joinMeeting(eventId).then((targetUrl) => {
        window.location.href = targetUrl;
    })
    .catch((err) => {
      return this.setState(state => ({
        ...state,
        joined: false,
        status: err.message
      }));
    });
  }

  render() {
    return (
      <div className="w-100">
        {!this.state.joined && <Alert>{this.state.status}</Alert>}
      </div>
    );
  }
}

export default AppJoin;
