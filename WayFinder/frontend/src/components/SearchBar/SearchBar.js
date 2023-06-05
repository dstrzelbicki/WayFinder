import React, {useEffect, useState} from "react"
import "./SearchBar.css"
import {autocomplete} from "../../services/mapServices";

const SearchBar = ({placeholder, onSearch}) => {
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    useEffect(() => {
        const results = addressAutocomplete(searchValue);
        setSearchResults(results);
        if (results.length > 0) {
            setIsDropdownVisible(true);
        }
    }, [searchValue]);

    const handleInputChange = (event) => {
        const value = event.target.value;
        console.log("TUTAJ!!!", value)
        setSearchValue(value)
        setIsDropdownVisible(true);
    }

    // const handleKeyPress = (event) => {
    //     if (event.key === "Enter") {
    //         onSearch(searchValue)
    //     }
    // }

    const handleSelectChange = (event) => {
        const value = event.target.value;
        console.log("CO TO JRST: ", event)
        setSearchValue(value);
        setSelectedItem(value);
        setIsDropdownVisible(false);
    };

    const addressAutocomplete = (value) => {
        const results = [];

        const MIN_ADDRESS_LENGTH = 3;

        // Skip empty or short address strings
        if (!value || value.length < MIN_ADDRESS_LENGTH) {
            return false;
        }

        const promise = new Promise((resolve, reject) => {
            autocomplete(value)
                .then(response => {
                    if (response.ok) {
                        response.json().then(data => resolve(data));
                    } else {
                        response.json().then(data => reject(data));
                    }
                });
        });

        promise.then((data) => {
            /* For each item in the results */
            data.results.forEach((result, index) => {
                const listItem = <li key={index}>{result.formatted}</li>;
                results.push(listItem);
            });

        }, (err) => {
            if (!err.canceled) {
                console.log(err);
            }
        });
        return results
    }

    const handleDropdownBlur = () => {
        setIsDropdownVisible(false);
    };

    return (
        <div className="search-bar">
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={searchValue}
                onChange={handleInputChange}
                // onKeyUp={handleKeyPress}
                onBlur={handleDropdownBlur}
            />
            {isDropdownVisible && searchResults.length > 0 && (
                <select
                    value={selectedItem}
                    onChange={handleSelectChange}
                    className="dropdown-select"
                >
                    <option value="">Select an item</option>
                    {searchResults.map((item, index) => (
                        <option
                            key={index}
                            value={item.index}
                            selected={selectedItem === item}
                        >
                            {item}
                        </option>
                    ))}
                </select>)}
        </div>
    )
}

export default SearchBar