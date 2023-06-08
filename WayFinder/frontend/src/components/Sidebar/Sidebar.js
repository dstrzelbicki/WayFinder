import React from "react";
import "./Sidebar.css";
import { client } from "../../../shared";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faHistory, faUserAlt, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = ({ isNotCollapsed, toggleSidebar, onSearchHistoryClick }) => {
  const navigate = useNavigate(); // Get the navigate function from react-router

  const handleLogout = async () => {
    try {
      await client.post("/api/logout"); // Send a POST request to the logout endpoint
      sessionStorage.removeItem("isLoggedIn");
      navigate("/"); // Navigate to the login page
    } catch (error) {
      console.log(error);
      // Handle any error that occurred during the logout process
    }
  };

  return (
    <div className={`sidebar${isNotCollapsed ? " active" : ""}`}>
        <div className="toggle-button" onClick={toggleSidebar} role="button" aria-label="toggle sidebar">
          <FontAwesomeIcon icon={isNotCollapsed ? faTimes: faBars} />
        </div>
        <h2>WayFinder</h2>
        <div className={`sidebar-text${isNotCollapsed ? " active" : " none"}`}
          onClick={onSearchHistoryClick}>
          <p>Search history</p>
        </div>
        <div className={`search-history-icon${isNotCollapsed ? " none" : " active"}`}
          onClick={onSearchHistoryClick} role="button" aria-label="history icon">
          <FontAwesomeIcon icon={faHistory} />
        </div>
        <div className={`sidebar-text${isNotCollapsed ? " active" : " none"}`}>
          <Link to={"/user-dashboard/profile"} style={{textDecoration: "none", color: "inherit"}}>User dashboard</Link>
        </div>
        <div className={`user-icon${isNotCollapsed ? " none" : " active"}`}>
          <Link to={"/user-dashboard/profile"} style={{textDecoration: "none", color: "inherit"}}><FontAwesomeIcon icon={faUserAlt} /></Link>
        </div>
        <div className={`sidebar-text${isNotCollapsed ? " active" : " none"}`}>
          <Link to={"/logout"} style={{textDecoration: "none", color: "inherit"}}>Logout</Link>
        </div>
        <div className={`logout-icon${isNotCollapsed ? " none" : " active"}`}>
          <Link to={"/logout"} style={{textDecoration: "none", color: "inherit"}}><FontAwesomeIcon icon={faSignOut} /></Link>
        </div>
    </div>
  );
};

export default Sidebar;
