import React, {useEffect, useRef, useState} from "react"
import "./SearchBar.css"
import {autocomplete} from "../../services/mapServices";
import DOMPurify from "dompurify";

const SearchBar = ({placeholder, onSearch}) => {
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const inputRef = useRef(null);
    const MIN_ADDRESS_LENGTH = 3;

    useEffect(() => {
        const fetchAddressAutocomplete = async () => {
            // Skip empty or short address strings
            if (!searchValue || searchValue.length < MIN_ADDRESS_LENGTH) {
                setSearchResults([])
                return;
            }
            try {
                const results = await addressAutocomplete(searchValue);
                setSearchResults(results);
            } catch (error) {
                console.log(error);
            }
        };

        fetchAddressAutocomplete();
    }, [searchValue]);

    const addressAutocomplete = (value) => {
        return new Promise((resolve, reject) => {
            if (!value || value.length < MIN_ADDRESS_LENGTH) {
                resolve([]);
            } else {
                autocomplete(value)
                    .then(response => {
                        if (response.ok) {
                            response.json().then(data => resolve(data.results.map(result => result.formatted)));
                        } else {
                            response.json().then(data => reject(data));
                        }
                    })
                    .catch(error => reject(error));
            }
        });
    };

    const handleInputChange = (event) => {
        const value = event.target.value;
        const sanitizedValue = DOMPurify.sanitize(value);
        setSearchValue(sanitizedValue);
        setIsDropdownVisible(true);
    }

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            onSearch(searchValue)
        }
    }

    const handleSelectItem = (value) => {
        setSearchValue(value);
        setSelectedItem(value);
        setIsDropdownVisible(false);
    };

    const handleOutsideClick = (event) => {
        if (inputRef.current && !inputRef.current.contains(event.target)) {
            setIsDropdownVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", handleOutsideClick);
        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, []);

    return (
        <div className="search-bar">
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={searchValue}
                onChange={handleInputChange}
                ref={inputRef}
                onKeyDown={handleKeyPress}
            />
            {isDropdownVisible && Array.isArray(searchResults) && searchValue.length > 0 && (
                <ul className="dropdown-list">
                    {searchResults.map((item, index) => (
                        <li
                            key={index}
                            className={`dropdown-item ${
                                item === selectedItem ? "selected" : ""
                            }`}
                            onClick={() => handleSelectItem(item)}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default SearchBar