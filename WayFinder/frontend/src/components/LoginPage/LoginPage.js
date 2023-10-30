import "./LoginPage.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [otp, setOtp] = useState("")
  const [requiresOtp, setRequiresOtp] = useState(false)

  function submitLogin(e) {
    e.preventDefault();
    const data = {
      email: email,
      password: password,
    }
    if (requiresOtp) {
      data.otp = otp
    }
    client
      .post("/api/login", data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(function (res) {
        if (res.status === 200) {
          if (res.data.requires_otp) {
            // 2FA is required, prompt the user for OTP
            setRequiresOtp(true)
          } else {
            // Login successful
            const token = res.data.token
            sessionStorage.setItem("isLoggedIn", "true")
            sessionStorage.setItem("token", token)
            setLoggedIn(true)
            navigate("/home")
          }
        } else {
          // Login failed
          setLoginError(true);
        }
      })
      .catch(function (error) {
        setLoginError(true)
        console.log(error.response)
      })
  }

  function navigateToRegisterPage() {
    navigate("/register");
  }

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div
      className="LoginPage"
      style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
    >
      <div className="login-form-container">
        <h1>WayFinder</h1>
        <form onSubmit={submitLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </div>
          {requiresOtp && (
              <div className="form-group">
                <label htmlFor="otp">OTP:</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value)
                  }}
                />
              </div>
          )}
          <div className="button-container">
            <button className="login-btn" type="submit">
              Login
            </button>
            <button className="register-btn" type="button" onClick={navigateToRegisterPage}>
              Register
            </button>
          </div>
        </form>
        <a href= "http://127.0.0.1:8000/api/password_reset" className="forgot-password-link">
          Forgotten Password?
        </a>
        {loginError && <p className="error-message">Invalid email or password</p>}
      </div>
    </div>
  );
}