/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent} from "@testing-library/react"
import Sidebar from "./Sidebar"
import {faBars, faTimes, faHistory} from "@fortawesome/free-solid-svg-icons"
import {library} from "@fortawesome/fontawesome-svg-core"
library.add(faBars, faTimes, faHistory)

describe("Sidebar", () => {
  it("renders without crashing", () => {
    render(<Sidebar />)
  })

  it("toggles collapsed state when toggle button is clicked", () => {
    const toggleSidebar = jest.fn()
    const {getByRole} = render(<Sidebar isNotCollapsed={false} toggleSidebar={toggleSidebar} />)
    fireEvent.click(getByRole("button", {name: /toggle sidebar/i}))
    expect(toggleSidebar).toHaveBeenCalled()
  })

  it("calls onSearchHistoryClick when search history text is clicked", () => {
    const onSearchHistoryClick = jest.fn()
    const {getByText} = render(<Sidebar isNotCollapsed={true} onSearchHistoryClick={onSearchHistoryClick} />)
    fireEvent.click(getByText(/search history/i))
    expect(onSearchHistoryClick).toHaveBeenCalled()
  })

  it("calls onSearchHistoryClick when search history icon is clicked", () => {
    const onSearchHistoryClick = jest.fn()
    const {getByRole} = render(<Sidebar isNotCollapsed={false} onSearchHistoryClick={onSearchHistoryClick} />)
    fireEvent.click(getByRole("button", {name: /history icon/i}))
    expect(onSearchHistoryClick).toHaveBeenCalled()
  })
})