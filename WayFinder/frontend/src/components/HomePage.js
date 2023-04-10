import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import OLMap from './Map/Map';

export default class HomePage extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router>
        <div>
          <h1>Home Page</h1>
          <OLMap />
        </div>
        <Routes>
          <Route exact path="/" element={<p>This is the home page</p>} />
        </Routes>
      </Router>
    );
  }
}