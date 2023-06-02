import React, {useState} from "react"
import {Link, useParams} from "react-router-dom"
import "./UserDashboard.css"
import {useCurrentUser} from "../../auth/hooks"
import {apiProfileDataChange} from "../../lookup/backendLookup"

const Notifications = () => <div>Notifications</div>
const Shared = () => <div>Shared</div>
const Places = () => <div>Saved places</div>
const Routes = () => <div>Saved routes</div>
const Timeline = () => <div>Timeline</div>
const History = () => <div>History</div>
const Settings = () => <div>Settings</div>

const Profile = ({currentUser}) => {
    const [username, setUsername] = useState(currentUser.user.username)
    const [email, setEmail] = useState(currentUser.user.email)
    const [isEditing, setIsEditing] = useState(false)
    const [isPopupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [status, setStatus] = useState(null)

    const handleUsernameChange = (event) => setUsername(event.target.value)
    const handleEmailChange = (event) => setEmail(event.target.value)

    const handleEditClick = () => setIsEditing(true)

    const handleSubmit = (event) => {
        event.preventDefault()

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

    return (
        <>
            {isPopupVisible &&
                <div className={status === 200 ? "popup popup-success" : "popup popup-error"}>
                    {popupMessage}
                </div>
            }
            {isEditing ? (
                <form onSubmit={handleSubmit}>
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
                    <br />
                    <input type="submit" value="Save data" />
                </form>
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
                    <button className="btn btn-primary" onClick={handleEditClick}>Change data</button>
                </div>
            )}
        </>
    )
}

export function UserDashboard() {
    const {content} = useParams()
    const {currentUser, isLoading} = useCurrentUser()

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
                return <Profile />
        }
    }

    return (
        !isLoading ? <div className="user-dashboard">
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
                {renderContent()}
            </div>
        </div> : <div>Loading...</div>
    )
}

export default UserDashboard