import {geocode} from './mapServices'
import fetchMock from 'jest-fetch-mock'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

fetchMock.enableMocks()

const mock = new MockAdapter(axios)
mock.onGet(`https://api.geoapify.com/v1/geocode/reverse?lat=${encodeURIComponent(12.34)}&lon=${encodeURIComponent(56.78)}&apiKey=dummy_key`).reply(200, {
  status: 200,
  data: {
    results: [
      {
        address: "123 Main St",
        city: "New York",
        state: "NY",
        country: "USA"
      }
    ]
  }
})

beforeEach(() => {
  fetch.resetMocks()
})

describe("mapServices", () => {

  describe("geocode", () => {
    it("should return data for a valid search term", async () => {
      fetch.mockResponseOnce(JSON.stringify(
        {
          results: [
            {
              datasource: {
                sourcename: "openstreetmap",
                attribution: "© OpenStreetMap contributors",
                license: "Open Database License",
                url: "https://www.openstreetmap.org/copyright"
              },
              old_name: "Posen",
              country: "Poland",
              country_code: "pl",
              state: "Greater Poland Voivodeship",
              city: "Poznań",
              lon: 16.9335199,
              lat: 52.4082663,
              formatted: "Poznań, Greater Poland Voivodeship, Poland",
              address_line1: "Poznań",
              address_line2: "Greater Poland Voivodeship, Poland",
              category: "administrative",
              timezone: {
                name: "Europe/Warsaw",
                offset_STD: "+01:00",
                offset_STD_seconds: 3600,
                offset_DST: "+02:00",
                offset_DST_seconds: 7200,
                abbreviation_STD: "CET",
                abbreviation_DST: "CEST"
              },
              plus_code: "9F4RCW5M+8C",
              plus_code_short: "5M+8C Poznań, Greater Poland Voivodeship, Poland",
              result_type: "city",
              rank: {
                importance: 0.7645405979969531,
                popularity: 9.995467104553104,
                confidence: 1,
                confidence_city_level: 1,
                match_type: "full_match"
              },
              place_id: "514aaa0029fbee3040598b47f31142344a40f00101f901e67a250000000000c00208",
              bbox: {
                lon1: 16.7315878,
                lat1: 52.2919238,
                lon2: 17.0717065,
                lat2: 52.5093282
              }
            }
          ],
          query: {
            text: "Poznań",
            parsed: {
              city: "poznań",
              expected_type: "unknown"
            }
          }
        }
      ))

      const searchTerm = "Poznań"

      const response = await geocode(searchTerm)

      expect(response).not.toBeNull()
      expect(response.results).toBeInstanceOf(Array)
      expect(response.results.length).toBeGreaterThan(0)
      const firstResult = response.results[0]
      expect(firstResult.lon).toBeCloseTo(16.9335199)
      expect(firstResult.lat).toBeCloseTo(52.4082663)
      expect(firstResult.bbox).toHaveProperty("lon1")
      expect(firstResult.bbox).toHaveProperty("lat1")
      expect(firstResult.bbox).toHaveProperty("lon2")
      expect(firstResult.bbox).toHaveProperty("lat2")
    })
  })
})