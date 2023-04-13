import React, {Component} from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Redirect,
} from "react-router-dom"
import OLMap from "./Map/Map"
import SearchBar from "./SearchBar/SearchBar"
import {geocode} from "../services/mapServices"

export default class HomePage extends Component {
  constructor(props) {
    super(props)
  }

  handleSearch = async (searchTerm, searchBarId) => {
    const data = await geocode(searchTerm)
    if (data && data.length > 0) {
      const {lat, lon} = data[0]
      console.log(`SearchBar${searchBarId}: `, searchTerm, "Coordinates: ", lat, lon)
    } else {
      console.error(`No results found for SearchBar${searchBarId}: `, searchTerm)
    }
  }

  render() {
    return (
      <Router>
        <div>
          <h1>Home Page</h1>
          <SearchBar placeholder="Search first location" onSearch={(searchTerm) => this.handleSearch(searchTerm, 1)} /><br />
          <SearchBar placeholder="Search second location" onSearch={(searchTerm) => this.handleSearch(searchTerm, 2)} />
          <OLMap />
        </div>
        <Routes>
          <Route exact path="/" element={<p>This is the home page</p>} />
        </Routes>
      </Router>
    )
  }
}