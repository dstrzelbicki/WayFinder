import React, { useState } from "react"
import "./RecoveryCodePage.css"
import {apiVerifyRecoveryCode} from "../../lookup/backendLookup"
import { useNavigate } from "react-router-dom"

function RecoveryCodePage() {
  const [recoveryCode, setRecoveryCode] = useState('')
  const [invalidCode, setInvalidCode] = useState(false)
  const [isLoggedIn, setLoggedIn] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    // call the backend to verify the recovery code
    apiVerifyRecoveryCode(recoveryCode, sessionStorage.getItem('email'), (response, status) => {
      if(status === 200) {
        const token = response.token
        sessionStorage.setItem("isLoggedIn", "true")
        sessionStorage.setItem("token", token)
        sessionStorage.removeItem("email")
        setLoggedIn(true)
        navigate("/home")
      } else {
        setInvalidCode(true)
      }
    })
  }

  return (
    <div
        className="recovery-code-page"
        style={{ backgroundImage: `url(${require("../../assets/img/worldmap.png")})` }}
    >
        <div className="recovery-code-form-container">
            <h1>WayFinder</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="recover-code">Enter recovery code:</label>
                    <input
                        type="password"
                        id="recover-code"
                        name="recover-code"
                        value={recoveryCode}
                        onChange={(e) => {
                            setRecoveryCode(e.target.value)
                        }}
                    />
                </div>
                <div className="button-container">
                    <button className="btn btn-primary" type="submit">
                        Submit
                    </button>
                </div>
            </form>
            {invalidCode && <p className="error-message">Invalid or already used recovery code</p>}
        </div>
    </div>
  )
}

export default RecoveryCodePage