import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import "./AboutApp.css";

const AboutApp = () => {
  return (
    <div className="about-container">
      <div className="about-box">
        <h2>About WayFinder</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        {/* You can add more text or customize the content as needed */}

        {/* Back to Login button */}
        <Link to="/login" className="btn btn-secondary">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default AboutApp;

