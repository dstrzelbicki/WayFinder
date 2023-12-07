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
import {apiGetSearchedLocations, apiPostSearchedLocation} from "../../lookup/backendLookup";
import StopoverContainer from "./StopoverContainer/StopoverContainer";

const HomePage = () => {

    const [marker, setMarker] = useState(null)
    const [marker2Name, setMarker2Name] = useState("")
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [searchHistory, setSearchHistory] = useState([])
    const [routePoints, setRoutePoints] = useState([])

    // internal
    const [originRoutePoints, setOriginRoutePoints] = useState(new Map())
    const [markersToRemove, setMarkersToRemove] = useState(new Map())
    const [routePointsToRemove, setRoutePointsToRemove] = useState(new Map())

    const createMarker = (coordinates = [], isToRemove = false) => ({
        coordinates, isToRemove
    })

    const createRoutePoint = (coordinates = [], transportOption = '', isToRemove = false) => ({
        coordinates, transportOption, isToRemove
    })

    const toggleSidebar = () => {
        setIsSidebarNotCollapsed(!isSidebarNotCollapsed)
    }

    const handleSearch = async (searchTerm, keyPrefix) => {
        removeOldMarkerWithTheSameKey(keyPrefix)
        removeOldRoutePointWithTheSameKey(keyPrefix)

        const data = await geocode(searchTerm)

        if (data && data.results.length > 0) {

            const {lat, lon} = data.results[0]
            const routeCoordinates = [parseFloat(lon), parseFloat(lat)]
            let newMarker = createMarker(routeCoordinates)
            setMarker(newMarker)
            console.log(`Marker:`, searchTerm, "Coordinates: ", lat, lon)

            setMarkersToRemove(markersToRemove.set(keyPrefix, newMarker))

            updateOriginRoutePointWithCoordinates(keyPrefix, routeCoordinates)
            sessionStorage.setItem(keyPrefix, searchTerm)
            sessionStorage.setItem(`${keyPrefix}Lat`, lat)
            sessionStorage.setItem(`${keyPrefix}Lon`, lon)

            // save searched location to db
            let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
            searchHistory.push({searchTerm, timestamp: new Date()})
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))

            let locationData = {name: searchTerm, lat: lat, lng: lon}
            apiPostSearchedLocation(locationData, (response, status) => {
                console.log(response, status)
            })

        } else {
            console.error(`No results found for: `, searchTerm)
        }
    }

    const updateOriginRoutePointWithCoordinates = (keyPrefix, coordinates) => {
        setOriginRoutePoints((prevRoutePoints) => {
            const prevValue = prevRoutePoints.get(keyPrefix)
            const updatedValue = {
                ...prevValue, coordinates: coordinates
            }

            const newRoutePoints = new Map(prevRoutePoints)
            return newRoutePoints.set(keyPrefix, updatedValue)
        })
    }

    const removeOldMarkerWithTheSameKey = (keyPrefix) => {
        let existingMarker = markersToRemove.get(keyPrefix)
        if (existingMarker) {
            const updatedMarkers = new Map(markersToRemove)
            updatedMarkers.delete(keyPrefix)
            setMarkersToRemove(updatedMarkers)

            setMarker(createMarker(existingMarker.coordinates, true))
        }
    }

    const removeOldRoutePointWithTheSameKey = (keyPrefix) => {
        let existingRoutePoint = routePointsToRemove.get(keyPrefix)
        if (existingRoutePoint) {
            const updatedRoutePoints = new Map(routePointsToRemove)
            updatedRoutePoints.delete(keyPrefix)
            setRoutePointsToRemove(updatedRoutePoints)

            setRoutePoints((prevRoutePoints) => [...prevRoutePoints, createRoutePoint(existingRoutePoint.coordinates, existingRoutePoint.transportOption, true)])
        }
    }

    const setStopoverMapFeaturesToRemove = async (stopover) => {
        const data = await geocode(stopover.searchTerm)
        if (data && data.results.length > 0) {
            const {lat, lon} = data.results[0]
            const coordinates = [parseFloat(lon), parseFloat(lat)]
            setMarker(createMarker(coordinates, true))
            setRoutePoints((prevRoutePoints) => [...prevRoutePoints, createRoutePoint(stopover.coordinates, stopover.transportOption, true)])
        }
    }

    const updateMarker2Name = (name) => {
        setMarker2Name(name)
    }

    const updateOriginTransportOption = (keyPrefix, option) => {
        setOriginRoutePoints((prevRoutePoints) => {
            const prevValue = prevRoutePoints.get(keyPrefix)
            const updatedValue = {
                ...prevValue,
                transportOption: option
            }

            const newRoutePoints = new Map(prevRoutePoints)
            return newRoutePoints.set(keyPrefix, updatedValue)
        })
    }

    useEffect(() => {
        const newRoutePoints = []

        originRoutePoints.forEach((originRoutePoint, key) => {
            if (originRoutePoint.coordinates && originRoutePoint.transportOption) {
                let newRoutePoint = createRoutePoint(originRoutePoint.coordinates, originRoutePoint.transportOption)
                setRoutePointsToRemove(routePointsToRemove.set(key, newRoutePoint))
                newRoutePoints.push(newRoutePoint)
            }
        })

        setRoutePoints((prevRoutePoints) => [...prevRoutePoints, ...newRoutePoints])
    }, [originRoutePoints])

    useEffect(() => {
        apiGetSearchedLocations((response, status) => {
            if (status === 200) {
                setSearchHistory(response)
            } else {
                console.log(response, status)
            }
        })
    }, [showSearchHistory])

    return (<div className="full-height-container">
        <Sidebar
            isNotCollapsed={isSidebarNotCollapsed}
            toggleSidebar={toggleSidebar}
            onSearchHistoryClick={() => {
                setShowSearchHistory(true)
                setIsSidebarNotCollapsed(false)
            }}
        />
        <div className="search-container">
            {showSearchHistory ? (<div className="search-history-container">
                <div className="search-history-close" onClick={() => setShowSearchHistory(!showSearchHistory)}>
                    <p>Close history &nbsp;<FontAwesomeIcon icon={faTimes}/></p>
                </div>
                <div className="search-history-list">
                    {searchHistory && searchHistory.map((item, index) => (<div key={item.id} className="search-history-item" onClick={() => {
                        setShowSearchHistory(false)
                        updateMarker2Name(item.name)
                        handleSearch(item.name)
                    }}
                    >
                    <span>
                        {item.name.length > 20 ? item.name.substring(0, 35) + "..." : item.name}
                        &nbsp;&nbsp;<FontAwesomeIcon icon={faArrowCircleRight}/>
                    </span>
                    </div>))}
                </div>
            </div>) : (<div className="search-location-container">
                <SearchBox placeholder="Your location" onSearch={(searchTerm) => handleSearch(searchTerm, "start")}/>

                <StopoverContainer
                    handleSearch={(searchTerm, keyPrefix) => handleSearch(searchTerm, keyPrefix)}
                    setMapFeaturesToRemove={(stopover) => setStopoverMapFeaturesToRemove(stopover)}
                    updateOriginTransportOption={(keyPrefix, option) => updateOriginTransportOption(keyPrefix, option)}
                />

                <SearchBox placeholder={"Search destination"} onSearch={(searchTerm) => handleSearch(searchTerm, "end")} marker2Name={marker2Name}/>

                <Typography style={{marginTop: '20px'}} variant="h2">Select Transport Option:</Typography>
                <TransportOptions handleOptionChange={(option) => {
                    updateOriginTransportOption("start", option)
                    updateOriginTransportOption("end", option)
                }} isStopoverOption={false}/>
            </div>)}
        </div>
        <OLMap marker={marker} newRoutePoints={routePoints} onMarker2NameUpdate={updateMarker2Name}/>
    </div>)
}

export default HomePage