import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { INDIA_GEOJSON, THERMAL_DATA } from '@/lib/geo-data';
import { useDevices, useDrones } from '@/hooks/use-devices';
import { socketClient } from '@/lib/socket';

// --- Tactical Dark Mode Styles for Leaflet ---
// We inject this style to invert the standard OSM tiles, creating a high-tech "Defense" look.
// --- Tactical Dark Mode Styles for Leaflet ---
// We inject this style to invert the standard OSM tiles, creating a high-tech "Defense" look.
// Styles moved to index.css (.tactical-map-layer)

// Heatmap Component (must be child of MapContainer)
function HeatmapLayer() {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        if (!map) return;

        const heat = L.heatLayer(THERMAL_DATA as [number, number, number][], {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map]);

    return null;
}



// Controls map position from external props
function MapController({ target, zoomCmd }: { target: { lat: number, lng: number, zoom: number } | null, zoomCmd?: any }) {
    const map = useMap();

    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lng], target.zoom, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [target]);

    useEffect(() => {
        if (zoomCmd) {
            if (zoomCmd.action === 'in') map.zoomIn();
            if (zoomCmd.action === 'out') map.zoomOut();
        }
    }, [zoomCmd]);

    return null;
}

// Measurement Tool
function MeasureTool({ active }: { active: boolean | undefined }) {
    const map = useMap();
    const [points, setPoints] = useState<L.LatLng[]>([]);

    // Clear points when tool deactivated
    useEffect(() => {
        if (!active) setPoints([]);
    }, [active]);

    useEffect(() => {
        if (!active) return;

        const handler = (e: L.LeafletMouseEvent) => {
            setPoints(prev => {
                if (prev.length >= 2) return [e.latlng]; // Reset on 3rd click
                return [...prev, e.latlng];
            });
        };

        map.on('click', handler);
        return () => { map.off('click', handler); }
    }, [map, active]);

    if (!active || points.length === 0) return null;

    return (
        <>
            {points.map((p, i) => (
                <Marker key={i} position={p}>
                    <Popup>POINT {i + 1}</Popup>
                </Marker>
            ))}
            {points.length === 2 && (
                <Polyline positions={points} color="#3b82f6" dashArray="5, 10">
                    <Popup autoClose={false}>
                        DISTANCE: {(points[0].distanceTo(points[1])).toFixed(2)} M
                    </Popup>
                </Polyline>
            )}
        </>
    )
}

// Route Display Layer
// Route Display Layer
function RouteLayer({ geometry }: { geometry: any }) {
    if (!geometry) return null;
    const positions = geometry.coordinates.map((c: any) => [c[1], c[0]]); // Swap to Lat/Lng

    return (
        <>
            {/* Glow Effect */}
            <Polyline
                key={`glow-${geometry.coordinates[0][0]}`}
                positions={positions}
                color="#f97316"
                weight={8}
                opacity={0.4}
            />
            {/* Core Line */}
            <Polyline
                key={`line-${geometry.coordinates[0][0]}`}
                positions={positions}
                color="#fff"
                weight={3}
                dashArray="10, 10"
            />
        </>
    );
}

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMap().on('click', (e) => {
        if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    });
    return null;
}

export function TacticalLeafletMap({ active, layers, focusTarget, routeData, currentLocation, onMapClick, measureMode, zoomCmd }: {
    active: boolean,
    layers: any,
    focusTarget?: { lat: number, lng: number, zoom: number } | null,
    routeData?: any,
    currentLocation?: { lat: number, lng: number } | null,
    onMapClick?: (lat: number, lng: number) => void,
    measureMode?: boolean,
    zoomCmd?: { action: 'in' | 'out', ts: number } | null
}) {
    const { data: devices } = useDevices();
    const { data: drones } = useDrones();
    const [realtimeDetections, setRealtimeDetections] = useState<any[]>([]);
    const [hotspots, setHotspots] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [dronePaths, setDronePaths] = useState<Record<string, [number, number][]>>({});

    // Fetch Restricted Zones (PostGIS)
    useEffect(() => {
        if (!active) return;
        fetch('/api/gis/zones')
            .then(res => res.json())
            .then(data => setZones(data))
            .catch(err => console.error("Failed to load zones:", err));
    }, [active]);

    // Fetch Map Hotspots
    useEffect(() => {
        if (!active) return;
        fetch('/api/map/hotspots')
            .then(res => res.json())
            .then(data => setHotspots(data))
            .catch(err => console.error("Failed to load hotspots:", err));
    }, [active]);

    // Fetch Drone Paths
    useEffect(() => {
        if (!active || !drones) return;

        const fetchPaths = async () => {
            const newPaths: Record<string, [number, number][]> = {};
            for (const drone of drones) {
                try {
                    const res = await fetch(`/api/drones/${drone.id}/path`);
                    if (res.ok) {
                        const pathData = await res.json();
                        // Convert to [lat, lng]
                        newPaths[drone.id] = pathData.map((p: any) => [p.lat, p.lng]);
                    }
                } catch (e) {
                    console.error(`Failed to fetch path for ${drone.codeName}`, e);
                }
            }
            setDronePaths(newPaths);
        };

        fetchPaths();
        const interval = setInterval(fetchPaths, 10000);
        return () => clearInterval(interval);
    }, [active, drones]);

    // Subscribe to Real-time WebSocket
    useEffect(() => {
        const unsubscribe = socketClient.subscribe((msg: any) => {
            if (msg.type === 'NEW_DETECTION') {
                console.log("Map received detection:", msg.data);
                // Add to list, keep last 10
                setRealtimeDetections(prev => {
                    const exists = prev.find(d => d.id === msg.data.id);
                    if (exists) return prev;
                    return [msg.data, ...prev].slice(0, 10);
                });
            }
        });
        return unsubscribe;
    }, []);

    // Fix for default Leaflet markers in React
    useEffect(() => {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    if (!active) return null;

    return (
        <div className="absolute inset-0 z-0 bg-black">
            <MapContainer
                className="tactical-map-layer"
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                zoomControl={false}
                attributionControl={false}
            >
                <MapController target={focusTarget || null} zoomCmd={zoomCmd} />
                <MapEvents onClick={measureMode ? undefined : onMapClick} />
                <MeasureTool active={measureMode} />

                {/* 1. Base Layer (Geoapify Backend Proxy) */}
                {/* Fetches from /api/gis/tiles which proxies to Geoapify Dark Matter */}
                <TileLayer
                    url="/api/gis/tiles/{z}/{x}/{y}"
                    eventHandlers={{
                        tileerror: (e) => {
                            console.warn("Tile Failed, switching to fallback", e);
                            e.target.setUrl('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
                        }
                    }}
                />

                {layers.terrain && (
                    <WMSTileLayer
                        url="/api/gis/bhuvan/wms"
                        params={{
                            layers: 'L3-INDIA', // LISS III Composite
                            format: 'image/jpeg',
                            transparent: true,
                            version: '1.1.1'
                        }}
                        attribution='ISRO / NRSC Bhuvan'
                    />
                )}

                {/* 3. India Borders & Zones (GeoJSON) */}
                {INDIA_GEOJSON.features.map((feature, i) => (
                    <Polygon
                        key={i}
                        positions={feature.geometry.coordinates[0].map((coord: any) => [coord[1], coord[0]])} // GeoJSON is Lng/Lat, Leaflet is Lat/Lng
                        pathOptions={{
                            color: feature.properties.type === 'high-risk' ? '#ef4444' : '#f59e0b',
                            fillColor: feature.properties.type === 'high-risk' ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.1,
                            weight: 1,
                            dashArray: '5, 10'
                        }}
                    />
                ))}

                {/* 3.5. PostGIS Restricted Zones (Dynamic) */}
                {zones.map((zone) => {
                    if (!zone.area || !zone.area.coordinates) return null;
                    // PostGIS GeoJSON coords are [lng, lat], Leaflet needs [lat, lng]
                    const positions = zone.area.coordinates[0].map((c: number[]) => [c[1], c[0]]);
                    const isRestricted = zone.zoneType === 'RESTRICTED';

                    return (
                        <Polygon
                            key={`zone-${zone.id}`}
                            positions={positions}
                            pathOptions={{
                                color: isRestricted ? '#dc2626' : '#ea580c',
                                fillColor: isRestricted ? '#7f1d1d' : '#9a3412',
                                fillOpacity: 0.3,
                                weight: 2,
                                className: isRestricted ? 'animate-pulse' : ''
                            }}
                        >
                            <Popup className="tactical-popup">
                                <div className="text-black font-mono text-xs p-1">
                                    <strong className="text-red-700">{zone.name}</strong><br />
                                    TYPE: {zone.zoneType}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}

                {/* 4. Thermal / Heatmap Layer */}
                {layers.heatmap && <HeatmapLayer />}

                {/* 5. Search Taret Marker (New) */}
                {focusTarget && (
                    <Marker position={[focusTarget.lat, focusTarget.lng]}>
                        <Popup>TARGET_SECTOR</Popup>
                    </Marker>
                )}

                {/* 6. Tactical Route (New) */}
                {routeData && <RouteLayer geometry={routeData} />}

                {/* 6.5 Current Location Marker (Blue Pulse) */}
                {currentLocation && (
                    <Marker
                        position={[currentLocation.lat, currentLocation.lng]}
                        icon={L.divIcon({
                            className: 'bg-transparent',
                            html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px #3b82f6; animation: pulse 1s infinite;"></div>`
                        })}
                    >
                        <Popup>UNIT_LOCATION (YOU)</Popup>
                    </Marker>
                )}

                {/* 7.1 Drone Breadcrumbs */}
                {Object.entries(dronePaths).map(([id, path]) => (
                    <Polyline
                        key={`path-${id}`}
                        positions={path}
                        pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '4, 4', opacity: 0.6 }}
                    />
                ))}

                {/* 7. DRONES (New - from PostGIS) */}
                {drones?.map((drone: any) => {
                    const customIcon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div style="
                            width: 16px; 
                            height: 16px; 
                            background-color: ${drone.status === 'IDLE' ? '#22c55e' : '#eab308'}; 
                            border-radius: 0%; 
                            transform: rotate(45deg);
                            border: 2px solid white;
                            box-shadow: 0 0 15px ${drone.status === 'IDLE' ? '#22c55e' : '#eab308'};
                        "></div>`
                    });

                    return (
                        <Marker
                            key={drone.id}
                            position={[drone.lat, drone.lng]}
                            icon={customIcon}
                        >
                            <Popup className="tactical-popup">
                                <div className="text-black font-mono text-xs p-1">
                                    <strong>{drone.codeName}</strong><br />
                                    TYPE: {drone.type}<br />
                                    BAT: {drone.batteryLevel}%
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}

                {/* 7.5. INTEL HOTSPOTS (From Backend) */}
                {hotspots.map((spot) => {
                    const color = spot.severity === 'HIGH' ? '#ef4444' : '#eab308';
                    const icon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div style="
                            width: 0; 
                            height: 0; 
                            border-left: 8px solid transparent;
                            border-right: 8px solid transparent;
                            border-bottom: 16px solid ${color};
                            filter: drop-shadow(0 0 4px ${color});
                            animation: bounce 2s infinite;
                        "></div>`
                    });

                    return (
                        <Marker key={`hotspot-${spot.id}`} position={[spot.lat, spot.lng]} icon={icon}>
                            <Popup className="tactical-popup">
                                <div className="text-black font-mono text-xs p-1">
                                    <strong style={{ color }}>{spot.severity} INTEL</strong><br />
                                    {spot.title}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* 8. REAL-TIME DETECTIONS (High Confidence) */}
                {realtimeDetections.map((detection) => {
                    if (!detection.location || !detection.location.coordinates) return null;
                    const logLat = detection.location.coordinates[1];
                    const logLng = detection.location.coordinates[0];

                    const alertIcon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div style="
                            width: 20px; 
                            height: 20px; 
                            background-color: #ef4444; 
                            border-radius: 50%; 
                            border: 2px solid white;
                            box-shadow: 0 0 20px #ef4444; 
                            animation: pulse 0.5s infinite;
                        "></div>`
                    });

                    return (
                        <Marker
                            key={detection.id}
                            position={[logLat, logLng]}
                            icon={alertIcon}
                        >
                            <Popup className="tactical-popup">
                                <div className="text-black font-mono text-xs p-1">
                                    <strong className="text-red-600">THREAT DETECTED</strong><br />
                                    OBJ: {detection.detected_object}<br />
                                    CONF: {detection.confidence}%
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}

                {/* 7. Device Markers (Legacy) */}
                {devices?.map((device) => {
                    // Map Backend 'x/y' (which were 2500, etc) to Real Lat/Lng
                    // In a real system, DB would store lat/lng directly. 
                    // For this demo, we project 2500,2500 -> Center of India [20.5937, 78.9629]
                    // and scale offsets.
                    const lat = 20.5937 + ((2500 - (device.y || 2500)) / 100);
                    const lng = 78.9629 + (((device.x || 2500) - 2500) / 100);

                    const customIcon = L.divIcon({
                        className: 'bg-transparent',
                        html: `<div style="
                            width: 12px; 
                            height: 12px; 
                            background-color: ${device.status === 'online' ? '#22c55e' : '#ef4444'}; 
                            border-radius: 50%; 
                            border: 2px solid white;
                            box-shadow: 0 0 10px ${device.status === 'online' ? '#22c55e' : '#ef4444'};
                            animation: pulse 2s infinite;
                        "></div>`
                    });

                    return (
                        <Marker
                            key={device.id}
                            position={[lat, lng]}
                            icon={customIcon}
                        >
                            <Popup className="tactical-popup">
                                <div className="text-black font-mono text-xs p-1">
                                    <strong>{device.name}</strong><br />
                                    STATUS: {device.status.toUpperCase()}<br />
                                    BAT: {device.battery}%
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}

            </MapContainer>

        </div>
    );
}
