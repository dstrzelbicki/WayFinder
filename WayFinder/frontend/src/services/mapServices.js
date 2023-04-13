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