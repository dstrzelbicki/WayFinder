import "./RegisterPage.css";
import { client } from "../../../shared";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { set } from "ol/transform";
import validator from "validator";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setLoggedIn] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [passwordComplexityError, setPasswordComplexityError] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [invalidEmailFormat, setInvalidEmailFormat] = useState(false);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      navigate("/");
    }
  }, [navigate]);

  function handlePasswordChange(e) {
    const value = e.target.value;
    setPassword(value);
    setPasswordMatchError(false);
  }

  function validatePasswordComplexity(password) {
    // ensure password length is 10 or more characters
    // includes at least one number, one lowercase and one uppercase letter, and one special character
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{10,}$/;
    return regex.test(password);
  }

  async function register(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordMatchError(true);
      return;
    }
    if (!validatePasswordComplexity(password)) {
      setPasswordComplexityError(true);
      return;
    }

    if (!validator.isEmail(email)) {
      setInvalidEmailFormat(true);
      console.log("Invalid email format");
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
      console.log("Error registering user");
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
          {invalidEmailFormat && <p className="error-message">Invalid email format</p>}
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
            {passwordComplexityError && <p className="error-message">
                                          Password must include at least one number,
                                          one lowercase and one uppercase letter, one special character,
                                          and be at least 10 characters long.</p>}
          </div>
          <button className="btn btn-primary" type="submit">Register</button>
        </form>
        <a href="/" className="login-link">
          Back to Login
        </a>
      </div>
    </div>
  );
}
