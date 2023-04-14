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

  state = {
    marker1: null,
    marker2: null,
  }

  handleSearch = async (searchTerm, searchBarId) => {
    const data = await geocode(searchTerm)
    if (data && data.length > 0) {
      const {lat, lon} = data[0]
      const coordinates = [parseFloat(lon), parseFloat(lat)]
      console.log(`SearchBar${searchBarId}: `, searchTerm, "Coordinates: ", lat, lon)
      this.setState({[`marker${searchBarId}`]: coordinates})
    } else {
      console.error(`No results found for SearchBar${searchBarId}: `, searchTerm)
    }
  }

  render() {
    const {marker1, marker2} = this.state
    return (
      <Router>
        <div>
          <h1>Home Page</h1>
          <SearchBar placeholder="Search first location" onSearch={(searchTerm) => this.handleSearch(searchTerm, 1)} /><br />
          <SearchBar placeholder="Search second location" onSearch={(searchTerm) => this.handleSearch(searchTerm, 2)} />
          <OLMap marker1={marker1} marker2={marker2} />
        </div>
        <Routes>
          <Route exact path="/" element={<p>This is the home page</p>} />
        </Routes>
      </Router>
    )
  }
}