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
import {placeDetails, routemap} from "../../services/mapServices"
import markerIcon from "../../assets/img/marker-icon.png"
import XYZ from "ol/source/XYZ"
import {Group} from "ol/layer"
import {LineString} from "ol/geom";
import {getCenter} from "ol/extent";
import {Attribution} from "ol/control";
import {DEVICE_PIXEL_RATIO} from "ol/has";
import {apiPostRoute} from "../../lookup/backendLookup"
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

// this popup card appears when user clicks on a map, card displays name of location
// and coordinates and renders a button by which user can select location as marker2
const PopupCard = ({data, onSelect, setIsPopupOpen}) => {
    const handleUseAsMarker = () => {
        onSelect(data)
        // Close the popup by updating the state
        setIsPopupOpen(false)
    }

    return (<div className="popup-card">
        <button className="close-button" onClick={() => setIsPopupOpen(false)}><FontAwesomeIcon icon={faTimes}/></button>
        <h4>{data.address}</h4>
        <p>Categories: {data.categories}</p>
        <p>Coordinates: {data.lonLat.join(", ")}</p>
        <button className="popup-card-button" onClick={handleUseAsMarker}>Use as Marker</button>
    </div>)
}

const OLMap = ({marker, newRoutePoints, onMarker2NameUpdate}) => {
    const mapRef = useRef()
    const [map, setMap] = useState(null)
    const [popupData, setPopupData] = useState(null)
    const [trafficLayerGroup, setTrafficLayerGroup] = useState(null)
    const [isPopupCardOpen, setIsPopupCardOpen] = useState(true)
    const [showMessage, setShowMessage] = useState(false)

    const [routePoints, setRoutePoints] = useState([])

    const TOMTOM_API_KEY = 'yaFyr0Achz6WGOGfk3r1PUIpMV7On6JE'
    const API_KEY = 'b716933a82ae4ee08317542b1ed2664c'
    const [trafficHint, setTrafficHint] = useState("Show traffic")
    const [trafficInfo, setTrafficInfo] = useState(false)

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
        if (marker && map && marker.coordinates.length !== 0) {
            addMarkerFeature()
        }
    }, [map, marker])

    useEffect(() => {
        if (marker && map && marker.isToRemove) {
            removeMarkerFeature()
        }
    }, [map, marker])

    useEffect(() => {
        if (map && newRoutePoints.length > 0) {
            addOrUpdateRoutePoints()
            removeRoutePoints()
        }
    }, [map, newRoutePoints])

    useEffect(() => {
        if (routePoints.length !== 0)
            console.log(`route points: ${JSON.stringify(routePoints)}`)
    }, [routePoints])


    const addMarkerFeature = () => {
        // view
        const transformedCoordinates = fromLonLat(marker.coordinates)
        const markerFeature = new Feature({
            geometry: new Point(transformedCoordinates)
        })

        const iconStyle = new Style({
            image: new Icon({anchor: [0.5, 1], anchorXUnits: "fraction", anchorYUnits: "fraction", src: markerIcon}),
        })
        markerFeature.setStyle(iconStyle)

        const markerSource = map.getLayers().item(2).getSource()
        markerSource.addFeature(markerFeature)
    }

    const removeMarkerFeature = () => {
        const markerSource = map.getLayers().item(2).getSource()

        const coordinatesToRemove = fromLonLat(marker.coordinates)

        markerSource.getFeatures().forEach((feature) => {
            const featureCoordinates = feature.getGeometry().getCoordinates()
            if (coordinatesToRemove[0] === featureCoordinates[0] && coordinatesToRemove[1] === featureCoordinates[1]) {
                markerSource.removeFeature(feature)
            }
        })
    }

    const addOrUpdateRoutePoints = () => {
        setRoutePoints((prevRoutePoints) => {
            const updatedRoutePoints = [...prevRoutePoints]

            newRoutePoints.forEach((point) => {
                const existingIndex = updatedRoutePoints.findIndex((p) => {
                    const [lat, lon] = p.coordinates
                    const [newLat, newLon] = point.coordinates
                    return lat === newLat && lon === newLon
                })

                if (existingIndex !== -1) {
                    // Replace existing route point with the new one
                    updatedRoutePoints[existingIndex] = point
                } else {
                    // Add the new route point to the array
                    updatedRoutePoints.push(point)
                }
            })

            return updatedRoutePoints
        })
    }

    const removeRoutePoints = () => {
        setRoutePoints((prevRoutePoints) => {
            return prevRoutePoints.filter((point) => !point.isToRemove)
        })
    }

    const route = async () => {
        if (routePoints.length < 2) {
            handleShowMessage()
            return
        }

        removeRouteFeatures()

        const reversedCoordinates = routePoints.map((point) => [point.coordinates[1], point.coordinates[0]])

        const promises = []
        routePoints.forEach((point, index) => {
            console.log(`transport option: ${point.transportOption}`)
            if (index + 1 < reversedCoordinates.length)
                promises.push(routemap([reversedCoordinates[index], reversedCoordinates[index + 1]], point.transportOption))
        })

        const routeData = await Promise.all(promises)
        drawRoutes(routeData)

        apiPostRoute((response, status) => console.log(response, status))

        const sessionStorageKeys = ["start", "mid", "end"]
        sessionStorageKeys.forEach((key) => {
            sessionStorage.removeItem(key)
            sessionStorage.removeItem(`${key}Lat`)
            sessionStorage.removeItem(`${key}Lon`)
        })
    }

    function removeRouteFeatures() {
        const routeLayer = map.getLayers().getArray().filter(layer => layer.get('name') === routeLayerName)[0];
        const turnByTurnLayer = map.getLayers().getArray().filter(layer => layer.get('name') === turnByTurnLayerName);
        const tooltipOverlay = map.getLayers().getArray().filter(layer => layer.get('name') === tooltipOverlayName)[0];

        map.removeLayer(routeLayer);
        turnByTurnLayer.forEach(layer => {
            map.removeLayer(layer)
        });
        map.removeLayer(tooltipOverlay);
    }

    function drawRoutes(routeDataArray) {

        const routeFeatures = routeDataArray.map((data, index) => {
            const coordinates = data.features[0].geometry.coordinates[0]
            const transformedCoordinates = coordinates.map((coord) => transform(coord, 'EPSG:4326', 'EPSG:3857'))
            return createRouteLayerFeatures(transformedCoordinates, data, index)
        })

        const routeSource = new VectorSource({features: routeFeatures})

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

            routeFeatures.forEach((routeFeature, index) => {
                showRoadDetails(routeFeature, index)
                showTurnByTurnDetails(routeDataArray[index], index)
            })
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
                tooltipElement.textContent = '';

                const distanceDiv = document.createElement('div');
                distanceDiv.appendChild(createLabel('distance:', convertMetersToKilometers(distance) + '[km]'));
                tooltipElement.appendChild(distanceDiv);

                const timeDiv = document.createElement('div');
                timeDiv.appendChild(createLabel('time:', convertSecToHours(time)));
                tooltipElement.appendChild(timeDiv);

                const modeDiv = document.createElement('div');
                modeDiv.appendChild(createLabel('transport mode: ', mode));
                tooltipElement.appendChild(modeDiv);

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

    // helper function to create labeled content
    function createLabel(labelText, valueText) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'black-06 mat-caption';
        labelSpan.style = 'width: 100px; display:inline-block';
        labelSpan.textContent = labelText;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'mat-body black-08';
        valueSpan.style = 'color: #333333; font-weight: 500';
        valueSpan.textContent = valueText;

        const container = document.createElement('div');
        container.appendChild(labelSpan);
        container.appendChild(valueSpan);

        return container;
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
                return feature
            })

            if (feature && feature.values_.properties.instruction !== undefined) {
                document.getElementById('instructionContainer').innerHTML = feature.values_.properties.instruction.text
                tooltipOverlay.setPosition(clickedCoordinate)
            }
        });
    }

    const handleMapClick = async (event) => {
        const coordinates = event.coordinate
        const lonLat = toLonLat(coordinates)

        const placeDetailsData = await placeDetails(lonLat)

        if (placeDetailsData.features.length > 0) {
            const placeDetailsProperties = placeDetailsData.features[0].properties

            setPopupData({
                coordinates,
                lonLat,
                address: placeDetailsProperties.formatted ?? "",
                categories: placeDetailsProperties.categories[0] ?? ""
            })

            setIsPopupCardOpen(true)
        } else {
            console.warn(`No results found for coordinates: `, coordinates)
        }
    }

    const toggleTraffic = () => {
        if (trafficLayerGroup) {
            const layers = trafficLayerGroup.getLayers().getArray()
            const visible = !layers[0].getVisible()
            layers.forEach((layer) => layer.setVisible(visible))

            trafficHint === "Show traffic" ?
                setTrafficHint("Hide traffic")
                : setTrafficHint("Show traffic")

            const copyrightCaption = document.getElementById("copyright-caption")
            if (visible) {
                copyrightCaption.style.display = "block"
            } else {
                copyrightCaption.style.display = "none"
            }
        }
    }

    function convertSecToHours(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours + "h" + minutes + "m"
    }

    function convertMetersToKilometers(meters) {
        return meters / 1000
    }

    const trafficInfoToggle = () => {
        setTrafficInfo(!trafficInfo)
    }

    const handleShowMessage = () => {
        setShowMessage(true)
    }

    const handleCloseMessage = () => {
        setShowMessage(false)
    }

    // fixme - przeniesc do Homepage prawdpodopobnie
    const handlePopupCard = (data) => {
        const marker = {id: 2, coordinates: data.lonLat}
        addMarkerFeature(marker)
        onMarker2NameUpdate(data.address)
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
        <button className="map-button" onClick={toggleTraffic}>{trafficHint}</button>
        {trafficHint === "Hide traffic" && <button className="traffic-info-button" onClick={trafficInfoToggle}>Traffic information</button>}
        {trafficInfo && (<div className="traffic-card">
            <h3>Traffic information</h3>
            <div className="traffic-info">
                <p><span className="traffic-circle red"></span>Very slow or stationary traffic</p>
                <p><span className="traffic-circle yellow"></span>Slow-moving traffic</p>
                <p><span className="traffic-circle green"></span>Free-flowing traffic</p>
                <p><span className="traffic-circle grey"></span>Closed road</p>
                <p><i className="arrow"></i>Direction the traffic jam is taking place</p>
            </div>
            <button className="btn btn-primary" onClick={trafficInfoToggle}>Close</button>
        </div>)}
        {isPopupCardOpen && popupData && (<PopupCard data={popupData} onSelect={(data) => {
            handlePopupCard(data)
        }} setIsPopupOpen={setIsPopupCardOpen}/>)}
        <div className="copyright-caption" id="copyright-caption">©TomTom</div>
    </div>)
}

export default OLMap