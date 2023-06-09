/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent, waitFor, screen} from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"
import {BrowserRouter} from "react-router-dom"
import UserDashboard, {Profile, History} from "./UserDashboard"
import {apiProfileData, apiProfileDataChange, apiPasswordChange, apiUserRoutes} from "../../lookup/backendLookup"

jest.mock("../../lookup/backendLookup", () => ({
  apiProfileData: jest.fn(),
  apiProfileDataChange: jest.fn(),
  apiPasswordChange: jest.fn(),
  apiUserRoutes: jest.fn(),
}))

test("Profile updates username and email", async () => {
  apiProfileDataChange.mockImplementationOnce((user, callback) => callback({}, 200))

  render(
    <Profile currentUser={{username: "test", email: "test@gmail.com"}} />
  )

  fireEvent.click(screen.getByText("Change data"))
  fireEvent.change(screen.getByLabelText("Username:"), {target: {value: "new-username"}})
  fireEvent.change(screen.getByLabelText("Email:"), {target: {value: "new@gmail.com"}})
  fireEvent.click(screen.getByText("Save data"))

  await waitFor(() => expect(apiProfileDataChange).toHaveBeenCalledTimes(1))
})

test("Password update", async () => {
  apiPasswordChange.mockImplementationOnce((passwords, callback) => callback({}, 204))

  render(
    <Profile currentUser={{username: "test", email: "test@gmail.com"}} />
  )

  fireEvent.click(screen.getByText("Change password"))
  fireEvent.change(screen.getByLabelText("Old password:"), {target: {value: "old_password"}})
  fireEvent.change(screen.getByLabelText("New password:"), {target: {value: "new_password"}})
  fireEvent.click(screen.getByText("Save new password"))

  await waitFor(() => expect(apiPasswordChange).toHaveBeenCalledTimes(1))
})

test("History component with no data", () => {
  apiUserRoutes.mockImplementationOnce((callback) => callback([], 200))

  render(<History />)

  expect(screen.getByText("Your routes history is empty yet")).toBeInTheDocument()
})

test("UserDashboard loads user profile by default", () => {
  apiProfileData.mockImplementationOnce((callback) => callback({ user: { username: "test", email: "test@gmail.com" } }, 200))

  render(
    <BrowserRouter>
      <UserDashboard />
    </BrowserRouter>
  )

  expect(apiProfileData).toHaveBeenCalledTimes(1)
})