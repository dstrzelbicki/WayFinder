import React from "react"
import "./LoginPage.css"

function LoginPage() {
  return (
    <div
      className="LoginPage"
      style={{ backgroundImage: `url(${require("./img/worldmap.png")})` }}
    >
      <div className="login-form-container">
        <h1>WayFinder</h1>
        <form>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="button-container">
            <button className="login-btn" type="submit">
              Login
            </button>
            <button className="register-btn" type="submit">
              Register
            </button>
          </div>
        </form>
        <a href="/forgot-password" className="forgot-password-link">Forgotten Password?</a>
      </div>
    </div>
  )
}

export default LoginPage

