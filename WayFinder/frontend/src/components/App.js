import React, { Component } from "react"
import {HashRouter,Routes,Route,} from "react-router-dom";
import  HomePage  from "./HomePage/HomePage"
import  LoginPage  from "./LoginPage/LoginPage"
import  RegisterPage  from "./RegisterPage/RegisterPage"
import ForgotPasswordPage from "./ForgottenPasswordPage/ForgottenPassword";
import { createRoot } from "react-dom/client"


export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage  />} />
          </Routes>
        </HashRouter>
      </div>
    );
  }
}


const container = document.getElementById("root")
const root = createRoot(container)
root.render(<App />)