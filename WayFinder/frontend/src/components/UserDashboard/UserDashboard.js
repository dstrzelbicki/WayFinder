import React, {useState, useEffect, createContext, useContext} from "react"
import {Link, useParams} from "react-router-dom"
import "./UserDashboard.css"
import {useCurrentUser} from "../../auth/hooks"
import {apiProfileDataChange, apiPasswordChange,
        apiUserRoutes, apiProfileData} from "../../lookup/backendLookup"
import PasswordStrengthBar from "react-password-strength-bar"
import QRCode from "qrcode.react";
import {apiSetupTOTP, apiVerifyTOTP, apiDisableTOTP} from "../../lookup/backendLookup"

const Notifications = () => <div>Notifications</div>
const Shared = () => <div>Shared</div>
const Places = () => <div>Saved places</div>
const Routes = () => <div>Saved routes</div>
const Timeline = () => <div>Timeline</div>

const UserContext = createContext()

function DisableTOTP({ onUpdate }) {
    const [otp, setOtp] = useState("")
    const [isPopupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [status, setStatus] = useState(null)

    const handleVerify = () => {
        // call the backend to verify the OTP
        apiVerifyTOTP(otp, 'disable', (response, status) => {
            if(status === 200) {
                // call the backend to disbale 2FA
                apiDisableTOTP((response, status) => {
                    if(status === 200) {
                        setPopupMessage("2FA disabled")
                        setPopupVisible(true)
                        setStatus(status)
                        setTimeout(() => {
                            setPopupVisible(false)
                            onUpdate(false)
                        }, 3000)
                    } else {
                        setPopupMessage("Unable to disable 2FA, try again later")
                        setPopupVisible(true)
                        setStatus(status)
                        setTimeout(() => {
                            setPopupVisible(false)
                        }, 3000)
                    }
                })
            } else {
                setPopupMessage("Invalid OTP")
                setPopupVisible(true)
                setStatus(status)
                setTimeout(() => {
                    setPopupVisible(false)
                }, 3000)
            }
        })
    }

    return (
        <div className="content">
            <h3>Disable Two-Factor Authentication</h3>
            <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter OTP"
            />
            <button className="btn btn-primary" onClick={handleVerify}>Verify</button>
            {isPopupVisible &&
                <div className={(status === 200) ? "popup popup-success" : "popup popup-error"}>
                    {popupMessage}
                </div>
            }
        </div>
    )
}

function SetupTOTP({ onUpdate }) {
    const [provisioningUrl, setProvisioningUrl] = useState("")
    const [recoveryCodes, setRecoveryCodes] = useState([])
    const [otp, setOtp] = useState("")
    const [isPopupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [status, setStatus] = useState(null)
    const [otpVerified, setOtpVerified] = useState(false)

    useEffect(() => {
      // call the backend to get the provisioning URL
      apiSetupTOTP((response, status) => {
        if(status === 200) {
          setProvisioningUrl(response.provisioning_url)
        } else {
            setPopupMessage("Unable to fetch QR code, try again later")
            setPopupVisible(true)
            setStatus(status)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
        }
      })
    }, [])

    const handleVerify = () => {
      // call the backend to verify the OTP
      apiVerifyTOTP(otp, 'enable', (response, status) => {
        if(status === 200) {
            setRecoveryCodes(response.recovery_codes)
            setOtpVerified(true)
            setPopupMessage("2FA enabled successfully")
            setPopupVisible(true)
            setStatus(status)
            setTimeout(() => {
                setPopupVisible(false)
                //onUpdate(true)
            }, 3000)
        } else {
            setPopupMessage("Invalid OTP")
            setPopupVisible(true)
            setStatus(status)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
        }
      })
    }

    const recoveryCodesSaved = () => {
        setRecoveryCodes([])
        onUpdate(true)
    }

    return (
      <div className="content">
        {!otpVerified ? <>
            <h3>Setup Two-Factor Authentication</h3>
            {provisioningUrl && <div className="qr-code"><QRCode value={provisioningUrl} /></div>}
            <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            placeholder="Enter OTP"
            />
            <button className="btn btn-primary" onClick={handleVerify}>Verify</button>
            {isPopupVisible &&
                    <div className={(status === 200) ? "popup popup-success" : "popup popup-error"}>
                        {popupMessage}
                    </div>
            } </>
        : <>
        {recoveryCodes.length > 0 && (
          <div className="recovery-codes">
            <h4>Recovery Codes</h4>
            <p>Save these codes in a secure place. You can use them to regain access to your account if your two-factor authentication device is lost.</p>
            <ul>
              {recoveryCodes.map((code, index) => (
                <li key={index}>{code}</li>
              ))}
            </ul>
            <button className="btn btn-primary" onClick={recoveryCodesSaved}>I saved my codes</button>
          </div>
        )}
        </>}
      </div>
    )
}

export function Settings() {
    const { currentUser, setCurrentUser } = useContext(UserContext)

    const handleUpdate = (is2faEnabled) => {
        const updatedUser = { ...currentUser, is_2fa_enabled: is2faEnabled }
        setCurrentUser(updatedUser)
    }

    return (
        <>
            {!currentUser.is_2fa_enabled ? (
                <SetupTOTP onUpdate={handleUpdate} />
            ) : (
                <DisableTOTP onUpdate={handleUpdate} />
            )}
        </>
    )
}

export function History() {
    const [routes, setRoutes] = useState([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        apiUserRoutes((response, status) => {
            if (status === 200) {
                setRoutes(response)
                setLoaded(true)
            }
        })
    }, [])

    return (
        <div className="content">
            <h3>Searched routes history</h3>
            {!loaded ? (
                <div className="history-message">Unable to load your routes history, try again later</div>
            ) : (
                routes.length === 0 ? (
                    <div className="history-message">Your routes history is empty yet</div>
                ) : (<table>
                        <thead>
                            <tr>
                                <th>Start location</th>
                                <th>End location</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map((route, index) => (
                                <tr key={index}>
                                    <td>{route.start_location_name}</td>
                                    <td>{route.end_location_name}</td>
                                    <td>{new Intl.DateTimeFormat("pl-PL").format(new Date(route.created_at))}</td>
                                </tr>
                            ))}
                        </tbody>
                </table>))}
        </div>
    )
}

export function Profile ({currentUser}) {
    const [username, setUsername] = useState(currentUser.username)
    const [email, setEmail] = useState(currentUser.email)
    // const [firstName, setFirstName] = useState(currentUser.user.first_name)
    // const [lastName, setLastName] = useState(currentUser.user.last_name)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [isPasswordEditing, setIsPasswordEditing] = useState(false)
    const [isPopupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [status, setStatus] = useState(null)

    const handleUsernameChange = (event) => setUsername(event.target.value)
    const handleEmailChange = (event) => setEmail(event.target.value)
    // const handleFirstNameChange = (event) => setFirstName(event.target.value)
    // const handleLastNameChange = (event) => setLastName(event.target.value)

    const handleEditDataClick = () => setIsEditing(true)

    const handleOldPasswordChange = (event) => setOldPassword(event.target.value)
    const handleNewPasswordChange = (event) => setNewPassword(event.target.value)

    const handleEditPasswordClick = () => {
        setIsEditing(true)
        setIsPasswordEditing(true)
    }

    const handleDataSubmit = (event) => {
        event.preventDefault()

        // const user = {username: username, email: email, first_name: firstName, last_name: lastName}
        const user = {username: username, email: email}

        apiProfileDataChange(user, (response, status) => {
            setStatus(status)
            if (status === 200) {
                setPopupMessage("Changes saved")
                setPopupVisible(true)
                setTimeout(() => {
                    setPopupVisible(false)
                }, 3000)
            } else {
                setPopupMessage("An error occurred")
                setPopupVisible(true)
                setTimeout(() => {
                    setPopupVisible(false)
                }, 3000)
            }
        })

        setIsEditing(false)
    }

    const handlePasswordSubmit = (event) => {
        event.preventDefault()

        const passwords = {old_password: oldPassword, new_password: newPassword}

        apiPasswordChange(passwords, (response, status) => {
            setStatus(status)
            if (status === 204) {
                setPopupMessage("Changes saved")
                setIsPasswordEditing(false)
                setIsEditing(false)
            } else {
                if (response.new_password[0] === "This password is too common.") {
                    setPopupMessage("This password is too common")
                } else {
                    setPopupMessage("An error occurred")
                    setIsPasswordEditing(false)
                    setIsEditing(false)
                }
            }
            setPopupVisible(true)
            setTimeout(() => {
                setPopupVisible(false)
            }, 3000)
        })
        setOldPassword("")
        setNewPassword("")
    }

    return (
        <>
            {isPopupVisible &&
                <div className={(status === 200 || status === 204) ? "popup popup-success" : "popup popup-error"}>
                    {popupMessage}
                </div>
            }
            {isEditing ? (
                !isPasswordEditing ? (
                    <form onSubmit={handleDataSubmit}>
                        <h3>Data editing</h3>
                        <label>
                            Username:
                            <input type="text" value={username} onChange={handleUsernameChange} />
                        </label>
                        <br />
                        <label>
                            Email:
                            <input type="email" value={email} onChange={handleEmailChange} />
                        </label>
                        {/* <br />
                        <label>
                            First name:
                            <input type="text" value={firstName} onChange={handleFirstNameChange} />
                        </label>
                        <br />
                        <label>
                            Last name:
                            <input type="text" value={lastName} onChange={handleLastNameChange} />
                        </label> */}
                        <input type="submit" value="Save data" />
                    </form>) : (
                        <form onSubmit={handlePasswordSubmit}>
                            <h3>Password editing</h3>
                            <label>
                                Old password:
                                <input type="password" value={oldPassword} onChange={handleOldPasswordChange} />
                            </label>
                            <br />
                            <label>
                                New password:
                                <input type="password" value={newPassword} onChange={handleNewPasswordChange} />
                            </label>
                            {newPassword !== "" && <PasswordStrengthBar password={newPassword} />}
                            <br />
                            <input type="submit" value="Save new password" />
                            <button className="btn btn-danger" onClick={() => {
                                setIsPasswordEditing(false),
                                setIsEditing(false)
                                }}>Cancel</button>
                        </form>
                    )
            ) : (
                <div className="content">
                    <h3>Profile data</h3>
                    <div className="data-row">
                        <p>Username:</p>
                        <span className="data-field">{username}</span>
                    </div>
                    <div className="data-row">
                        <p>Email:</p>
                        <span className="data-field">{email}</span>
                    </div>
                    {/* <div className="data-row">
                        <p>First name:</p>
                        <span className="data-field">{firstName}</span>
                    </div>
                    <div className="data-row">
                        <p>Last name:</p>
                        <span className="data-field">{lastName}</span>
                    </div> */}
                    <button className="btn btn-primary" onClick={handleEditDataClick}>Change data</button>
                    <h3 className="passwd-header">Password</h3>
                    <button className="btn btn-primary" onClick={handleEditPasswordClick}>Change password</button>
                </div>
            )}
        </>
    )
}

export function UserDashboard() {
    const {content} = useParams()
    //const {currentUser, isLoading} = useCurrentUser()
    const [currentUser, setCurrentUser] = useState({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (setIsLoading) {
            apiProfileData((response, status) => {
                setCurrentUser(response.user)
                setIsLoading(false)
            })
        }
    }, [])

    const renderContent = () => {
        switch (content) {
            case "profile":
                return <Profile currentUser={currentUser} />
            case "notifications":
                return <Notifications />
            case "shared":
                return <Shared />
            case "places":
                return <Places />
            case "routes":
                return <Routes />
            case "timeline":
                return <Timeline />
            case "history":
                return <History />
            case "settings":
                return <Settings />
            default:
                return <Profile currentUser={currentUser} />
        }
    }

    return (
        (!isLoading ? <div className="user-dashboard">
            <div className="dashboard-sidebar">
                <h2>Your account</h2>
                <ul className="centered-list">
                    <li><Link to="/user-dashboard/profile">Profile</Link></li>
                    <li><Link to="/user-dashboard/notifications">Notifications</Link></li>
                    <li><Link to="/user-dashboard/shared">Shared</Link></li>
                    <li><Link to="/user-dashboard/places">Saved places</Link></li>
                    <li><Link to="/user-dashboard/routes">Saved routes</Link></li>
                    <li><Link to="/user-dashboard/timeline">Timeline</Link></li>
                    <li><Link to="/user-dashboard/history">History</Link></li>
                    <li><Link to="/user-dashboard/settings">Settings</Link></li>
                </ul>
            </div>
            <div className="content-container">
                <UserContext.Provider value={{currentUser, setCurrentUser}}>
                    {renderContent()}
                </UserContext.Provider>
            </div>
        </div> : <div className="loading-info">Loading...</div>)
    )
}

export default UserDashboard