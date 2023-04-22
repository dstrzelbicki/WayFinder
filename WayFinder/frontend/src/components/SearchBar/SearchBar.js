import React, { useState } from "react"
import "./SearchBar.css"

const SearchBar = ({placeholder, onSearch}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      onSearch(searchTerm)
    }
  }

  return (
    <input
      type="text"
      className="search-bar"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleChange}
      onKeyDown={handleKeyPress}
    />
  )
}

export default SearchBar