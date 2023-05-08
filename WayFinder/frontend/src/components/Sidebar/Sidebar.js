import React from "react"
import "./Sidebar.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faBars, faTimes, faHistory} from "@fortawesome/free-solid-svg-icons"

const Sidebar = ({isCollapsed, toggleSidebar, onSearchHistoryClick}) => {
  return (
    <div className={`sidebar${isCollapsed ? " active" : ""}`}>
        <div className="toggle-button" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={isCollapsed ? faTimes: faBars} />
        </div>
        <h2>WayFinder</h2>
        <div className={`search-history-text${isCollapsed ? " active" : " none"}`}
          onClick={onSearchHistoryClick}>
          <p>Search history</p>
        </div>
        <div className={`search-history-icon${isCollapsed ? " none" : " active"}`}
          onClick={onSearchHistoryClick}>
          <FontAwesomeIcon icon={faHistory} />
        </div>
    </div>
  )
}

export default Sidebar