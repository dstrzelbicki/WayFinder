import SearchBox from "../../SearchBox/SearchBox";
import React, {useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TransportOptions from "../TransportOptions/TransportOptions";
import {faMinusCircle, faPlusCircle, faRightLeft} from "@fortawesome/free-solid-svg-icons";

function StopoverContainer({
                               handleSearch, handleOptionChange, setInitialStopoverState
                           }) {

    const STOPOVER_LIMIT = 3
    const [stopovers, setStopovers] = useState([{id: 1, searchTerm: '', coordinates: [], showAddStop: true}])

    const handleAddNewStopover = (stopoverId) => {
        setShowAddStopStatus(stopoverId)
        if (stopovers.length < STOPOVER_LIMIT) {
            const shouldShowAddStop = stopovers.length !== STOPOVER_LIMIT - 1
            addNewStopover(shouldShowAddStop)
        } else {
            console.log(`Stopover limit reached (${STOPOVER_LIMIT}). Cannot add more stopovers.`)
        }
    }

    const handleRemoveStopover = (stopoverId) => {
        removeStopover(stopoverId)
        if(stopovers.length === 1) setInitialStopoverState()
    }

    const setShowAddStopStatus = (stopoverId) => {
        setStopovers((prevStopovers) => prevStopovers.map((stopover) => stopover.id === stopoverId ? {...stopover, showAddStop: false} : stopover)
        )
    }

    const addNewStopover = (status = true) => {
        setStopovers((prevStopovers) => [...prevStopovers, {id: prevStopovers.length + 1, searchTerm: '', coordinates: [], showAddStop: status}])
    }

    const removeStopover = (stopoverId) => {
        setStopovers((prevStopovers) => prevStopovers.filter((stopover) => stopover.id !== stopoverId));
    }

    return (
        (stopovers.map((stopover) =>
                <div className="stopover-container">
                    <div className="search-box-container">
                        <SearchBox placeholder="Search stopover" onSearch={(searchTerm) => handleSearch(searchTerm, 3)} grayText/>
                    </div>
                    <button className="add-stop-component" onClick={stopover.showAddStop ? () => handleAddNewStopover(stopover.id) : () => handleRemoveStopover(stopover.id)}>
                        <FontAwesomeIcon icon={stopover.showAddStop ? faPlusCircle : faMinusCircle}/>
                    </button>
                    <TransportOptions selectedOption={stopover.searchTerm} handleOptionChange={handleOptionChange}/>
                    <FontAwesomeIcon className="add-stop-component" icon={faRightLeft} rotation={90}/>
                </div>)
        ))
}

export default StopoverContainer