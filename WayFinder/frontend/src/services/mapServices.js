import axios from "axios"
import {fromLonLat} from "ol/proj"
import {apply} from "ol/transform";

const API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY
const geoApifyBaseUrl = "https://api.geoapify.com/v1/geocode"

export const geocode = async (searchTerm) => {
    const url = `${geoApifyBaseUrl}/search?text=${encodeURIComponent(searchTerm)}&format=json&apiKey=${API_KEY}`

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

// the clicked point to find out the corresponding address
export const reverseGeocode = async (coordinates) => {
    const [lon, lat] = coordinates
    const url = `${geoApifyBaseUrl}/reverse?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`

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