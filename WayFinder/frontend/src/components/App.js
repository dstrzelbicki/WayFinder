import React, { Component } from "react"
import HomePage from "./HomePage/HomePage"
import { createRoot } from "react-dom/client"
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import UserDashboard from "./UserDashboard/UserDashboard"

export default class App extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Router>
        <Routes>
          <Route path="/user-dashboard/:content" element={<UserDashboard />} />
          <Route exact path="/" element={<HomePage />} />
        </Routes>
      </Router>
    )
  }
}

const container = document.getElementById("root")
const root = createRoot(container)
root.render(<App />)