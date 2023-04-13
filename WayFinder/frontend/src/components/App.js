import React, { Component } from "react"
import HomePage from "./HomePage"
import { createRoot } from "react-dom/client"

export default class App extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <HomePage />
      </div>
    )
  }
}

const container = document.getElementById("root")
const root = createRoot(container)
root.render(<App />)