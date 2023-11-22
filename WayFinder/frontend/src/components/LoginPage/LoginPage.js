import "./LoginPage.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { set } from "ol/transform";
import DOMPurify from 'dompurify';
import validator from "validator";
import {Link} from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [otp, setOtp] = useState("")
  const [requiresOtp, setRequiresOtp] = useState(false)

  function submitLogin(e) {
    e.preventDefault()

    if (!validator.isEmail(email)) {
      return
    }

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
            // sessionStorage.setItem("token", token)
            sessionStorage.setItem("accessToken", res.data.access)
            sessionStorage.setItem("refreshToken", res.data.refresh)
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

  const navigateToRecoveryCodePage = () => {
    sessionStorage.setItem("email", email)
    navigate("/recovery-code")
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
                const sanitizedEmail = DOMPurify.sanitize(e.target.value)
                setEmail(sanitizedEmail)
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
            <button className="btn btn-primary" type="submit">
              Login
            </button>
            <button className="btn btn-primary" type="button" onClick={navigateToRegisterPage}>
              Register
            </button>
          </div>
        </form>
        {!requiresOtp ?
            <Link to="/forgotten-password" className="forgot-password-link">Forgotten Password?</Link> :
            <button className="btn btn-primary" onClick={navigateToRecoveryCodePage}>
              Lost access to OTP device?
            </button>
        }
        {loginError && <p className="error-message">Invalid email or password</p>}
      </div>
    </div>
  );
}