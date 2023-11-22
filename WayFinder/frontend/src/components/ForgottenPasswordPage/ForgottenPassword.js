import React from "react";
import "./ForgottenPassword.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import validator from "validator";
import DOMPurify from "dompurify";
import { apiForgottenPassword } from "../../lookup/backendLookup";
import { set } from "ol/transform";

function ForgottenPasswordPage() {
  const [isPopupVisible, setPopupVisible] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState(0)

  const sendPasswordResetEmail = (email) => {
    apiForgottenPassword(email, (response, status) => {
      setStatus(status)
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const sanitizedEmail = DOMPurify.sanitize(event.target.email.value)

    if (validator.isEmail(sanitizedEmail)) {
      setEmail(sanitizedEmail)
      sendPasswordResetEmail(sanitizedEmail)
    } else {
      setPopupMessage("Invalid email address")
      setPopupVisible(true)
        setTimeout(() => {
          setPopupVisible(false)
        }, 3000)
    }
  }

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
            {status !== 200 ?
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input type="email" id="email" name="email" required />
                </div>
                <div className="button-container">
                  <button className="send-email-btn" type="submit">
                    Send email
                  </button>
                </div>
              </form>
              : <div>
                  <p>If your email is registered, you will receive a password reset link.</p>
                  <p>Check your inbox</p>
                </div>}
            <a href="/" className="back-to-login-link">Back to Login</a>
          </div>
        </div>
      </>
    );
  }

export default ForgottenPasswordPage