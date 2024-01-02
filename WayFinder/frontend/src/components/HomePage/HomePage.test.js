/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent, waitFor, screen} from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"
import HomePage from "./HomePage"
import {geocode} from "../../services/mapServices"
import ResizeObserver from "resize-observer-polyfill"
import {BrowserRouter} from "react-router-dom"
global.ResizeObserver = ResizeObserver

jest.mock("../../services/mapServices", () => ({
  geocode: jest.fn(),
}))

let mockLocalStorageData = {}
global.localStorage = {
  getItem: jest.fn((key) => mockLocalStorageData[key]),
  setItem: jest.fn((key, val) => {
    mockLocalStorageData[key] = val
  }),
  clear: jest.fn(() => {
    mockLocalStorageData = {}
  }),
}

describe("HomePage", () => {

  beforeAll(() => {
    const mockGeolocation = {
      getCurrentPosition: jest.fn()
        .mockImplementation((callback) => Promise.resolve(callback({
          coords: {
            latitude: 51.1,
            longitude: 45.3
          }
        }))),
      watchPosition: jest.fn()
    }

    global.navigator.geolocation = mockGeolocation
  })

  beforeEach(() => {
    mockLocalStorageData = {}
  })

  it("renders without crashing", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )
  })

  it("updates marker1 when SearchBar1 is used", async () => {
    geocode.mockImplementation(() => Promise.resolve([{lat: "0", lon: "0"}]))

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByPlaceholderText("Your location"), {target: {value: "Location"}})
    fireEvent.keyDown(screen.getByPlaceholderText("Your location"), {key: "Enter", code: "Enter"})

    await waitFor(() => expect(geocode).toHaveBeenCalledWith("Location"))
  })
})