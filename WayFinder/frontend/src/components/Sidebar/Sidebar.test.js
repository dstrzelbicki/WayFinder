/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent} from "@testing-library/react"
import Sidebar from "./Sidebar"
import {faBars, faTimes, faHistory} from "@fortawesome/free-solid-svg-icons"
import {library} from "@fortawesome/fontawesome-svg-core"
import {BrowserRouter} from "react-router-dom"
library.add(faBars, faTimes, faHistory)

describe("Sidebar", () => {
  it("renders without crashing", () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )
  })

  it("toggles collapsed state when toggle button is clicked", () => {
    const toggleSidebar = jest.fn()
    const {getByRole} = render(
                          <BrowserRouter>
                            <Sidebar isNotCollapsed={false} toggleSidebar={toggleSidebar} />
                          </BrowserRouter>)
    fireEvent.click(getByRole("button", {name: /toggle sidebar/i}))
    expect(toggleSidebar).toHaveBeenCalled()
  })

  it("calls onSearchHistoryClick when search history text is clicked", () => {
    const onSearchHistoryClick = jest.fn()
    const {getByText} = render(
                          <BrowserRouter>
                            <Sidebar isNotCollapsed={true} onSearchHistoryClick={onSearchHistoryClick} />
                          </BrowserRouter>)
    fireEvent.click(getByText(/search history/i))
    expect(onSearchHistoryClick).toHaveBeenCalled()
  })

  it("calls onSearchHistoryClick when search history icon is clicked", () => {
    const onSearchHistoryClick = jest.fn()
    const {getByRole} = render(
                          <BrowserRouter>
                            <Sidebar isNotCollapsed={false} onSearchHistoryClick={onSearchHistoryClick} />
                          </BrowserRouter>)
    fireEvent.click(getByRole("button", {name: /history icon/i}))
    expect(onSearchHistoryClick).toHaveBeenCalled()
  })
})