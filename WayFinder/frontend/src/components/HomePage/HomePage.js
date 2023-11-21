import React, {useEffect, useState} from "react"
import SearchBox from "../SearchBox/SearchBox.js"
import {geocode} from "../../services/mapServices"
import Sidebar from "../Sidebar/Sidebar"
import "./HomePage.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faArrowCircleRight, faMinusCircle, faPlusCircle, faTimes} from "@fortawesome/free-solid-svg-icons"
import TransportOptions from "./TransportOptions/TransportOptions";
import {Typography} from "@mui/material";
import OLMap from "../Map/Map";
import StopoverContainer from "./StopoverContainer/StopoverContainer";
import {set} from "ol/transform";

const HomePage = () => {
    const [marker1, setMarker1] = useState(null)
    const [marker2, setMarker2] = useState(null)
    const [marker3, setMarker3] = useState(null)
    const [marker2Name, setMarker2Name] = useState("")
    const [isMinusIcon, setIsMinusIcon] = useState(false)
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [isStopoverToAdd, setIsStopoverToAdd] = useState(false)
    const [selectedOption1, setSelectedOption1] = useState('')
    const [selectedOption2, setSelectedOption2] = useState('')

    const toggleSidebar = () => {
        setIsSidebarNotCollapsed(!isSidebarNotCollapsed)
    }

    const handleSearch = async (searchTerm, searchBarId) => {
        const data = await geocode(searchTerm)
        const markerSetters = [setMarker1, setMarker2, setMarker3];
        const sessionStorageKeys = ["start", "end", "mid"];

        if (data && data.results.length > 0) {
            const {lat, lon} = data.results[0]
            const coordinates = [parseFloat(lon), parseFloat(lat)]
            console.log(`SearchBar${searchBarId}: `, searchTerm, "Coordinates: ", lat, lon)

            const markerIndex = searchBarId - 1

            markerSetters[markerIndex](coordinates)

            sessionStorage.setItem(sessionStorageKeys[markerIndex], searchTerm);
            sessionStorage.setItem(`${sessionStorageKeys[markerIndex]}Lat`, lat);
            sessionStorage.setItem(`${sessionStorageKeys[markerIndex]}Lon`, lon);

            // save search term to local storage
            let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
            searchHistory.push({searchTerm, searchBarId, timestamp: new Date()})
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
        } else {
            console.error(
                `No results found for SearchBar${searchBarId}: `, searchTerm)
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

    const setInitialStopoverStatus = () => {
        setIsStopoverToAdd(!isStopoverToAdd)
        setIsMinusIcon(!isMinusIcon)
    }

    useEffect(() => {
        if (isMinusIcon) {
            setSelectedOption1('')
            setSelectedOption2('')
        }
    }, [isMinusIcon])

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


                        <button className="add-stop-component" onClick={setInitialStopoverStatus}><FontAwesomeIcon icon={isStopoverToAdd ? faMinusCircle : faPlusCircle}/></button>

                        {isStopoverToAdd && (
                            <StopoverContainer
                                handleSearch={(searchTerm) => handleSearch(searchTerm, 3)}
                                handleOptionChange={(option) => handleOptionChange(option, setSelectedOption2)}
                                setInitialStopoverStatus = {setInitialStopoverStatus}
                            />
                        )}

                        <SearchBox placeholder={marker2Name || "Search destination"} onSearch={(searchTerm) => handleSearch(searchTerm, 2)}/>

                        <Typography style={{marginTop: '20px'}} variant="h2">Select Transport Options:</Typography>
                        <TransportOptions selectedOption={selectedOption1} handleOptionChange={(option) => handleOptionChange(option, setSelectedOption1)}/>
                        <Typography variant="h2">Selected Options: {selectedOption1}</Typography>
                    </div>
                )}
            </div>
            <OLMap marker1={marker1} marker2={marker2} marker3={marker3} transportOption1={selectedOption1} transportOption2={selectedOption2} onMarker2NameUpdate={updateMarker2Name} isPlusIcon={!isMinusIcon}/>
        </div>
    )
}

export default HomePage