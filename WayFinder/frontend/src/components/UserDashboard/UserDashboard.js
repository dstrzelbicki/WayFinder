import React, {useState, useEffect} from "react"
import {Link, useParams} from "react-router-dom"
import "./UserDashboard.css"
import {useCurrentUser} from "../../auth/hooks"
import {apiProfileDataChange, apiPasswordChange,
        apiUserRoutes, apiProfileData} from "../../lookup/backendLookup"
import PasswordStrengthBar from "react-password-strength-bar"
import {useNavigate} from "react-router-dom"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faTimes} from "@fortawesome/free-solid-svg-icons"

const Notifications = () => <div>Notifications</div>
const Shared = () => <div>Shared</div>
const Places = () => <div>Saved places</div>
const Routes = () => <div>Saved routes</div>
const Timeline = () => <div>Timeline</div>
const Settings = () => <div>Settings</div>

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
    const navigate = useNavigate()

    const navigatetoHomePage = () => {
        navigate("/home")
    }

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
        !isLoading ? <div className="user-dashboard">
            <div className="dashboard-sidebar">
                <div className="toggle-button" onClick={navigatetoHomePage} role="button">
                    <FontAwesomeIcon icon={faTimes} />
                </div>
                <h2>Your account</h2>
                <ul className="centered-list">
                    <li><Link to="/user-dashboard/profile" className="full-width-link">Profile</Link></li>
                    <li><Link to="/user-dashboard/notifications" className="full-width-link">Notifications</Link></li>
                    <li><Link to="/user-dashboard/shared" className="full-width-link">Shared</Link></li>
                    <li><Link to="/user-dashboard/places" className="full-width-link">Saved places</Link></li>
                    <li><Link to="/user-dashboard/routes" className="full-width-link">Saved routes</Link></li>
                    <li><Link to="/user-dashboard/timeline" className="full-width-link">Timeline</Link></li>
                    <li><Link to="/user-dashboard/history" className="full-width-link">History</Link></li>
                    <li><Link to="/user-dashboard/settings" className="full-width-link">Settings</Link></li>
                </ul>
            </div>
            <div className="content-container">
                {renderContent()}
            </div>
        </div> : <div className="loading-info">Loading...</div>
    )
}

export default UserDashboard