import React from "react";
import { Link } from "react-router-dom";
import "./AboutApp.css";

const AboutApp = () => {
  return (
      <div
      className="LoginPage"
      style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
      >
    <div className="about-container">
      <div className="about-box">
        <h2>About WayFinder</h2>
        <p>
          WayFinder is an application, used for navigation, which, in addition to the basic functionality
          for determining the route, offers the possibility of combining several different forms of transport
          into a single route with the flexibility to modify it. Thanks to this feature, users can plan their
          trips more efficiently and optimally, using different forms of transportation depending on their
          needs and requirements. Thanks to this, travelers can, avoid using several different apps or services
          to find the right route, and still enjoy flexible planning.
        </p>
        <Link to="/login" className="back-to-login">
          Back to Login
        </Link>
      </div>
    </div>
      </div>
  );
};

export default AboutApp;

