import "./RegisterPage.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setLoggedIn] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [passwordLengthError, setPasswordLengthError] = useState(false);
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      navigate("/");
    }
  }, [navigate]);

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setPasswordMatchError(false);
    setPasswordLengthError(false);
  }

  async function register(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordMatchError(true);
      return;
    }
    if (password.length < 8) {
      setPasswordLengthError(true);
      return;
    }
    
    try {
      const response = await client.post(
        "/api/register",
        {
          username: username,
          email: email,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        navigate('/')
        alert("Successful registration! Now you can log in to your account.");
      } else {
        setLoginError(true);
      }
    } catch (error) {
      setLoginError(true);
      console.log(error.response);
    }
  }

  return (
    <div
      className="RegisterPage"
      style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
    >
      <div className="register-form-container">
        <h1>WayFinder</h1>
        <form onSubmit={register}>
          <div className="form-group">
            <label htmlFor="name">Username:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              required
            />
          </div>
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
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
              required
            />
            {passwordMatchError && <p className="error-message">Passwords do not match</p>}
            {passwordLengthError && <p className="error-message">Password should be at least 8 characters</p>}
          </div>
          <button type="submit">Register</button>
        </form>
        <a href="/" className="login-link">
          Back to Login
        </a>
      </div>
    </div>
  );
}
