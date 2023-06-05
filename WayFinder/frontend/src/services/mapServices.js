import axios from "axios"
import {fromLonLat} from "ol/proj"

const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY
const nominatimBaseUrl = "https://api.geoapify.com/v1/geocode/search"

export const geocode = async (searchTerm) => {
    const url = `${nominatimBaseUrl}?text=${encodeURIComponent(searchTerm)}&format=json&apiKey=${API_KEY}`

    const requestOptions = {
        method: 'GET',
    };

    try {
        const response = await fetch(url, requestOptions)
        if (response.status >= 400 && response.status < 600) {
            // fixme - improve error handling
            console.error("Error fetching geocoding data. Bad response from server: ", response)
        } else {
            console.log("Fetched data location:", response)
        }
        return await response.json()
    } catch (error) {
        console.error("Error fetching geocoding data:", error)
        return null
    }
}

// implement
export const getRoute = async (start, end) => {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${start.join(
        ","
    )}&end=${end.join(",")}`

    try {
        const response = await axios.get(url)
        const route = response.data.features[0].geometry.coordinates
        return route.map((coord) => fromLonLat(coord))
    } catch (error) {
        console.error("Error fetching route: ", error)
        return null
    }
}

export const reverseGeocode = async (coordinates) => {
    const [lon, lat] = coordinates
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`

    try {
        const response = await axios.get(url)
        return response.data
    } catch (error) {
        console.error("Error reverse geocoding: ", error)
        return null
    }
}