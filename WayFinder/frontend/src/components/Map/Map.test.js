/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, screen} from "@testing-library/react"
import OLMap from "./Map"
import ResizeObserver from "resize-observer-polyfill"
import "@testing-library/jest-dom/extend-expect"
global.ResizeObserver = ResizeObserver

jest.mock("../../services/mapServices", () => ({
  reverseGeocode: jest.fn(),
}))

describe("OLMap", () => {

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

  test("renders correctly", () => {
    const mockMarkerUpdate = jest.fn()

    render(<OLMap marker1={[0, 0]} marker2={[1, 1]} onMarker2NameUpdate={mockMarkerUpdate} />)

    expect(screen.getByText("Show traffic")).toBeInTheDocument()
  })
})