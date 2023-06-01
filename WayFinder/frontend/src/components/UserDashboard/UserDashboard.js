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

const Profile = ({currentUser}) => {}

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
                <div className="content">
                    {renderContent()}
                </div>
            </div>
        </div> : <div>Loading...</div>
    )
}

export default UserDashboard