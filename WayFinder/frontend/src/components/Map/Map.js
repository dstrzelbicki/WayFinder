import React, {useEffect, useRef, useState} from "react"
import "./Map.css"
import {Map, Overlay, View} from "ol"
import TileLayer from "ol/layer/Tile"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import VectorSource from "ol/source/Vector"
import VectorLayer from "ol/layer/Vector"
import {Circle, Fill, Icon, Stroke, Style} from "ol/style"
import {fromLonLat, toLonLat, transform} from "ol/proj"
import markerIcon from "../../assets/img/marker-icon.png"
import {reverseGeocode, routemap} from "../../services/mapServices"
import XYZ from "ol/source/XYZ"
import {Group} from "ol/layer"
import {LineString} from "ol/geom";
import {getCenter} from "ol/extent";
import {Attribution} from "ol/control";
import {DEVICE_PIXEL_RATIO} from "ol/has";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {apiPostRoute} from "../../lookup/backendLookup"

// this popup card appears when user clicks on a map, card displays name of location
// and coordinates and renders a button by which user can select location as marker2
const PopupCard = ({data, onSelect}) => {
    return (<div className="popup-card">
        <h4>{data.name}</h4>
        <p>Coordinates: {data.lonLat.join(", ")}</p>
        <button onClick={() => onSelect(data)}>Use as Marker2</button>
    </div>)
}

const OLMap = ({marker1, marker2, marker3, transportOption1, transportOption2, onMarker2NameUpdate, isPlusIcon}) => {
    const mapRef = useRef()
    const [map, setMap] = useState(null)
    const [popupData, setPopupData] = useState(null)
    const [trafficLayerGroup, setTrafficLayerGroup] = useState(null)
    const [showMessage, setShowMessage] = useState(false)
    const TOMTOM_API_KEY = 'yaFyr0Achz6WGOGfk3r1PUIpMV7On6JE'
    const API_KEY = 'b716933a82ae4ee08317542b1ed2664c'

    const isRetina = DEVICE_PIXEL_RATIO > 1;
    const baseUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=" + API_KEY;
    const retinaUrl = "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=" + API_KEY;

    const routeLayerName = 'route-layer'
    const turnByTurnLayerName = 'turn-by-turn-layer'
    const tooltipOverlayName = 'turn-by-turn-layer'

    useEffect(() => {

        const tileLayer = new TileLayer({
            source: new XYZ({
                url: isRetina ? retinaUrl : baseUrl, attributions: [new Attribution({
                    html: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" rel="nofollow" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" rel="nofollow" target="_blank">© OpenStreetMap</a> contributors',
                }),],
            }), maxZoom: 20, zIndex: 0, // Set the desired zIndex for layer ordering
        });

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
            target: mapRef.current, layers: [tileLayer, trafficLayers, markerLayer], view: new View({
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

    useEffect(() => {
        if (map && marker3) {
            addOrUpdateMarker(marker3, "marker3")
        }
    }, [map, marker3])

    useEffect(() => {
        if (map && isPlusIcon) {
            removeMarker(marker3, "marker3")
        }
    }, [map, marker3, isPlusIcon])

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

    const removeMarker = (coordinates, markerId) => {
        const markerSource = map.getLayers().item(2).getSource()
        const existingMarker = markerSource.getFeatureById(markerId)
        if (existingMarker) {
            markerSource.removeFeature(existingMarker)
        }
    }

    const handleMapClick = async (event) => {
        const coordinates = event.coordinate
        const lonLat = toLonLat(coordinates)

        const data = await reverseGeocode(lonLat)

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

    const route = async () => {

        if (marker1 === null || marker2 === null) {
            console.log("Both markers must have values.")
            return
        }

        if (transportOption1 === '') {
            console.log("Transport need to be selected.");
            handleShowMessage();
            return;
        }

        removeRouteFeatures()

        if (marker3) {

            const reversedMarker1 = [marker1[1], marker1[0]]
            const reversedMarker2 = [marker2[1], marker2[0]]
            const reversedMarker3 = [marker3[1], marker3[0]]

            const [data1, data2] = await Promise.all([
                routemap(reversedMarker1, reversedMarker3, transportOption1),
                routemap(reversedMarker3, reversedMarker2, transportOption2 || transportOption1)
            ]);

            drawRouteWithStop(data1, data2);

        } else {
            const reversedMarker1 = [marker1[1], marker1[0]]
            const reversedMarker2 = [marker2[1], marker2[0]]

            const data = await routemap(reversedMarker1, reversedMarker2, transportOption1)

            drawRoute(data)
        }
        apiPostRoute((response, status) => console.log(response, status))
        sessionStorage.removeItem("start")
        sessionStorage.removeItem("startLat")
        sessionStorage.removeItem("startLon")
        sessionStorage.removeItem("mid")
        sessionStorage.removeItem("midLat")
        sessionStorage.removeItem("midLon")
        sessionStorage.removeItem("end")
        sessionStorage.removeItem("endLat")
        sessionStorage.removeItem("endLon")
    }

    function removeRouteFeatures() {
        const routeLayer = map.getLayers().getArray().filter(layer => layer.get('name') === routeLayerName)[0];
        const turnByTurnLayer = map.getLayers().getArray().filter(layer => layer.get('name') === turnByTurnLayerName)[0];
        const tooltipOverlay = map.getLayers().getArray().filter(layer => layer.get('name') === tooltipOverlayName)[0];

        map.removeLayer(routeLayer);
        map.removeLayer(turnByTurnLayer);
        map.removeLayer(tooltipOverlay);
    }

    // fixme -doesnt display road details for first part of road
    function drawRouteWithStop(data1, data2) {
        const coordinates1 = data1.features[0].geometry.coordinates[0]
        const coordinates2 = data2.features[0].geometry.coordinates[0]

        // Transform the coordinates to the projection used by the map
        const transformedCoordinates1 = coordinates1.map((coord) => transform(coord, 'EPSG:4326', 'EPSG:3857'));
        const transformedCoordinates2 = coordinates2.map((coord) => transform(coord, 'EPSG:4326', 'EPSG:3857'));

        const routeFeature1 = createRouteLayerFeatures(transformedCoordinates1, data1)
        const routeFeature2 = createRouteLayerFeatures(transformedCoordinates2, data2)

        const routeSource = new VectorSource({
            features: [routeFeature1, routeFeature2],
        });

        const routeLayer = new VectorLayer({
            name: routeLayerName,
            source: routeSource,
            style: new Style({
                stroke: new Stroke({
                    color: "rgba(20, 137, 255, 0.7)", width: 5,
                }),
            }),
        });

        if (map && routeLayer) {
            map.addLayer(routeLayer)

            showRoadDetails(routeFeature1)
            showRoadDetails(routeFeature2)
            showTurnByTurnDetails(data1)
            showTurnByTurnDetails(data2)
        }

        animateZoomAtLocation(routeSource)
    }

    function drawRoute(data) {
        const coordinates = data.features[0].geometry.coordinates[0]

        // Transform the coordinates to the projection used by the map
        const transformedCoordinates = coordinates.map((coord) => transform(coord, 'EPSG:4326', 'EPSG:3857'));

        const routeFeature = createRouteLayerFeatures(transformedCoordinates, data)

        const routeSource = new VectorSource({
            features: [routeFeature],
        });

        const routeLayer = new VectorLayer({
            name: routeLayerName,
            source: routeSource, style: new Style({
                stroke: new Stroke({
                    color: "rgba(20, 137, 255, 0.7)", width: 5,
                }),
            }),
        });

        if (map && routeLayer) {
            map.addLayer(routeLayer)
            showRoadDetails(routeFeature)
            showTurnByTurnDetails(data)
        }

        animateZoomAtLocation(routeSource)
    }

    function createRouteLayerFeatures(transformedCoordinates, data) {
        return new Feature({
            geometry: new LineString(transformedCoordinates),
            properties: {
                distance: data.features[0].properties.distance,
                distance_units: data.features[0].properties.distance_units,
                time: data.features[0].properties.time,
                mode: data.properties.mode
            }
        });
    }

    function showRoadDetails(routeFeature) {

        // Create an overlay to display the tooltip
        const tooltipOverlay = new Overlay({
            name: tooltipOverlayName,
            element: document.getElementById('tooltip'),
            positioning: 'bottom-center',
        });

        // Register the "pointermove" event on the map
        map.on('pointermove', (event) => {
            const pixel = map.getEventPixel(event.originalEvent);
            const feature = map.forEachFeatureAtPixel(pixel, (feature) => feature);

            if (feature === routeFeature) {
                const properties = routeFeature.getProperties().properties;

                const distance = properties.distance;
                const time = properties.time;
                const mode = properties.mode;

                const tooltipElement = tooltipOverlay.getElement();
                tooltipElement.innerHTML = `<div>
                <span class="black-06 mat-caption" style="width: 100px; display:inline-block">distance:</span>
                <span className="mat-body black-08" style="color: #333333; fontWeight: 500">${convertMetersToKilometers(distance)}[km]</span>
                  </div> 
                  <div>
                <span class="black-06 mat-caption" style="width: 100px; display:inline-block">time:</span>
                <span className="mat-body black-08" style="color: #333333; fontWeight: 500">${convertSecToHours(time)}</span>
                  </div>
                <div>
                <span class="black-06 mat-caption" style="width: 100px; display:inline-block">transport mode: </span>
                <span className="mat-body black-08" style="color: #009933; fontWeight: 500">${mode}</span>
                  </div>
                `;

                tooltipOverlay.setPosition(event.coordinate);
                tooltipOverlay.getElement().style.display = 'block';
            } else {
                tooltipOverlay.getElement().style.display = 'none';
            }
        });

        // Add the overlay to the map
        map.addOverlay(tooltipOverlay);

        console.log(map.getLayers())
    }

    function animateZoomAtLocation(routeSource) {
        const view = map.getView();

        // Set the center and zoom level of the view with animation
        const extent = routeSource.getExtent();
        const center = getCenter(extent);

        view.animate({
            center: center, zoom: 7, duration: 2000 // Animation duration in milliseconds
        });
    }

    function showTurnByTurnDetails(data) {
        const turnByTurns = [];

        data.features.forEach((feature) => {
            feature.properties.legs.forEach((leg, legIndex) => {
                leg.steps.forEach((step) => {
                    if (step.instruction !== undefined) {
                        const pointFeature = new Feature({
                            // Transform the coordinates to the projection used by the map
                            geometry: new Point(feature.geometry.coordinates[legIndex]
                                .map((coord) => transform(coord, 'EPSG:4326', 'EPSG:3857'))[step.from_index]),
                            properties: {
                                instruction: step.instruction,
                            },
                        });
                        turnByTurns.push(pointFeature);
                    }
                });
            });
        });

        const turnByTurnsSource = new VectorSource({
            features: turnByTurns,
        });

        const turnByTurnsLayer = new VectorLayer({
            name: turnByTurnLayerName,
            source: turnByTurnsSource, style: new Style({
                image: new Circle({
                    radius: 5, fill: new Fill({
                        color: '#fff',
                    }), stroke: new Stroke({
                        color: '#000', width: 1,
                    }),
                }),
            })
        });

        const tooltipOverlay = new Overlay({
            element: document.getElementById('instructionContainer'), positioning: 'bottom-center',
        });

        map.addOverlay(tooltipOverlay)
        map.addLayer(turnByTurnsLayer);

        map.on('click', function (event) {
            const clickedCoordinate = event.coordinate;
            const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
                return feature;
            });

            if (feature && feature.values_.properties.instruction !== undefined) {
                document.getElementById('instructionContainer').innerHTML = feature.values_.properties.instruction.text
                tooltipOverlay.setPosition(clickedCoordinate);
            }
        });
    }

    function convertSecToHours(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours + "h" + minutes + "m"
    }

    function convertMetersToKilometers(meters) {
        return meters / 1000
    }

    const handleShowMessage = () => {
        setShowMessage(true)
    }

    const handleCloseMessage = () => {
        setShowMessage(false)
    }

    return (<div ref={mapRef} className="map-container" id="map-container">
        <div>
            <Snackbar open={showMessage} autoHideDuration={4000} onClose={handleCloseMessage}>
                <MuiAlert onClose={handleCloseMessage} severity="error" sx={{width: '100%'}}>
                    Transport need to be selected.
                </MuiAlert>
            </Snackbar>
        </div>
        <div id="tooltip" className="tooltip"></div>
        <div id="instructionContainer" className="instructionContainer"></div>
        <button className="route-button" onClick={route}>Trace route</button>
        <button className="map-button" onClick={toggleTraffic}>Show traffic</button>
        {popupData && (<PopupCard data={popupData} onSelect={(data) => {
            addOrUpdateMarker(data.lonLat, "marker2")
            onMarker2NameUpdate(data.name)
        }}/>)}
        <div className="copyright-caption" id="copyright-caption">©TomTom</div>
    </div>)
}

export default OLMap