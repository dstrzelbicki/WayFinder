import React from "react";
import "./RegisterPage.css";

function RegisterPage() {
  return (
    <div
      className="RegisterPage"
      style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
    >
      <div className="register-form-container">
        <h1>WayFinder</h1>
        <form>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <a href="/login" className="login-link">
          Back to Login
        </a>
      </div>
    </div>
  );
}

export default RegisterPage;
