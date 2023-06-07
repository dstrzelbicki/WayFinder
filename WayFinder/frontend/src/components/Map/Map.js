import React, {useEffect, useRef, useState} from "react"
import "./Map.css"
import {Map, Overlay, View} from "ol"
import TileLayer from "ol/layer/Tile"
import OSM from "ol/source/OSM"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorSource from "ol/source/Vector"
import VectorLayer from "ol/layer/Vector"
import {Icon, Stroke, Style} from "ol/style"
import {fromLonLat, toLonLat, transform} from "ol/proj"
import markerIcon from "../../assets/img/marker-icon.png"
import {reverseGeocode, routemap} from "../../services/mapServices"
import XYZ from "ol/source/XYZ"
import {Group} from "ol/layer"
import {LineString} from "ol/geom";
import {getCenter} from "ol/extent";

// this popup card appears when user clicks on a map, card displays name of location
// and coordinates and renders a button by which user can select location as marker2
const PopupCard = ({data, onSelect}) => {
    return (<div className="popup-card">
        <h4>{data.name}</h4>
        <p>Coordinates: {data.lonLat.join(", ")}</p>
        <button onClick={() => onSelect(data)}>Use as Marker2</button>
    </div>)
}

const OLMap = ({marker1, marker2, onMarker2NameUpdate}) => {
    const mapRef = useRef()
    const [map, setMap] = useState(null)
    const [popupData, setPopupData] = useState(null)
    const [trafficLayerGroup, setTrafficLayerGroup] = useState(null)
    const [routeLayer, setRouteLayer] = useState(null);
    const TOMTOM_API_KEY = process.env.REACT_APP_TOMTOM_API_KEY

    useEffect(() => {
        // create an OSM base layer
        const osmLayer = new TileLayer({
            source: new OSM(),
        })

        // create TomTom traffic flow and incidents layers
        const trafficFlowLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`, maxZoom: 22, tileSize: 256,
            }), visible: false,
        })

        const trafficIncidentsLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`, maxZoom: 22, tileSize: 256,
            }), visible: false,
        })

        const trafficLayers = new Group({
            layers: [trafficFlowLayer, trafficIncidentsLayer],
        })

        setTrafficLayerGroup(trafficLayers)

        const markerSource = new VectorSource()
        const markerLayer = new VectorLayer({source: markerSource})

        // initialize the map with a view centered on a specific location and zoom level
        const initialMap = new Map({
            target: mapRef.current, layers: [osmLayer, trafficLayers, markerLayer], view: new View({
                center: [0, 0], zoom: 2,
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
                anchor: [0.5, 1], anchorXUnits: "fraction", anchorYUnits: "fraction", src: markerIcon,
            }),
        })

        marker.setStyle(iconStyle)

        // replace existing marker or add new marker
        const markerSource = map.getLayers().item(2).getSource()
        const existingMarker = markerSource.getFeatureById(markerId)
        if (existingMarker) {
            markerSource.removeFeature(existingMarker)
        }
        markerSource.addFeature(marker)
    }

    const handleMapClick = async (event) => {
        const coordinates = event.coordinate
        const lonLat = toLonLat(coordinates)

        const data = await reverseGeocode(lonLat)

        console.log("Reverse geocoding: ", data.features)
        if (data.features.length > 0) {
            const locationProperties = data.features[0].properties
            setPopupData({
                coordinates, lonLat, name: locationProperties.formatted,
            })
        } else {
            console.error(`No results found for coordinates: `, coordinates)
        }
    }

    const toggleTraffic = () => {
        if (trafficLayerGroup) {
            const layers = trafficLayerGroup.getLayers().getArray()
            const visible = !layers[0].getVisible()
            layers.forEach((layer) => layer.setVisible(visible))

            const copyrightCaption = document.getElementById("copyright-caption")
            if (visible) {
                copyrightCaption.style.display = "block"
            } else {
                copyrightCaption.style.display = "none"
            }
        }
    }

    const drawRoute = async () => {
        if (marker1 === null || marker2 === null) {
            console.log("Both markers must have values.")
            return
        }

        const reversedMarker1 = [marker1[1], marker1[0]]
        const reversedMarker2 = [marker2[1], marker2[0]]

        const data = await routemap(reversedMarker1, reversedMarker2)

        const coordinates = data.features[0].geometry.coordinates[0]

        // Transform the coordinates to the projection used by the map
        const transformedCoordinates = coordinates.map((coord) =>
            transform(coord, 'EPSG:4326', 'EPSG:3857')
        );

        const routeFeature = new Feature({
            geometry: new LineString(transformedCoordinates),
            properties: {
                distance: data.features[0].properties.distance,
                distance_units: data.features[0].properties.distance_units,
                time: data.features[0].properties.time,
            }
        });

        const routeSource = new VectorSource({
            features: [routeFeature],
        });

        const routeLayer = new VectorLayer({
            source: routeSource, style: new Style({
                stroke: new Stroke({
                    color: "rgba(20, 137, 255, 0.7)", width: 5,
                }),
            }),
        });

        // Create an overlay to display the tooltip
        const tooltipOverlay = new Overlay({
            element: document.getElementById('tooltip'),
            positioning: 'bottom-center',
        });

        if (map && routeLayer) {
            // Add the overlay to the map
            map.addOverlay(tooltipOverlay);
            map.addLayer(routeLayer);
        }

        // Register the "pointermove" event on the map
        map.on('pointermove', (event) => {
            const pixel = map.getEventPixel(event.originalEvent);
            const feature = map.forEachFeatureAtPixel(pixel, (feature) => feature);

            if (feature === routeFeature) {
                const properties = routeFeature.getProperties().properties;
                const distance = properties.distance;
                const time = properties.time;
                console.log("properties: ", properties)

                const tooltipElement = tooltipOverlay.getElement();
                tooltipElement.innerHTML = `distance: ${convertMetersToKilometers(distance)}[km],\n time: ${convertSecToHours(time)}`;

                tooltipOverlay.setPosition(event.coordinate);
                tooltipOverlay.getElement().style.display = 'block';
            } else {
                tooltipOverlay.getElement().style.display = 'none';
            }
        });

        const view = map.getView();

        // Set the center and zoom level of the view with animation
        const extent = routeSource.getExtent();
        const center = getCenter(extent);

        view.animate({
            center: center,
            zoom: 7,
            duration: 2000 // Animation duration in milliseconds
        });
    }

    function convertSecToHours(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours + "[h]" + minutes + "[m]"
    }

    function convertMetersToKilometers(meters) {
        return meters / 1000;
    }

    return (<div ref={mapRef} className="map-container" id="map-container">
        <div id="tooltip" className="tooltip"></div>
        <button className="route-button" onClick={drawRoute}>Trace route</button>
        <button className="map-button" onClick={toggleTraffic}>Show traffic</button>
        {popupData && (<PopupCard data={popupData} onSelect={(data) => {
            addOrUpdateMarker(data.lonLat, "marker2")
            onMarker2NameUpdate(data.name)
        }}/>)}
        <div className="copyright-caption" id="copyright-caption">©TomTom</div>
    </div>)
}

export default OLMap