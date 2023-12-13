import SearchBox from "../../SearchBox/SearchBox";
import React, {useEffect, useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TransportOptions from "../TransportOptions/TransportOptions";
import {faMinusCircle, faPlusCircle, faRightLeft} from "@fortawesome/free-solid-svg-icons";

function StopoverContainer({
                               handleSearch,
                               removeStopoverFeatures,
                               removeAllStopoversFeatures,
                               updateOriginTransportOption
                           }) {

    const STOPOVER_LIMIT = 3
    const [stopovers, setStopovers] = useState([])
    const [isStopoverToAdd, setIsStopoverToAdd] = useState(false)
    const [stopoverSearchTerm, setStopoverSearchTerm] = useState(null)
    const [updatedStopoverId, setUpdatedStopoverId] = useState(null)

    const setInitialStopoverState = () => {
        if (stopovers.length === 0) {
            addNewStopover()
            setIsStopoverToAdd(false)
        } else {
            removeAllStopovers()
        }
    }

    const handleAddNewStopover = (stopover) => {
        setShowAddStopStatus(stopover.id)
        if (stopovers.length < STOPOVER_LIMIT) {
            const shouldShowAddStop = stopovers.length < STOPOVER_LIMIT - 1
            addNewStopover(shouldShowAddStop)
        } else {
            console.log(`Stopover limit reached (${STOPOVER_LIMIT}). Cannot add more stopovers.`)
        }
    }

    const handleRemoveStopover = (stopover) => {
        removeStopover(stopover.id)
        setUpdatedStopoverId(stopover.id)
        removeStopoverFeatures(stopover.id)
    }

    const removeAllStopovers = () => {
        removeAllStopoversFeatures()
        setStopovers([])
    }

    const setShowAddStopStatus = (stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {
                ...stopover,
                showAddStop: false
            } : stopover)
        })
    }

    const addNewStopover = (status = true) => {
        setStopovers((prevStopovers) => {
            const newStopoverId = prevStopovers.length;
            const newStopovers = [
                ...prevStopovers,
                {id: prevStopovers.length, searchTerm: '', showAddStop: status, transportOption: ''}
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
                    id: index
                }))
        })
    }

    const updateStopoverWithSearchTerm = (searchTerm, stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {
                ...stopover,
                searchTerm: searchTerm
            } : stopover)
        })
    }

    const updateStopoverWithTransportOption = (option, stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {
                ...stopover,
                transportOption: option
            } : stopover)
        })
        updateOriginTransportOption(stopoverId, option)
    }

    useEffect(() => {
        if (stopovers.length === 0) {
            setIsStopoverToAdd(true)
        }
    }, [stopovers])

    useEffect(() => {
        setStopoverSearchTerm(stopovers.find((stopover) => stopover.id === updatedStopoverId)?.searchTerm || '')
    }, [updatedStopoverId])

    return (<>
            <button className="add-stop-component" onClick={setInitialStopoverState}><FontAwesomeIcon
                icon={isStopoverToAdd ? faPlusCircle : faMinusCircle}/></button>
            {stopovers.map((stopover) =>
                <div>
                    <div className="search-box-container">
                        <SearchBox placeholder="Search stopover" onSearch={(searchTerm) => {
                            handleSearch(searchTerm, stopover.id)
                            updateStopoverWithSearchTerm(searchTerm, stopover.id)
                        }} marker2Name={stopoverSearchTerm}/>
                    </div>
                    <button className="add-stop-component"
                            onClick={stopover.showAddStop ? () => handleAddNewStopover(stopover) : () => handleRemoveStopover(stopover)}>
                        <FontAwesomeIcon icon={stopover.showAddStop ? faPlusCircle : faMinusCircle}/>
                    </button>
                    <TransportOptions
                        handleOptionChange={(option) => updateStopoverWithTransportOption(option, stopover.id)}
                        isStopoverOption={true}/>
                    <FontAwesomeIcon className="add-stop-component" icon={faRightLeft} rotation={90}/>
                </div>
            )}
        </>
    )
}

export default StopoverContainer