import React from 'react';
import Amplify from 'aws-amplify';
import AppHome from './components/AppHome';
import awsconfig from './aws-exports';
import { BrowserRouter as Router, Route } from 'react-router-dom';

Amplify.configure(awsconfig);

function App() {
  return (
    <div className="App">
      <Router>
        <Route path="/" component={AppHome} />
      </Router>
    </div>
  );
}

export default App;