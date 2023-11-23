import SearchBox from "../../SearchBox/SearchBox";
import React, {useEffect, useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TransportOptions from "../TransportOptions/TransportOptions";
import {faMinusCircle, faPlusCircle, faRightLeft} from "@fortawesome/free-solid-svg-icons";

function StopoverContainer({
                               handleSearch, handleOptionChange, setMarkerToRemove
                           }) {

    const STOPOVER_LIMIT = 3
    const [stopovers, setStopovers] = useState([])
    const [isStopoverToAdd, setIsStopoverToAdd] = useState(false)

    const setInitialStopoverState = () => {
        if (stopovers.length === 0) {
            addNewStopover()
            setIsStopoverToAdd(false)
        } else {
            removeStopoversMarkers()
                .then(() => setStopovers([]))
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

    const handleRemoveStopover = (stopoverId) => {
        removeStopover(stopoverId)
        setMarkerToRemove(stopoverId)
    }

    const removeStopoversMarkers = async () => {
        console.log(`stopovers to remove: ${stopovers}`)

        const removeMarkers = async () => {
            for (const stopover of stopovers) {
                await setMarkerToRemove(stopover.id)
            }
        };

        await removeMarkers()
    }

    const setShowAddStopStatus = (stopoverId) => {
        setStopovers((prevStopovers) => {
            return prevStopovers.map((stopover) => stopover.id === stopoverId ? {...stopover, showAddStop: false} : stopover)
        })
    }

    const addNewStopover = (status = true) => {
        setStopovers((prevStopovers) => {
            return [...prevStopovers, {id: prevStopovers.length + 1, searchTerm: '', coordinates: [], showAddStop: status}]
        })
    }

    const removeStopover = (stopoverId) => {
        setStopovers((prevStopovers) => {
            // Update IDs to be consecutive
            return prevStopovers.filter((stopover) => stopover.id !== stopoverId)
                .map((stopover, index) => ({
                    ...stopover,
                    id: index + 1
                }))
        })
    }

    useEffect(() => {
        if (stopovers.length === 0) {
            setIsStopoverToAdd(true)
        }
    }, [stopovers])

    return (<>
            <button className="add-stop-component" onClick={setInitialStopoverState}><FontAwesomeIcon icon={isStopoverToAdd ? faPlusCircle : faMinusCircle}/></button>
            {stopovers.map((stopover) =>
                <div className="stopover-container">
                    <div className="search-box-container">
                        <SearchBox placeholder="Search stopover" onSearch={(searchTerm) => handleSearch(searchTerm, stopover.id)}/>
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