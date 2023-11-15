import SearchBox from "../../SearchBox/SearchBox";
import React, {useState} from "react"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import TransportOptions from "../TransportOptions/TransportOptions";
import {faMinusCircle, faPlusCircle, faRightLeft} from "@fortawesome/free-solid-svg-icons";

function StopoverContainer({
                               stopovers,
                               handleSearch,
                               handleOptionChange,
                               addNewStepover,
                               selectedOption2,
                               setSelectedOption2,
                           }) {
    const STOPOVER_LIMIT = 3
    const [showAddStop, setShowAddStop] = useState(true)
    const [isStopoverToAdd, setIsStopoverToAdd] = useState(false)

    const handleAddNewStopover = () => {
        if (stopovers.length < STOPOVER_LIMIT) {
            addNewStepover()
            setIsStopoverToAdd(!isStopoverToAdd)
            console.log(`Stopover length: (${stopovers.length}).`);
        } else {
            // remove stepover ?
            setShowAddStop(!showAddStop)
            console.log(`Stopover limit reached (${STOPOVER_LIMIT}). Cannot add more stopovers.Stopover length: (${stopovers.length}).`);
        }
    }

    return (
        <>
            {showAddStop && (
                <div className="stopover-container">
                    <div className="search-box-container">
                        <SearchBox placeholder="Search stopover" onSearch={(searchTerm) => handleSearch(searchTerm, 3)} grayText/>
                    </div>
                    <button className="add-stop-component" onClick={handleAddNewStopover}>
                        <FontAwesomeIcon icon={isStopoverToAdd || stopovers.length === STOPOVER_LIMIT ? faMinusCircle : faPlusCircle}/>
                    </button>
                    <TransportOptions selectedOption={selectedOption2} handleOptionChange={(option) => handleOptionChange(option, setSelectedOption2)}/>
                    <FontAwesomeIcon className="add-stop-component" icon={faRightLeft} rotation={90}/>
                </div>
            )}
        </>
    )
}

export default StopoverContainer