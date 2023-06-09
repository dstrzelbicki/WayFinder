import React from "react";
import "./ResetPassword.css";

function ResetPassword() {
  return (
    <div className="ResetPasswordPage" style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}>
      <div className="reset-password-form-container">
        <h1>WayFinder</h1>
        <form>
          <div className="reset-password-form-group">
            <label htmlFor="new-password">New Password:</label>
            <input type="password" id="new-password" name="new-password" required />
          </div>
          <div className="reset-password-button-container">
            <button className="reset-password-btn" type="submit">
              Reset Password
            </button>
          </div>
        </form>
        <a href="/login" className="back-to-login-link">Back to Login</a>
      </div>
    </div>
  );
}

export default ResetPassword;
