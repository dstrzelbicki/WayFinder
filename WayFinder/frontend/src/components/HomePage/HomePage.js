import React, {useEffect, useState} from "react"
import OLMap from "../Map/Map"
import SearchBox from "../SearchBox/SearchBox.js"
import {geocode} from "../../services/mapServices"
import Sidebar from "../Sidebar/Sidebar"
import "./HomePage.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faArrowCircleRight, faMinus, faPlus, faTimes} from "@fortawesome/free-solid-svg-icons"
import TransportOptions from "./TransportOptions/TransportOptions";
import {Typography} from "@mui/material";

const HomePage = () => {
    const [marker1, setMarker1] = useState(null)
    const [marker2, setMarker2] = useState(null)
    const [marker3, setMarker3] = useState(null)
    const [marker2Name, setMarker2Name] = useState("")
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [showAddStop, setShowAddStop] = useState(false);
    const [isMinusIcon, setIsMinusIcon] = useState(false);
    const [selectedOption1, setSelectedOption1] = useState('');
    const [selectedOption2, setSelectedOption2] = useState('');

    const toggleSidebar = () => {
        setIsSidebarNotCollapsed(!isSidebarNotCollapsed)
    }

    const handleSearch = async (searchTerm, searchBarId) => {
        // fixme add validation and display error when not found
        const data = await geocode(searchTerm)
        if (data && data.results.length > 0) {
            const {lat, lon} = data.results[0]
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
                sessionStorage.setItem("start", searchTerm)
                sessionStorage.setItem("startLat", lat)
                sessionStorage.setItem("startLon", lon)
            } else if (searchBarId === 2) {
                setMarker2(coordinates)
                sessionStorage.setItem("end", searchTerm)
                sessionStorage.setItem("endLat", lat)
                sessionStorage.setItem("endLon", lon)
            } else {
                setMarker3(coordinates)
                sessionStorage.setItem("mid", searchTerm)
                sessionStorage.setItem("midLat", lat)
                sessionStorage.setItem("midLon", lon)
            }

            // save search term to local storage
            let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
            searchHistory.push({searchTerm, searchBarId, timestamp: new Date()})
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
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

    const handleAddStop = () => {
        setShowAddStop(!showAddStop);
        setIsMinusIcon(!isMinusIcon);
    };

    const handleOptionChange = (option) => {
        if (selectedOption1 === option) {
            setSelectedOption1('');
        } else {
            setSelectedOption1(option);
        }
    };

    const handleOptionChange2 = (option) => {
        if (selectedOption2 === option) {
            setSelectedOption1('');
        } else {
            setSelectedOption2(option);
        }
    };

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
                    <div className="search-box-container1">
                        <SearchBox placeholder="Search first location" onSearch={(searchTerm) => handleSearch(searchTerm, 1)}/>
                        <button className="add-stop-button" onClick={handleAddStop}><FontAwesomeIcon icon={showAddStop ? faMinus : faPlus}/></button>
                    </div>

                    <div className="search-box-container2">
                        <SearchBox placeholder={marker2Name || "Search second location"} onSearch={(searchTerm) => handleSearch(searchTerm, 2)}/>
                    </div>

                    {showAddStop && (
                        <>
                            <TransportOptions selectedOption={selectedOption1} handleOptionChange={handleOptionChange}/>

                            <div className="search-box-container1">
                                <SearchBox placeholder="Add stop" onSearch={(searchTerm) => handleSearch(searchTerm, 3)} grayText/>
                            </div>

                            <TransportOptions selectedOption={selectedOption2} handleOptionChange={handleOptionChange2}/>
                        </>
                    )}

                    {!showAddStop && (<TransportOptions selectedOption={selectedOption1} handleOptionChange={handleOptionChange}/>)}

                    <Typography variant="subtitle2">Selected Options: {selectedOption1}</Typography>

                </div>
            )}

            <OLMap marker1={marker1} marker2={marker2} marker3={marker3} transportOption1={selectedOption1} transportOption2={selectedOption2} onMarker2NameUpdate={updateMarker2Name} isPlusIcon={!isMinusIcon}/>

        </div>
    )
}

export default HomePage