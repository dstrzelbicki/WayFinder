/**
 * @jest-environment jsdom
 */
import React from "react"
import {render, fireEvent} from "@testing-library/react"
import SearchBar from "./SearchBar"

describe("SearchBar", () => {
  it("updates on change", () => {
    const mockOnChange = jest.fn()
    const {getByPlaceholderText} = render(<SearchBar placeholder="Search..." onSearch={mockOnChange} />)

    const input = getByPlaceholderText("Search...")
    fireEvent.change(input, {target: {value: "test search"}})

    expect(input.value).toBe("test search")
  })

  it("calls onSearch prop when Enter key is pressed", () => {
    const mockOnSearch = jest.fn()
    const {getByPlaceholderText} = render(<SearchBar placeholder="Search..." onSearch={mockOnSearch} />)

    const input = getByPlaceholderText("Search...")
    fireEvent.change(input, {target: {value: "test search"}})
    fireEvent.keyDown(input, {key: "Enter"})

    expect(mockOnSearch).toHaveBeenCalledWith("test search")
  })
})