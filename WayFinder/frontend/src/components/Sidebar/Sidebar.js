import React from "react"
import "./Sidebar.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faBars, faTimes} from "@fortawesome/free-solid-svg-icons"

const Sidebar = ({isCollapsed, toggleSidebar}) => {
  return (
    <div className={`sidebar${isCollapsed ? " active" : ""}`}>
        <div className="toggle-button" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={isCollapsed ? faTimes: faBars} />
        </div>
        <h2>WayFinder</h2>
    </div>
  )
}

export default Sidebar