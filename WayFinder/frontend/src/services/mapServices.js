import axios from "axios"
import {fromLonLat} from "ol/proj"

const nominatimBaseUrl = "https://nominatim.openstreetmap.org/search"

export const geocode = async (searchTerm) => {
  const url = `${nominatimBaseUrl}?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`

  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching geocoding data:", error)
    return null
  }
}

export const getRoute = async (start, end) => {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?
                api_key=${process.env.REACT_APP_OPENROUTESERVICE_API_KEY}&start=${start.join(",")}&end=${end.join(",")}`

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