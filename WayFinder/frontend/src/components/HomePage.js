import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import OLMap from "./Map/Map";
import SearchBar from "./SearchBar/SearchBar";

export default class HomePage extends Component {
  constructor(props) {
    super(props);
  }

  handleSearch1 = (searchTerm) => {
    console.log('Search 1:', searchTerm);
    // logic for searching the first location
  };

  handleSearch2 = (searchTerm) => {
    console.log('Search 2:', searchTerm);
    // logic for searching the second location
  };

  render() {
    return (
      <Router>
        <div>
          <h1>Home Page</h1>
          <SearchBar placeholder="Search first location" onSearch={this.handleSearch1} /><br />
          <SearchBar placeholder="Search second location" onSearch={this.handleSearch2} />
          <OLMap />
        </div>
        <Routes>
          <Route exact path="/" element={<p>This is the home page</p>} />
        </Routes>
      </Router>
    );
  }
}