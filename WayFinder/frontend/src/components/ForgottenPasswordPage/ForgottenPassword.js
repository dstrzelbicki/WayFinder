import React from "react";
import "./ForgottenPassword.css";

function ForgotPasswordPage() {
  return (
    <div
      className="ForgottenPasswordPage"
      style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
    >
      <div className="login-form-container">
        <h1>WayFinder</h1>
        <form>
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
        <a href="/login" className="back-to-login-link">Back to Login</a>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
