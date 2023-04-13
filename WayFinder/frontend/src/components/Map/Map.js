import React, { useRef, useEffect } from "react"
import "./Map.css"
import { Map, View } from "ol"
import TileLayer from "ol/layer/Tile"
import OSM from "ol/source/OSM"

const OLMap = () => {
  const mapRef = useRef()

  useEffect(() => {
    // create an OSM base layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    })

    // initialize the map with a view centered on a specific location and zoom level
    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    })

    // clean up on component unmount
    return () => {
      if (map) {
        map.setTarget(null)
      }
    }
  }, [])

  return <div ref={mapRef} style={{ width: "75%", height: "700px", float: "right" }} />
}

export default OLMap