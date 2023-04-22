import React, {useRef, useEffect, useState} from "react"
import "./Map.css"
import {Map, View} from "ol"
import TileLayer from "ol/layer/Tile"
import OSM from "ol/source/OSM"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorSource from "ol/source/Vector"
import VectorLayer from "ol/layer/Vector"
import {Icon, Style} from "ol/style"
import {fromLonLat, toLonLat} from "ol/proj"
import markerIcon from "../../assets/img/marker-icon.png"
import {reverseGeocode} from "../../services/mapServices"

// this popup card appears when user clicks on a map, card displays name of location
// and coordinates and renders a button by which user can select location as marker2
const PopupCard = ({data, onSelect}) => {
  return (
    <div className="popup-card">
      <h4>{data.name}</h4>
      <p>Coordinates: {data.lonLat.join(", ")}</p>
      <button onClick={() => onSelect(data)}>Use as Marker2</button>
    </div>
  )
}

const OLMap = ({marker1, marker2, onMarker2NameUpdate}) => {
  const mapRef = useRef()
  const [map, setMap] = useState(null)
  const [popupData, setPopupData] = useState(null)

  useEffect(() => {
    // create an OSM base layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    })

    const markerSource = new VectorSource()
    const markerLayer = new VectorLayer({source: markerSource})

    // initialize the map with a view centered on a specific location and zoom level
    const initialMap = new Map({
      target: mapRef.current,
      layers: [osmLayer, markerLayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    })

    initialMap.on("click", handleMapClick)
    setMap(initialMap)

    // clean up on component unmount
    return () => {
      if (map) {
        map.setTarget(null)
        map.un("click", handleMapClick)
      }
    }
  }, [])

  useEffect(() => {
    if (map && marker1) {
      addOrUpdateMarker(marker1, "marker1")
    }
  }, [map, marker1])
  
  useEffect(() => {
    if (map && marker2) {
      addOrUpdateMarker(marker2, "marker2")
    }
  }, [map, marker2])

  const addOrUpdateMarker = (coordinates, markerId) => {
    const transformedCoordinates = fromLonLat(coordinates)

    const marker = new Feature({
      geometry: new Point(transformedCoordinates)
    })
    marker.setId(markerId)

    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        src: markerIcon,
      }),
    })
  
    marker.setStyle(iconStyle)

    // replace existing marker or add new marker
    const markerSource = map.getLayers().item(1).getSource()
    const existingMarker = markerSource.getFeatureById(markerId)
    if (existingMarker) {
      markerSource.removeFeature(existingMarker)
    }
    markerSource.addFeature(marker)
  }

  const handleMapClick = async (event) => {
    const coordinates = event.coordinate
    const lonLat = toLonLat(coordinates)
  
    // reverse geocode the clicked point to get the place name
    const placeData = await reverseGeocode(lonLat)
  
    if (placeData) {
      setPopupData({
        coordinates,
        lonLat,
        name: placeData.name,
      })
    }
  }

  return (
    <div ref={mapRef} style={{width: "75%", height: "700px", float: "right"}}>
      {popupData && (
        <PopupCard data={popupData} onSelect={(data) => {
          addOrUpdateMarker(data.lonLat, "marker2")
          onMarker2NameUpdate(data.name)
        }} />
      )}
    </div>
  )
}

export default OLMap