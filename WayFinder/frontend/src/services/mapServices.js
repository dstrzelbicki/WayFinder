import axios from "axios"

const API_KEY = 'b716933a82ae4ee08317542b1ed2664c'
const geoApifyBaseUrl = "https://api.geoapify.com/v1"

export const geocode = async (searchTerm) => {
    const url = `${geoApifyBaseUrl}/geocode/search?text=${encodeURIComponent(searchTerm)}&format=json&apiKey=${API_KEY}`

    const requestOptions = {
        method: 'GET',
    };

    try {
        const response = await fetch(url, requestOptions)
        if (response.status >= 400 && response.status < 600) {
            // fixme - improve error handling
            console.error("Error fetching geocoding data. Bad response from server: ", response)
        }
        return response.json()
    } catch (error) {
        console.error("Error fetching geocoding data:", error)
        return null
    }
}

// the clicked point to find out the corresponding address
export const reverseGeocode = async (coordinates) => {
    const [lon, lat] = coordinates
    const url = `${geoApifyBaseUrl}/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`

    try {
        const response = await axios.get(url)
        if (response.status >= 400 && response.status < 600) {
            // fixme - improve error handling
            console.error("Error fetching geocoding data. Bad response from server: ", response)
        }
        return response.data
    } catch (error) {
        console.error("Error fetching geocoding data:", error)
        return null
    }
}

export const autocomplete = async (searchTerm) => {
    const url = `${geoApifyBaseUrl}/geocode/autocomplete?text=${encodeURIComponent(searchTerm)}&format=json&limit=5&apiKey=${API_KEY}`;
    return fetch(url)
}

export const routemap = async (waypoints, transportOption) => {
    let mode

    if (transportOption === 'Car') {
        mode = "drive"
    } else mode = "bicycle"

    const waypointsString = waypoints.map((waypoint) => waypoint.join(',')).join('|');
    const url = `${geoApifyBaseUrl}/routing?waypoints=${waypointsString}&mode=${mode}&details=instruction_details,route_details,elevation&apiKey=${API_KEY}`;

    const requestOptions = {
        method: 'GET',
    };

    try {
        const response = await fetch(url, requestOptions)
        if (response.status >= 400 && response.status < 600) {
            // fixme - improve error handling
            console.error("Error fetching geocoding data. Bad response from server: ", response)
        }
        return response.json()
    } catch (error) {
        console.error("Error fetching geocoding data:", error)
        return null
    }
}