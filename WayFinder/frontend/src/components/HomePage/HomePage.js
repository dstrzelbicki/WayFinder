import React, {useState} from "react"
import {BrowserRouter as Router, Route, Routes,} from "react-router-dom"
import OLMap from "../Map/Map"
import SearchBar from "../SearchBar/SearchBar"
import {geocode} from "../../services/mapServices"
import Sidebar from "../Sidebar/Sidebar"
import "./HomePage.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faArrowCircleRight, faMinus, faPlus, faTimes} from "@fortawesome/free-solid-svg-icons"
import {Checkbox, FormControlLabel, FormGroup, ListItemIcon, Typography} from "@material-ui/core";
import {DirectionsBike, DriveEta} from "@material-ui/icons";
import {useEffect} from "react"

const HomePage = () => {
    const [marker1, setMarker1] = useState(null)
    const [marker2, setMarker2] = useState(null)
    const [marker3, setMarker3] = useState(null)
    const [marker2Name, setMarker2Name] = useState("")
    const [isSidebarNotCollapsed, setIsSidebarNotCollapsed] = useState(false)
    const [showSearchHistory, setShowSearchHistory] = useState(false)
    const [showAddStop, setShowAddStop] = useState(false);
    const [isMinusIcon, setIsMinusIcon] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

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
            } else if(searchBarId === 2) {
                setMarker2(coordinates)
            } else {
                setMarker3(coordinates)
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
        if (selectedOption === option) {
            setSelectedOption('');
        } else {
            setSelectedOption(option);
        }
    };

    const isOptionSelected = (option) => {
        return selectedOption === option;
    };

    useEffect(() => {
        if (isMinusIcon) {
            setSelectedOption('')
        }
    }, [isMinusIcon])


    //Use 'ctrl + /' to display different pages
    return (
        // <LoginPage></LoginPage>
        // <RegisterPage></RegisterPage>
        // <ForgottenPassword></ForgottenPassword>
        <Router>
            <div className="full-height-container">
                <Sidebar
                    isNotCollapsed={isSidebarNotCollapsed}
                    toggleSidebar={toggleSidebar}
                    onSearchHistoryClick={() => {
                        setShowSearchHistory(true)
                        setIsSidebarNotCollapsed(false)
                    }}
                />
                <div className="search-container">
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
                        <>
                            <div className="search-bar-container">
                                <SearchBar placeholder="Search first location" onSearch={(searchTerm) => handleSearch(searchTerm, 1)} />
                                <button className="add-stop-button" onClick={handleAddStop}>
                                    <FontAwesomeIcon icon={isMinusIcon ? faMinus : faPlus} />
                                </button>
                                <br/>
                            </div>
                            {showAddStop && (
                                <div className="search-bar-container">
                                    <SearchBar placeholder="Add stop" onSearch={(searchTerm) => handleSearch(searchTerm, 3)} grayText />
                                </div>
                            )}
                                <br/>
                            <div className="search-bar-container">
                                <SearchBar placeholder={marker2Name || "Search second location"} onSearch={(searchTerm) => handleSearch(searchTerm, 2)} />
                            </div>
                            <div className="transport-options-container">
                                <Typography variant="subtitle1">Select Transport Options:</Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isOptionSelected('Car')}
                                                onChange={() => handleOptionChange('Car')}
                                                color="primary"
                                                disabled={selectedOption && !isOptionSelected('Car')}
                                            />
                                        }
                                        label={
                                            <div>
                                                <ListItemIcon>
                                                    <DriveEta/>
                                                </ListItemIcon>
                                                <span>Car</span>
                                            </div>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={isOptionSelected('Bicycle')}
                                                onChange={() => handleOptionChange('Bicycle')}
                                                disabled={selectedOption && !isOptionSelected('Bicycle')}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <div>
                                                <ListItemIcon>
                                                    <DirectionsBike/>
                                                </ListItemIcon>
                                                <span>Bicycle</span>
                                            </div>
                                        }
                                    />
                                </FormGroup>
                                <Typography variant="subtitle2">Selected Options: {selectedOption}</Typography>
                            </div>
                        </>
                    )}
                </div>
                <OLMap marker1={marker1} marker2={marker2} marker3={marker3} transportOption={selectedOption} onMarker2NameUpdate={updateMarker2Name} isPlusIcon={!isMinusIcon}/>
            </div>
            <Routes>
                <Route exact path="/"/>
            </Routes>
        </Router>
    )
}

export default HomePage