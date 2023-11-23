import SearchBox from "../../SearchBox/SearchBox";
import React, {useEffect, useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TransportOptions from "../TransportOptions/TransportOptions";
import {faMinusCircle, faPlusCircle, faRightLeft} from "@fortawesome/free-solid-svg-icons";

function StopoverContainer({
                               handleSearch, handleOptionChange, setMarkerToRemove
                           }) {

    const STOPOVER_LIMIT = 3
    const INITIAL_STOPOVER_STATE = 3
    const [stopovers, setStopovers] = useState([])
    const [isStopoverToAdd, setIsStopoverToAdd] = useState(false)
    const [stopoverSearchTerm, setStopoverSearchTerm] = useState(null)
    const [updatedStopoverId, setUpdatedStopoverId] = useState(null)

    const setInitialStopoverState = () => {
        if (stopovers.length === 0) {
            addNewStopover()
            setIsStopoverToAdd(false)
        } else {
            removeStopoversMarkers()
        }
    }

    const handleAddNewStopover = (stopoverId) => {
        setShowAddStopStatus(stopoverId)
        if (stopovers.length < STOPOVER_LIMIT) {
            const shouldShowAddStop = stopovers.length < STOPOVER_LIMIT - 1
            addNewStopover(shouldShowAddStop)
        } else {
            console.log(`Stopover limit reached (${STOPOVER_LIMIT}). Cannot add more stopovers.`)
        }
    }

    // TODO - should be fixed in future - different indexing mechanism
    const removeStopoversMarkers = () => {
        for (const stopover of stopovers) {
            removeStopover(stopover.id)
            console.log(`removing : ${stopover.id}`)
            setMarkerToRemove(stopover.id)
        }
    }

    const handleRemoveStopover = async (stopoverId) => {
        removeStopover(stopoverId)
        setMarkerToRemove(stopoverId)
        setUpdatedStopoverId(stopoverId)
    }

    const setShowAddStopStatus = (stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {...stopover, showAddStop: false} : stopover)
        })
    }

    const addNewStopover = (status = true) => {
        setStopovers((prevStopovers) => {
            const newStopoverId = prevStopovers.length + INITIAL_STOPOVER_STATE;
            const newStopovers = [
                ...prevStopovers,
                {id: newStopoverId, searchTerm: '', coordinates: [], showAddStop: status}
            ];
            setUpdatedStopoverId(newStopoverId)
            setStopoverSearchTerm(''); // Reset the stopoverSearchTerm when adding a new stopover
            return newStopovers
        })
    }

    const removeStopover = (stopoverId) => {
        setStopovers((prevStopovers) => {
            // Update IDs to be consecutive
            return prevStopovers
                .filter((stopover) => stopover.id !== stopoverId)
                .map((stopover, index) => ({
                    ...stopover,
                    id: index + INITIAL_STOPOVER_STATE,
                }))
        })
    }

    const updateStopoverWithSearchTerm = (searchTerm, stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {...stopover, searchTerm: searchTerm} : stopover)
        })
    }

    useEffect(() => {
        if (stopovers.length === 0) {
            setIsStopoverToAdd(true)
        }
    }, [stopovers])

    useEffect(() => {
        console.log(`stopovers state: ${JSON.stringify(stopovers)}`)
    }, [stopovers])

    useEffect(() => {
        setStopoverSearchTerm(stopovers.find((stopover) => stopover.id === updatedStopoverId)?.searchTerm || '')
    }, [updatedStopoverId])

    return (<>
            <button className="add-stop-component" onClick={setInitialStopoverState}><FontAwesomeIcon icon={isStopoverToAdd ? faPlusCircle : faMinusCircle}/></button>
            {stopovers.map((stopover) =>
                <div className="stopover-container">
                    <div className="search-box-container">
                        <SearchBox placeholder="Search stopover" onSearch={(searchTerm) => {
                            handleSearch(searchTerm, stopover.id)
                            updateStopoverWithSearchTerm(searchTerm, stopover.id)
                        }} marker2Name={stopoverSearchTerm}/>
                    </div>
                    <button className="add-stop-component" onClick={stopover.showAddStop ? () => handleAddNewStopover(stopover.id) : () => handleRemoveStopover(stopover.id)}>
                        <FontAwesomeIcon icon={stopover.showAddStop ? faPlusCircle : faMinusCircle}/>
                    </button>
                    <TransportOptions selectedOption={stopover.searchTerm} handleOptionChange={handleOptionChange}/>
                    <FontAwesomeIcon className="add-stop-component" icon={faRightLeft} rotation={90}/>
                </div>
            )}
        </>
    )
}

export default StopoverContainer