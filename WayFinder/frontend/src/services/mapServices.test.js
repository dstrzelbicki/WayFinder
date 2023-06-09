import {geocode, reverseGeocode} from "./mapServices"
import nock from "nock"

describe("mapServices", () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe("geocode", () => {
    it("should return data for a valid search term", async () => {
      const searchTerm = "New York"
      const mockResponse = [
        {
          "boundingbox": ["40.476578", "40.91763", "-74.258843", "-73.700233"],
          "class": "boundary",
          "display_name": "City of New York, New York, United States",
          "icon": "https://nominatim.openstreetmap.org/ui/mapicons/poi_boundary_administrative.p.20.png",
          "importance": 1.017576611451846,
          "lat": "40.7127281",
          "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
          "lon": "-74.0060152",
          "osm_id": 175905,
          "osm_type": "relation",
          "place_id": 306106444,
          "type": "administrative",
        },
      ]

      nock("https://nominatim.openstreetmap.org")
        .get(`/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`)
        .reply(200, mockResponse)

      const data = await geocode(searchTerm)
      expect(data).not.toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(typeof data[0].place_id).toBe("number")
      expect(data[0].display_name).toBe(mockResponse[0].display_name)
    })
  })

  describe("reverseGeocode", () => {
    it("should return data for valid coordinates", async () => {
      const coordinates = [-74.006, 40.7128]
      const mockResponse = {
        place_id: "123",
        display_name: "New York, USA",
      }

      nock("https://nominatim.openstreetmap.org")
        .get(`/reverse?format=jsonv2&lat=${coordinates[1]}&lon=${coordinates[0]}`)
        .reply(200, mockResponse)

      const data = await reverseGeocode(coordinates)
      expect(data).not.toBeNull()
      expect(data.display_name).toBeTruthy()
      expect(data).toEqual(mockResponse)
    })
  })
})