import React from "react";
import "./ForgottenPassword.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import validator from "validator";

const [isPopupVisible, setPopupVisible] = useState(false)
const [popupMessage, setPopupMessage] = useState("")

const sendPasswordResetEmail = (email) => {
  fetch('/api/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Handle the response from the server
      console.log(data); // You can log or display a success message here
    })
    .catch((error) => {
      // Handle any errors
      console.error(error);
    });
};

const handleSubmit = (event) => {
  event.preventDefault(); // Prevent the default form submission

  const email = event.target.email.value; // Get the value of the email input field
  const sanitizedEmail = DOMPurify.sanitize(email)

  if (validator.isEmail(sanitizedEmail)) {
    setSearchValue(sanitizedEmail)
  } else {
    setPopupMessage("Invalid email address")
    setPopupVisible(true)
      setTimeout(() => {
        setPopupVisible(false)
      }, 3000)
  }

  // Call a function to send the email to the server
  sendPasswordResetEmail(email);
};

function ForgotPasswordPage() {
  return (
    <>
      {isPopupVisible &&
                <div className="popup popup-error">
                    {popupMessage}
                </div>
      }
      <div
        className="ForgottenPasswordPage"
        style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
      >
        <div className="login-form-container">
          <h1>WayFinder</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className="button-container">
              <button className="send-email-btn" type="submit">
                Send Email
              </button>
            </div>
          </form>
          <a href="/" className="back-to-login-link">Back to Login</a>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
