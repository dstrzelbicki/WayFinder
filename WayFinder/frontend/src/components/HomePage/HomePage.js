import React, {useEffect, useState} from "react"
import SearchBox from "../SearchBox/SearchBox.js"
import {geocode} from "../../services/mapServices"
import Sidebar from "../Sidebar/Sidebar"
import "./HomePage.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faArrowCircleRight, faTimes} from "@fortawesome/free-solid-svg-icons"
import TransportOptions from "./TransportOptions/TransportOptions";
import {Typography} from "@mui/material";
import OLMap from "../Map/Map";
import StopoverContainer from "./StopoverContainer/StopoverContainer";

const HomePage = () => {

    const [marker, setMarker] = useState({
        id: 0,
        coordinates: [],
        searchTerm: '',
        isToRemove: false
    })
    const [marker2Name, setMarker2Name] = useState("")
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [selectedOption1, setSelectedOption1] = useState('')
    const [selectedOption2, setSelectedOption2] = useState('')

    const toggleSidebar = () => {
        setIsSidebarNotCollapsed(!isSidebarNotCollapsed)
    }

    const handleSearch = async (searchTerm, markerIndex) => {
        const data = await geocode(searchTerm)
        const sessionStorageKeys = ["start", "end", "mid"];

        if (data && data.results.length > 0) {
            const {lat, lon} = data.results[0]
            const coordinates = [parseFloat(lon), parseFloat(lat)]
            console.log(`MarkerIndex: ${markerIndex}: `, searchTerm, "Coordinates: ", lat, lon)

            setMarker({id: markerIndex, coordinates: coordinates, searchTerm: searchTerm, isToRemove: false})

            let storageIndex = markerIndex === 1 || markerIndex === 2 ? markerIndex - 1 : 2
            const keyPrefix = sessionStorageKeys[storageIndex]
            sessionStorage.setItem(keyPrefix, searchTerm)
            sessionStorage.setItem(`${keyPrefix}Lat`, lat)
            sessionStorage.setItem(`${keyPrefix}Lon`, lon)

            // save search term to local storage
            let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
            searchHistory.push({searchTerm, markerIndex, timestamp: new Date()})
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
        } else {
            console.error(
                `No results found for SearchBar${markerIndex}: `, searchTerm)
        }
    }

    const updateMarker2Name = (name) => {
        setMarker2Name(name)
    }

    const handleOptionChange = (option, setSelectedOption) => {
        setSelectedOption((prevSelectedOption) =>
            prevSelectedOption === option ? '' : option
        )
    }

    const setMarkerToRemove = (markerIndex) => {
        setMarker({id: markerIndex, coordinates: [], searchTerm: '', isToRemove: true})
    }

    return (

        <div className="full-height-container">
            <Sidebar
                isNotCollapsed={isSidebarNotCollapsed}
                toggleSidebar={toggleSidebar}
                onSearchHistoryClick={() => {
                    setShowSearchHistory(true)
                    setIsSidebarNotCollapsed(false)
                }}
            />
            <div>
                {showSearchHistory ? (
                    <div className="search-history-container">
                        <div className="search-history-close" onClick={() => setShowSearchHistory(!showSearchHistory)}>
                            <p>Close search history &nbsp;<FontAwesomeIcon icon={faTimes}/></p>
                        </div>
                        <div className="search-history-list">
                            {JSON.parse(localStorage.getItem("searchHistory")) &&
                                JSON.parse(localStorage.getItem("searchHistory")).map((item, index) => (
                                    <div key={index} className="search-history-item" onClick={() => {
                                        setShowSearchHistory(false)
                                        updateMarker2Name(item.searchTerm)
                                        handleSearch(item.searchTerm, 2)
                                    }}
                                    >
                    <span>
                      {item.searchTerm}&nbsp;&nbsp;<FontAwesomeIcon icon={faArrowCircleRight}/>
                    </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <div className="search-location-container">
                        <SearchBox placeholder="Your location" onSearch={(searchTerm) => handleSearch(searchTerm, 1)}/>

                        <StopoverContainer
                            handleSearch={(searchTerm, markerIndex) => handleSearch(searchTerm, markerIndex + 2)}
                            handleOptionChange={(option) => handleOptionChange(option, setSelectedOption2)}
                            setMarkerToRemove={(markerIndex) => setMarkerToRemove(markerIndex + 2)}
                        />

                        <SearchBox placeholder={marker2Name || "Search destination"} onSearch={(searchTerm) => handleSearch(searchTerm, 2)}/>

                        <Typography style={{marginTop: '20px'}} variant="h2">Select Transport Options:</Typography>
                        <TransportOptions selectedOption={selectedOption1} handleOptionChange={(option) => handleOptionChange(option, setSelectedOption1)}/>
                        <Typography variant="h2">Selected Options: {selectedOption1}</Typography>
                    </div>
                )}
            </div>
            <OLMap marker={marker} transportOption1={selectedOption1} transportOption2={selectedOption2} onMarker2NameUpdate={updateMarker2Name}/>
        </div>
    )
}

export default HomePage