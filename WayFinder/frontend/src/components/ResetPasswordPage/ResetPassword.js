import React, {useState} from "react"
import {useParams, useNavigate} from "react-router-dom"
import "./ResetPassword.css"
import {apiPasswordReset} from "../../lookup/backendLookup"

function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordComplexityError, setPasswordComplexityError] = useState(false)
  const [passwordMatchError, setPasswordMatchError] = useState(false)
  const {uidb64, token} = useParams()
  const [isPopupVisible, setPopupVisible] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [status, setStatus] = useState(0)

  const handlePasswordChange = (event) => setPassword(event.target.value)
  const handleConfirmPasswordChange = (event) => setConfirmPassword(event.target.value)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      setPasswordMatchError(true)
    } else {
      apiPasswordReset(uidb64, token, password, (response, status) => {
        setStatus(status)
        if (status === 204) {
          setPopupMessage("Password reset successful")
          setPopupVisible(true)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
            navigate('/')
        } else if (status === 400) {
          setPopupMessage("Invalid or expired token, clik 'Forgotten Password?' to try again")
          setPopupVisible(true)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
            navigate('/')
        } else if (status === 422) {
          setPasswordComplexityError(true)
        } else {
          setPopupMessage("Unexpected error occurred, try again later")
          setPopupVisible(true)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
            navigate('/')
        }
      })
    }
  }

  return (
    <>
      {isPopupVisible &&
        <div className={(status === 204) ? "popup popup-success" : "popup popup-error"}>
            {popupMessage}
        </div>
      }
      <div className="ResetPasswordPage" style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}>
        <div className="reset-password-form-container">
          <h1>WayFinder</h1>
          <form onSubmit={handleSubmit}>
            <div className="reset-password-form-group">
              <label htmlFor="new-password">New password:</label>
              <input
                type="password"
                id="new-password"
                name="new-password"
                onChange={handlePasswordChange}
                required
              />
              <label htmlFor="new-password">Confirm new password:</label>
              <input
                type="password"
                id="confirm-new-password"
                name="confirm-new-password"
                onChange={handleConfirmPasswordChange}
                required
              />
            </div>
            {passwordMatchError && <p className="error-message">Passwords do not match</p>}
            {passwordComplexityError && <p className="error-message">
                                            Password must include at least one number,
                                            one lowercase and one uppercase letter, one special character,
                                            and be at least 10 characters long.</p>}
            <div className="reset-password-button-container">
              <button className="reset-password-btn" type="submit">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ResetPassword