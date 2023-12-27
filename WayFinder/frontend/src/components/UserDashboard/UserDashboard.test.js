/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent, waitFor, screen} from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"
import {BrowserRouter} from "react-router-dom"
import UserDashboard, {Profile, History, Settings, UserContext, SetupTOTP, Routes} from "./UserDashboard"
import {apiProfileData, apiProfileDataChange, apiPasswordChange,
  apiUserRoutes, apiGetFavRoutes, apiSetupTOTP} from "../../lookup/backendLookup"
import {useNavigate, useParams} from "react-router-dom"

jest.mock("../../lookup/backendLookup", () => ({
  apiProfileData: jest.fn(),
  apiProfileDataChange: jest.fn(),
  apiPasswordChange: jest.fn(),
  apiUserRoutes: jest.fn(),
  apiGetFavRoutes: jest.fn(),
  apiSetupTOTP: jest.fn(),
  apiVerifyTOTP: jest.fn(),
}))

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}))

const sessionStorageMock = (() => {
  let store = {}

  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = value.toString()
    },
    clear() {
      store = {}
    }
  }
 })()

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock
})

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
  useParams.mockReturnValue({ content: "default" })
  apiProfileData.mockImplementationOnce((callback) => callback({ user: { username: "test", email: "test@gmail.com" } }, 200))

  render(
    <BrowserRouter>
      <UserDashboard />
    </BrowserRouter>
  )

  expect(apiProfileData).toHaveBeenCalledTimes(1)
})

test("UserDashboard shows loading info while loading", () => {
  apiProfileData.mockImplementationOnce((callback) => setTimeout(() => callback({ user: {} }, 200), 500))

  render(
    <BrowserRouter>
      <UserDashboard />
    </BrowserRouter>
  )

  expect(screen.getByText("Loading...")).toBeInTheDocument()
})

test.each([
  ["profile", "Profile"],
  ["routes", "Favourite routes"],
  ["history", "History"],
  ["settings", "Settings"]
])("Renders %s content when content is '%s'", async (content, expected) => {
  useParams.mockReturnValue({ content })
  apiProfileData.mockImplementationOnce((callback) => callback({ user: { username: "test", email: "test@gmail.com" } }, 200))
  apiGetFavRoutes.mockImplementationOnce((callback) => callback([], 200))
  apiSetupTOTP.mockImplementationOnce((callback) => callback([], 200))

  render(
    <BrowserRouter>
      <UserDashboard />
    </BrowserRouter>
  )

  const allOccurrences = screen.getAllByText(expected)
  expect(allOccurrences[0]).toBeInTheDocument()
})

test("Renders default content for invalid 'content' parameter", async () => {
  useParams.mockReturnValue({ content: "invalid" })
  apiProfileData.mockImplementationOnce((callback) => callback({ user: { username: "test", email: "test@gmail.com" } }, 200))

  render(
    <BrowserRouter>
      <UserDashboard />
    </BrowserRouter>
  )

  await waitFor(() => {
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })
})

it("should render the component without crashing", () => {
  const mockUserContext = {
    currentUser: { is_2fa_enabled: false },
    setCurrentUser: jest.fn()
  }

  render(
    <UserContext.Provider value={mockUserContext}>
      <Settings />
    </UserContext.Provider>
  )

  expect(screen.getByText('Setup Two-Factor Authentication')).toBeInTheDocument()
})

it("should display the 'Disable Two-Factor Authentication' component if currentUser.is_2fa_enabled is true", () => {
  const mockUserContext = {
    currentUser: { is_2fa_enabled: true },
    setCurrentUser: jest.fn()
  }
  jest.spyOn(React, 'useContext').mockReturnValue(mockUserContext)

  render(
    <UserContext.Provider value={mockUserContext}>
      <Settings />
    </UserContext.Provider>
  )

  expect(screen.getByText('Disable Two-Factor Authentication')).toBeInTheDocument()
})

it("should display the 'Setup Two-Factor Authentication' component if currentUser.is_2fa_enabled is false", () => {
  const mockUserContext = {
    currentUser: { is_2fa_enabled: false },
    setCurrentUser: jest.fn()
  }
  jest.spyOn(React, 'useContext').mockReturnValue(mockUserContext)

  render(
    <UserContext.Provider value={mockUserContext}>
      <Settings />
    </UserContext.Provider>
  )

  expect(screen.getByText('Setup Two-Factor Authentication')).toBeInTheDocument()
})

describe("SetupTOTP", () => {
  test("initializes states correctly", () => {
      const { getByPlaceholderText, queryByText } = render(<SetupTOTP onUpdate={jest.fn()} />)
      expect(getByPlaceholderText("Enter OTP")).toHaveValue('')
      expect(queryByText("Setup Two-Factor Authentication")).toBeInTheDocument()
  })

  test("calls apiSetupTOTP on mount", async () => {
      const { apiSetupTOTP } = require("../../lookup/backendLookup")
      render(<SetupTOTP onUpdate={jest.fn()} />)
      expect(apiSetupTOTP).toHaveBeenCalled()
  })

  test("handleVerify with invalid OTP format", () => {
      const { getByPlaceholderText, getByText } = render(<SetupTOTP onUpdate={jest.fn()} />)
      fireEvent.change(getByPlaceholderText("Enter OTP"), { target: { value: "12345" } })
      fireEvent.click(getByText("Verify"))
  })

  test("handleVerify with valid OTP and successful verification", async () => {
      const { apiVerifyTOTP } = require("../../lookup/backendLookup")
      apiVerifyTOTP.mockImplementation((otp, mode, callback) => {
          callback({ recovery_codes: ["code1", "code2"] }, 200)
      })
      const { getByPlaceholderText, getByText } = render(<SetupTOTP onUpdate={jest.fn()} />)
      fireEvent.change(getByPlaceholderText("Enter OTP"), { target: { value: "123456" } })
      fireEvent.click(getByText("Verify"))
      await waitFor(() => {
          expect(getByText("Recovery Codes")).toBeInTheDocument()
      })
  })

  test("displays recovery codes after successful OTP verification", async () => {
    const mockUpdate = jest.fn()
    const recoveryCodes = ["code1", "code2", "code3"]

    const { apiVerifyTOTP } = require("../../lookup/backendLookup")
    apiVerifyTOTP.mockImplementation((otp, mode, callback) => {
        callback({ recovery_codes: recoveryCodes }, 200)
    })

    const { getByPlaceholderText, getByText, getAllByRole } = render(<SetupTOTP onUpdate={mockUpdate} />)

    fireEvent.change(getByPlaceholderText("Enter OTP"), { target: { value: "123456" } })
    fireEvent.click(getByText("Verify"))

    await waitFor(() => {
        recoveryCodes.forEach(code => {
            expect(getByText(code)).toBeInTheDocument()
        })

        const listItems = getAllByRole("listitem")
        expect(listItems.length).toBe(recoveryCodes.length)
    })

    fireEvent.click(getByText('I saved my codes'))
    
    expect(mockUpdate).toHaveBeenCalledWith(true)
  })
})

describe("History Component", () => {
  test("renders data after successful load", async () => {
      const mockRoutes = [
          { start_location_name: "Location A", end_location_name: "Location B", created_at: "2023-01-01T12:00:00Z" },
      ]
      apiUserRoutes.mockImplementationOnce((callback) => callback(mockRoutes, 200))
      render(<History />)
      await waitFor(() => {
          mockRoutes.forEach((route) => {
              expect(screen.getByText(route.start_location_name)).toBeInTheDocument()
              expect(screen.getByText(route.end_location_name)).toBeInTheDocument()
          })
      })
  })

  test("renders empty message for no data", async () => {
      apiUserRoutes.mockImplementationOnce((callback) => callback([], 200))
      render(<History />)
      await waitFor(() => {
          expect(screen.getByText(/Your routes history is empty yet/i)).toBeInTheDocument()
      })
  })

  test("renders error message on API failure", async () => {
      apiUserRoutes.mockImplementationOnce((callback) => callback(null, 500))
      render(<History />)
      await waitFor(() => {
          expect(screen.getByText(/Unable to load your routes history/i)).toBeInTheDocument()
      })
  })
})

describe("Routes Component", () => {
  const mockNavigate = jest.fn()
  useNavigate.mockImplementation(() => mockNavigate)

  beforeEach(() => {
    mockNavigate.mockReset()
    apiGetFavRoutes.mockReset()
  })

  it("renders without crashing", () => {
    render(<Routes />)
    expect(screen.getByText('Favourite routes')).toBeInTheDocument()
  })

  it("displays empty message when API returns 404 status", async () => {
    apiGetFavRoutes.mockImplementationOnce((callback) => {
      callback([], 404)
    })
    render(<Routes />)
    expect(await screen.findByText("Your favourite routes list is empty yet")).toBeInTheDocument()
  })

  it("displays routes when API returns 200 status with data", async () => {
    const mockRoutes = [{ name: "Route1", data: {} }, { name: "Route2", data: {} }]
    apiGetFavRoutes.mockImplementationOnce((callback) => {
      callback(mockRoutes, 200)
    })
    render(<Routes />)
    for (const route of mockRoutes) {
      expect(await screen.findByText(route.name)).toBeInTheDocument()
    }
  })

  it("displays empty message when API returns 200 status with no data", async () => {
    apiGetFavRoutes.mockImplementationOnce((callback) => {
      callback([], 200)
    })
    render(<Routes />)
    expect(await screen.findByText("Your favourite routes list is empty yet")).toBeInTheDocument()
  })

  it("navigates to home page and sets sessionStorage on route click", async () => {
    const setItemSpy = jest.spyOn(window.sessionStorage, "setItem")
    const mockRoutes = [{ name: "Route1", data: { id: 1 } }]
    apiGetFavRoutes.mockImplementationOnce((callback) => {
      callback(mockRoutes, 200)
    })
    render(<Routes />)
    fireEvent.click(await screen.findByText("Route1"))
    expect(setItemSpy).toHaveBeenCalledWith("favRoute", JSON.stringify({ id: 1 }))
    expect(setItemSpy).toHaveBeenCalledWith("favRouteSet", true)
    expect(mockNavigate).toHaveBeenCalledWith("/home")
  })

  describe("Profile Component", () => {
    const mockCurrentUser = { username: "testUser", email: "test@example.com" }

    it("renders with initial state from currentUser", () => {
      const { queryByText } = render(<Profile currentUser={mockCurrentUser} />)
      expect(queryByText("testUser")).toBeInTheDocument()
      expect(queryByText("test@example.com")).toBeInTheDocument()
    })

    it("enters data edit mode on 'Change data' button click", () => {
      const { getByText, getByLabelText } = render(<Profile currentUser={mockCurrentUser} />)
      fireEvent.click(getByText("Change data"))
      expect(getByLabelText("Username:")).toBeInTheDocument()
    })

    it("enters password edit mode on 'Change password' button click", () => {
      const { getByText, getByLabelText } = render(<Profile currentUser={mockCurrentUser} />)
      fireEvent.click(getByText("Change password"))
      expect(getByLabelText("Old password:")).toBeInTheDocument()
    })

    it("cancels password editing on cancel button click", () => {
      const { getByText, queryByLabelText } = render(<Profile currentUser={mockCurrentUser} />)
      fireEvent.click(getByText("Change password"))
      fireEvent.click(getByText("Cancel"))
      expect(queryByLabelText("Old password:")).toBeNull()
    })

    it("submits data change form and handles API response", async () => {
      const { apiProfileDataChange } = require("../../lookup/backendLookup")
      apiProfileDataChange.mockImplementation((user, callback) => callback(null, 200))

      const { getByText, getByLabelText, getByRole } = render(<Profile currentUser={mockCurrentUser} />)
      fireEvent.click(getByText("Change data"))
      fireEvent.change(getByLabelText("Username:"), { target: { value: "newUsername" } })
      fireEvent.change(getByLabelText("Email:"), { target: { value: "newemail@example.com" } })
      fireEvent.submit(getByRole("form"))

      await waitFor(() => {
        expect(apiProfileDataChange).toHaveBeenCalledWith({ username: "newUsername", email: "newemail@example.com" }, expect.any(Function))
        expect(getByText("Changes saved")).toBeInTheDocument()
      })
    })

    it("submits password change form and handles API response", async () => {
      const { apiPasswordChange } = require("../../lookup/backendLookup")
      apiPasswordChange.mockImplementation((passwords, callback) => callback(null, 204))

      const { getByText, getByLabelText, getByRole } = render(<Profile currentUser={mockCurrentUser} />)
      fireEvent.click(getByText("Change password"))
      fireEvent.change(getByLabelText("Old password:"), { target: { value: "oldPassword" } })
      fireEvent.change(getByLabelText("New password:"), { target: { value: "newPassword123!" } })
      fireEvent.submit(getByRole("form", { name: "Password editing" }))

      await waitFor(() => {
        expect(apiPasswordChange).toHaveBeenCalledWith({ old_password: "oldPassword", new_password: "newPassword123!" }, expect.any(Function))
        expect(getByText("Changes saved")).toBeInTheDocument()
      })
    })

    it("displays popup message and hides after timeout", async () => {
      jest.useFakeTimers()
      const { queryByText } = render(<Profile currentUser={mockCurrentUser} />)

      fireEvent.click(queryByText("Change data"))
      fireEvent.submit(queryByText("Save data"))

      expect(queryByText("Changes saved")).toBeInTheDocument()
      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(queryByText("Changes saved")===null).toBeTruthy()
      })

      jest.useRealTimers()
    })
  })
})