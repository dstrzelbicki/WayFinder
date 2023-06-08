/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import React from "react"
import {render, fireEvent, screen} from "@testing-library/react"
import {MemoryRouter, Route, Routes} from "react-router-dom"
import UserDashboard, {Profile} from "./UserDashboard"
import {useCurrentUser} from "../../auth/hooks"

jest.mock("../../auth/hooks")
jest.mock("../../lookup/backendLookup")

const currentUserMock = {
  user: {
    username: "TestUser",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User"
  }
}

describe("UserDashboard component", () => {
  test("renders UserDashboard with a sidebar menu", () => {
    useCurrentUser.mockReturnValue({ currentUser: currentUserMock, isLoading: false })

    render(
      <MemoryRouter initialEntries={["/user-dashboard/profile"]}>
        <Routes>
            <Route path="/user-dashboard/:content" element={<UserDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("Your account")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Notifications")).toBeInTheDocument()
    expect(screen.getByText("Shared")).toBeInTheDocument()
    expect(screen.getByText("Saved places")).toBeInTheDocument()
    expect(screen.getByText("Saved routes")).toBeInTheDocument()
    expect(screen.getByText("Timeline")).toBeInTheDocument()
    expect(screen.getByText("History")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  test("renders Profile content by default", () => {
    useCurrentUser.mockReturnValue({ currentUser: currentUserMock, isLoading: false })

    render(
      <MemoryRouter initialEntries={["/user-dashboard/profile"]}>
        <Routes>
            <Route path="/user-dashboard/:content" element={<UserDashboard />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("Profile data")).toBeInTheDocument()
    expect(screen.getByText("Username:")).toBeInTheDocument()
    expect(screen.getByText("Email:")).toBeInTheDocument()
    expect(screen.getByText("First name:")).toBeInTheDocument()
    expect(screen.getByText("Last name:")).toBeInTheDocument()
    expect(screen.getByText("Password")).toBeInTheDocument()
  })
})

describe("Profile component", () => {
    test("renders user's profile data and allows to edit data and password", async () => {
      const { getByText, getByLabelText } = render(<Profile currentUser={currentUserMock} />)

      expect(getByText("Username:")).toBeInTheDocument()
      expect(getByText("Email:")).toBeInTheDocument()

      const changeDataButton = getByText("Change data")
      fireEvent.click(changeDataButton)

      const usernameInput = getByLabelText("Username:")
      expect(usernameInput.value).toBe("TestUser")

      const emailInput = getByLabelText("Email:")
      expect(emailInput.value).toBe("test@example.com")

      fireEvent.change(usernameInput, {target: {value: "NewTestUser"}})
      expect(usernameInput.value).toBe("NewTestUser")
    })

    test("allows to edit password", async () => {
        const { getByText, getByLabelText } = render(<Profile currentUser={currentUserMock} />)

        const changePasswordButton = getByText(/change password/i)
        fireEvent.click(changePasswordButton)

        const oldPasswordInput = getByLabelText("Old password:")
        const newPasswordInput = getByLabelText("New password:")

        fireEvent.change(oldPasswordInput, {target: {value: "oldPass"}})
        fireEvent.change(newPasswordInput, {target: {value: "newPass"}})

        expect(oldPasswordInput.value).toBe("oldPass")
        expect(newPasswordInput.value).toBe("newPass")
    })
})