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

    const [marker2Name, setMarker2Name] = useState("")
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [searchHistory, setSearchHistory] = useState([])
    const [routePoints, setRoutePoints] = useState(new Map())
    const [markers, setMarkers] = useState(new Map())
    // internal
    const [originRoutePoints, setOriginRoutePoints] = useState(new Map())

    const createMarker = (coordinates = [], isToRemove = false) => ({
        coordinates, isToRemove
    })

    const createRoutePoint = (coordinates = [], transportOption = '') => ({
        coordinates, transportOption
    })

    const toggleSidebar = () => {
        setIsSidebarNotCollapsed(!isSidebarNotCollapsed)
    }

    const handleSearch = async (searchTerm, keyPrefix) => {
        const data = await geocode(searchTerm)

        if (data.results && data.results.length > 0) {

            const {lat, lon} = data.results[0]
            const routeCoordinates = [parseFloat(lon), parseFloat(lat)]
            const newMarker = createMarker(routeCoordinates)
            setMarkers(prevMarkers => new Map([...prevMarkers, [keyPrefix, newMarker]]))
            console.log(`Marker:`, searchTerm, "Coordinates: ", lat, lon)

            updateOriginRoutePointWithCoordinates(keyPrefix, routeCoordinates)

            sessionStorage.setItem(keyPrefix, searchTerm)
            sessionStorage.setItem(`${keyPrefix}Lat`, lat)
            sessionStorage.setItem(`${keyPrefix}Lon`, lon)

            // save searched location to db
            let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
            searchHistory.push({searchTerm, timestamp: new Date()})
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))

            let locationData = {name: searchTerm, lat: lat, lng: lon}
            apiPostSearchedLocation(locationData, (response, status) => {})

        } else {
            updateOriginRoutePointWithCoordinates(keyPrefix, null)
            console.error(`No geocode results found for: `, searchTerm)
        }
    }

    const removeOldMarkerWithTheSameKey = (keyPrefix) => {
        let existingMarker = markers.get(keyPrefix)
        if (existingMarker) {
            const updatedMarkers = new Map(markers)
            updatedMarkers.delete(keyPrefix)
            setMarkers(updatedMarkers)
        }
    }

    const removeOldRoutePointWithTheSameKey = (keyPrefix) => {
        let existingRoutePoint = routePoints.get(keyPrefix)
        if (existingRoutePoint) {
            const updatedRoutePoints = new Map(routePoints)
            updatedRoutePoints.delete(keyPrefix)
            setRoutePoints(updatedRoutePoints)
        }
    }

    const removeOldOriginRoutePointWithTheSameKey = (keyPrefix) => {
        let existingRoutePoint = originRoutePoints.get(keyPrefix)
        if (existingRoutePoint) {
            const updatedRoutePoints = new Map(originRoutePoints)
            updatedRoutePoints.delete(keyPrefix)
            setOriginRoutePoints(updatedRoutePoints)
        }
    }

    const removeAllStopoversFeatures = () => {

        const removeRouteItems = (map, setMap) => {
            const filterMapByKeys = (map, predicate) => {
                return new Map(Array.from(map.entries()).filter(([key]) => predicate(key)))
            }
            const updatedMap = filterMapByKeys(map, (key) => key === 'start' || key === 'end')
            setMap(updatedMap)
        }


        removeRouteItems(routePoints, setRoutePoints)
        removeRouteItems(originRoutePoints, setOriginRoutePoints)
        removeRouteItems(markers, setMarkers)
    }

    const removeStopoverFeatures = (key) => {
        removeOldRoutePointWithTheSameKey(key)
        removeOldMarkerWithTheSameKey(key)
        removeOldOriginRoutePointWithTheSameKey(key)
    }

    const updateOriginRoutePointWithTransportOption = (keyPrefix, option) => {
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

    const updateMarker2Name = (name) => {
        setMarker2Name(name)
    }

    useEffect(() => {
        originRoutePoints.forEach((originRoutePoint, key) => {
            if (originRoutePoint.coordinates && originRoutePoint.transportOption) {

                let newRoutePoint = createRoutePoint(originRoutePoint.coordinates, originRoutePoint.transportOption);

                setRoutePoints((prevRoutePoints) => {
                    const newRoutePoints = new Map(prevRoutePoints)

                    if (newRoutePoints.has(key)) {
                        const prevValue = newRoutePoints.get(key)
                        const updatedValue = {
                            ...prevValue,
                            coordinates: newRoutePoint.coordinates,
                            transportOption: newRoutePoint.transportOption
                        }
                        newRoutePoints.set(key, updatedValue)
                    } else {
                        newRoutePoints.set(key, {
                            coordinates: newRoutePoint.coordinates,
                            transportOption: newRoutePoint.transportOption
                        })
                    }

                    return newRoutePoints
                })

            } else {
                removeOldRoutePointWithTheSameKey(key)
            }
        })
    }, [originRoutePoints])

    useEffect(() => {
        apiGetSearchedLocations((response, status) => {
            if (status === 200) {
                setSearchHistory(response)
            } else {
                console.log("Unable to fetch search history")
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
                    {searchHistory && searchHistory.map((item, index) => (
                        <div key={item.id} className="search-history-item" onClick={() => {
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
                    removeStopoverFeatures={(stopoverId) => removeStopoverFeatures(stopoverId)}
                    removeAllStopoversFeatures={removeAllStopoversFeatures}
                    updateOriginTransportOption={(keyPrefix, option) => updateOriginRoutePointWithTransportOption(keyPrefix, option)}
                />

                <SearchBox placeholder={"Search destination"} onSearch={(searchTerm) => handleSearch(searchTerm, "end")}
                           marker2Name={marker2Name}/>

                <Typography style={{marginTop: '20px'}} variant="h2">Select Transport Option:</Typography>
                <TransportOptions handleOptionChange={(option) => {
                    updateOriginRoutePointWithTransportOption("start", option)
                    updateOriginRoutePointWithTransportOption("end", option)
                }} isStopoverOption={false}/>
            </div>)}
        </div>
        <OLMap newMarkers={markers} newRoutePoints={routePoints} onMarker2NameUpdate={updateMarker2Name}/>
    </div>)
}

export default HomePage