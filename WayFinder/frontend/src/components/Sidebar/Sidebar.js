import React from "react"
import "./Sidebar.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faBars, faTimes, faHistory} from "@fortawesome/free-solid-svg-icons"

const Sidebar = ({isNotCollapsed, toggleSidebar, onSearchHistoryClick}) => {
  return (
    <div className={`sidebar${isNotCollapsed ? " active" : ""}`}>
        <div className="toggle-button" onClick={toggleSidebar} role="button" aria-label="toggle sidebar">
          <FontAwesomeIcon icon={isNotCollapsed ? faTimes: faBars} />
        </div>
        <h2>WayFinder</h2>
        <div className={`search-history-text${isNotCollapsed ? " active" : " none"}`}
          onClick={onSearchHistoryClick}>
          <p>Search history</p>
        </div>
        <div className={`search-history-icon${isNotCollapsed ? " none" : " active"}`}
          onClick={onSearchHistoryClick} role="button" aria-label="history icon">
          <FontAwesomeIcon icon={faHistory} />
        </div>
    </div>
  )
}

export default Sidebar