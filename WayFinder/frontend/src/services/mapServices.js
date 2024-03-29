import axios from "axios"

const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY
const geoApifyBaseUrl = "https://api.geoapify.com"

export const geocode = async (searchTerm) => {
    const url = `${geoApifyBaseUrl}/v1/geocode/search?text=${encodeURIComponent(searchTerm)}&format=json&apiKey=${API_KEY}`

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
    const url = `${geoApifyBaseUrl}/v1/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&apiKey=${API_KEY}`

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

export const placeDetails = async (coordinates) => {
    const [lon, lat] = coordinates
    const url = `${geoApifyBaseUrl}/v2/place-details?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`

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
    const url = `${geoApifyBaseUrl}/v1/geocode/autocomplete?text=${encodeURIComponent(searchTerm)}&format=json&limit=5&apiKey=${API_KEY}`;
    return fetch(url)
}

export const routemap = async (waypoints, transportOption) => {

    function getTravelMode(transportOption) {
        switch (transportOption) {
            case 'Car':
                return 'drive'
            case 'Bicycle':
                return 'bicycle'
            case 'Truck':
                return 'truck'
            case 'Motorcycle':
                return 'motorcycle'
            case 'Walk':
                return 'walk'
            default:
                return 'unknown'
        }
    }

    const waypointsString = waypoints.map((waypoint) => waypoint.join(',')).join('|');
    const url = `${geoApifyBaseUrl}/v1/routing?waypoints=${encodeURIComponent(waypointsString)}&mode=${getTravelMode(transportOption)}&details=instruction_details,route_details,elevation&apiKey=${API_KEY}`;

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