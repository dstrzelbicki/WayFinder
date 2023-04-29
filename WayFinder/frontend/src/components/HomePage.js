import React, {useState, useEffect} from "react"
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
import Sidebar from "./Sidebar/Sidebar"
import "./HomePage.css"

const HomePage = () => {
  const [marker1, setMarker1] = useState(null)
  const [marker2, setMarker2] = useState(null)
  const [marker2Name, setMarker2Name] = useState("")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const handleSearch = async (searchTerm, searchBarId) => {
    const data = await geocode(searchTerm)
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      const coordinates = [parseFloat(lon), parseFloat(lat)]
      console.log(
        `SearchBar${searchBarId}: `,
        searchTerm,
        "Coordinates: ",
        lat,
        lon
      )
      if (searchBarId === 1) {
        setMarker1(coordinates)
      } else {
        setMarker2(coordinates)
      }
    } else {
      console.error(
        `No results found for SearchBar${searchBarId}: `,
        searchTerm
      )
    }
  }

  const updateMarker2Name = (name) => {
    setMarker2Name(name)
  }

  return (
    <Router>
      <div className="full-height-container">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        <div className="search-container">
          <SearchBar
            placeholder="Search first location"
            onSearch={(searchTerm) => handleSearch(searchTerm, 1)}
          />
          <br />
          <SearchBar
            placeholder={marker2Name || "Search second location"}
            onSearch={(searchTerm) => handleSearch(searchTerm, 2)}
          />
        </div>
        <OLMap marker1={marker1} marker2={marker2} onMarker2NameUpdate={updateMarker2Name} />
      </div>
      <Routes>
        <Route exact path="/" />
      </Routes>
    </Router>
  )
}

export default HomePage