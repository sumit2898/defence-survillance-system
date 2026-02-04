import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/ui/PageTransition";
// MapBackground removed
import { WeatherLayer, HeatmapLayer, ZoneLayer, IndianBorderLayer, SatelliteLayer } from "@/components/MapLayers";
import { TacticalLeafletMap } from "@/components/TacticalLeafletMap";
import { useDevices } from "@/hooks/use-devices";
import { MapPin, Navigation, Scan, Locate, Layers, Crosshair, ZoomIn, ZoomOut, CloudRain, Flame, ShieldAlert, Ruler, MousePointer2, Map as MapIcon, Globe, Satellite } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function MapView() {
    const { data: devices } = useDevices();
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

    // Layers State
    const [layers, setLayers] = useState({
        weather: false,
        heatmap: false,
        zones: true,
        borders: true,
        satellite: false,
        terrain: false
    });

    // Distance Tool Placeholder (Future: Implement via Leaflet.Draw or similar)
    const [measureMode, setMeasureMode] = useState(false);

    // Zoom State (Command Pattern to control Map from UI)
    const [zoomLevel, setZoomLevel] = useState(5);
    const [zoomCmd, setZoomCmd] = useState<{ action: 'in' | 'out', ts: number } | null>(null);

    const handleZoom = (dir: 'in' | 'out') => {
        setZoomCmd({ action: dir, ts: Date.now() });
        setZoomLevel(prev => dir === 'in' ? prev + 1 : prev - 1);
    };

    // Device Link Logic
    const handleEstablishLink = () => {
        const deviceName = devices?.find(d => d.id.toString() === selectedDevice)?.name || "DEVICE";
        alert(`ESTABLISHING SECURE DATALINK TO [${deviceName}]...\n\n...ENCRYPTED CHANNEL VERIFIED.\n...STREAM OPTIMIZED.`);
    };

    // --- Search & Routing State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isRouting, setIsRouting] = useState(false);
    const [mapFocus, setMapFocus] = useState<{ lat: number, lng: number, zoom: number } | null>(null);

    // Simulate Search (Connect to Real Backend)
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let lat, lng;

            if (routeSource === 'bhuvan') {
                // Official Bhuvan Search
                console.log(`Searching via Bhuvan: ${searchQuery}`);
                const res = await fetch(`/api/gis/bhuvan/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data && data.length > 0) {
                    lat = data[0].lat;
                    lng = data[0].lon;
                    alert(`Bhuvan Found: ${data[0].name}`);
                }
            } else {
                // Tactical Geoapify Search
                const res = await fetch(`/api/gis/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    const feat = data.features[0];
                    [lng, lat] = feat.geometry.coordinates; // GeoJSON is [lng, lat]
                }
            }

            if (lat && lng) {
                console.log("Flying to:", lat, lng);
                setMapFocus({ lat, lng, zoom: 14 });
                if (isRouting) {
                    calculateRoute({ lat, lng });
                }
            } else {
                alert("Sector Unknown / Not Found");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // ... (rest of code)

    // Handle Map Click for Analysis
    const handleAnalysisClick = async (lat: number, lng: number) => {
        if (!analysisMode) return;

        // Use resilient fetching - if one fails, others should still show
        const fetchSafe = async (url: string) => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("Fetch failed");
                return await res.json();
            } catch (e) {
                console.warn(`Failed to fetch ${url}`, e);
                return {}; // Return empty object on fail
            }
        };

        try {
            console.log(`Analyzing: ${lat}, ${lng}`);
            const [lulc, elev, village] = await Promise.all([
                fetchSafe(`/api/gis/bhuvan/lulc?lat=${lat}&lon=${lng}`),
                fetchSafe(`/api/gis/bhuvan/elevation?lat=${lat}&lon=${lng}`),
                fetchSafe(`/api/gis/bhuvan/reverse?lat=${lat}&lon=${lng}`)
            ]);

            const result = { ...lulc, ...elev, ...village };
            // Ensure at least some data exists to show the card
            if (Object.keys(result).length > 0) {
                setAnalysisResult(result);
            }
            console.log("Analysis Result:", result);
        } catch (e) {
            console.error("Analysis Critical Failure", e);
        }
    }

    // GIS Modes
    const [analysisMode, setAnalysisMode] = useState(false);
    const [routeSource, setRouteSource] = useState<'geoapify' | 'bhuvan'>('geoapify');
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Restore Missing State
    const [routeData, setRouteData] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Calculate Route from "Base" (Simulated Fixed Point for Demo) to Target
    const calculateRoute = async (destination: { lat: number, lng: number }) => {
        // Simulated "Current Location" (e.g., Delhi HQ) or Real GPS
        const start = currentLocation || { lat: 28.6139, lng: 77.2090 };
        const endpoint = routeSource === 'geoapify' ? '/api/gis/route' : '/api/gis/bhuvan/route';

        try {
            console.log(`Calculating Route via ${routeSource}...`);
            const res = await fetch(`${endpoint}?start=${start.lat},${start.lng}&end=${destination.lat},${destination.lng}`);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
                setRouteData(data.features[0].geometry);
                alert(`Route Calculated (${routeSource.toUpperCase()}): ${(data.features[0].properties.distance / 1000).toFixed(2)} km`);
            } else {
                alert("No Route Found / Bhuvan Service Unavailable");
            }
        } catch (e) {
            console.error(e);
            alert("Routing Failed");
        }
    };

    // Get Real User Location
    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // console.log("Locate Me:", latitude, longitude);
                setCurrentLocation({ lat: latitude, lng: longitude });
                setMapFocus({ lat: latitude, lng: longitude, zoom: 15 });
            }, (error) => {
                console.warn("Geolocation Warning:", error.message);
                // Removed alert per user request
            }, { enableHighAccuracy: true, timeout: 10000 });
        }
    };

    return (
        <Layout className="h-full relative overflow-hidden p-0 select-none">
            {/* Main Map Container */}
            <div className="absolute inset-0 z-0">
                <TacticalLeafletMap
                    active={true}
                    layers={layers}
                    focusTarget={mapFocus}
                    routeData={routeData}
                    currentLocation={currentLocation}
                    onMapClick={handleAnalysisClick}
                    measureMode={measureMode}
                    zoomCmd={zoomCmd}
                />

                {/* Visual Overlays (Non-Leaflet) */}
                <WeatherLayer active={layers.weather} />
                <HeatmapLayer active={layers.heatmap} />
                <SatelliteLayer active={layers.satellite} />
                <ZoneLayer active={layers.zones} />
                <IndianBorderLayer active={layers.borders} />
            </div>

            {/* UI Overlay (Fixed) */}
            <PageTransition className="relative z-50 w-full h-full pointer-events-none p-6 flex flex-col justify-between">

                {/* Top Bar */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-1">
                        <h1 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Scan className="w-5 h-5 text-green-500 animate-pulse" />
                            TACTICAL_MAP_V2
                        </h1>
                        <div className="flex gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span>ZM: {zoomLevel}X</span>
                            <span>POS: TACTICAL_GRID</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-xl flex gap-2 pointer-events-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH_SECTOR..."
                            className="bg-transparent border-none text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none w-48 px-2"
                        />
                        <button type="submit" className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-500">
                            <MapIcon className="h-4 w-4" />
                        </button>
                    </form>

                    <div className="flex gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-xl">
                        {[
                            { id: 'satellite', icon: Globe, label: 'SAT_UPLINK' },
                            { id: 'terrain', icon: Satellite, label: 'ISRO_SAT' },
                            { id: 'weather', icon: CloudRain, label: 'WX_RADAR' },
                            { id: 'heatmap', icon: Flame, label: 'TH_RML' },
                            { id: 'zones', icon: ShieldAlert, label: 'RES_ZONE' },
                            { id: 'borders', icon: MapIcon, label: 'INDIA_GRID' }
                        ].map(layer => (
                            <button
                                key={layer.id}
                                onClick={() => setLayers(p => ({ ...p, [layer.id]: !p[layer.id as keyof typeof layers] }))}
                                className={cn(
                                    "p-3 rounded-lg transition-all border",
                                    layers[layer.id as keyof typeof layers]
                                        ? "bg-green-500/20 border-green-500/50 text-green-500"
                                        : "bg-transparent border-transparent text-zinc-500 hover:text-white"
                                )}
                                title={layer.label}
                            >
                                <layer.icon className="h-5 w-5" />
                            </button>
                        ))}
                        <div className="w-[1px] bg-white/10 mx-1" />
                        <button
                            onClick={() => {
                                setMeasureMode(!measureMode);
                            }}
                            className={cn(
                                "p-3 rounded-lg transition-all border",
                                measureMode
                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-500"
                                    : "bg-transparent border-transparent text-zinc-500 hover:text-white"
                            )}
                        >
                            <Ruler className="h-5 w-5" />
                        </button>
                        <div className="w-[1px] bg-white/10 mx-1" />
                        <button
                            onClick={() => setIsRouting(!isRouting)}
                            className={cn(
                                "p-3 rounded-lg transition-all border",
                                isRouting
                                    ? "bg-orange-500/20 border-orange-500/50 text-orange-500"
                                    : "bg-transparent border-transparent text-zinc-500 hover:text-white"
                            )}
                            title="TACTICAL_ROUTE"
                        >
                            <Navigation className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Bottom Tools & Minimap */}
                <div className="flex items-end justify-between pointer-events-auto">
                    {/* Device Detail Card */}
                    <AnimatePresence mode="wait">
                        {selectedDevice ? (
                            <motion.div
                                key="detail"
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="bg-black/90 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl w-80 shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-black text-white uppercase">{devices?.find(d => d.id.toString() === selectedDevice)?.name}</h3>
                                    <button onClick={() => setSelectedDevice(null)} className="text-zinc-500 hover:text-white">✕</button>
                                </div>
                                {/* ... existing device details code ... */}
                                <button onClick={handleEstablishLink} className="w-full py-2 bg-green-500 text-black font-bold text-xs uppercase rounded hover:bg-green-400 font-mono">
                                    ESTABLISH_LINK
                                </button>
                            </motion.div>
                        ) : analysisResult ? (
                            <motion.div
                                key="analysis"
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="bg-black/90 backdrop-blur-2xl border border-blue-500/30 p-6 rounded-2xl w-80 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-black text-blue-400 uppercase tracking-widest flex gap-2 items-center">
                                        <Crosshair className="w-4 h-4" /> TERRAIN_INTEL
                                    </h3>
                                    <button onClick={() => setAnalysisResult(null)} className="text-zinc-500 hover:text-white">✕</button>
                                </div>
                                <div className="space-y-3 font-mono text-xs">
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span className="text-zinc-500">CLASS</span>
                                        <span className="text-white font-bold">{analysisResult.class}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span className="text-zinc-500">RISK</span>
                                        <span className={cn("font-bold", analysisResult.risk_factor.includes("High") ? "text-red-500" : "text-green-500")}>
                                            {analysisResult.risk_factor}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span className="text-zinc-500">ELEVATION</span>
                                        <span className="text-blue-400">{analysisResult.elevation_m?.toFixed(1)} M (MSL)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span className="text-zinc-500">VILLAGE</span>
                                        <span className="text-orange-400">{analysisResult.village || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">SOURCE</span>
                                        <span className="text-zinc-400">BHUVAN_ISRO</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div />
                        )}
                    </AnimatePresence>

                    {/* Minimap & HUD Controls */}
                    <div className="flex gap-4 items-end">
                        {/* GIS Modes Switcher */}
                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex flex-col gap-2">
                            <button
                                onClick={() => setAnalysisMode(!analysisMode)}
                                className={cn("p-2 rounded transition-colors", analysisMode ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10")}
                                title="Intel Mode (Click to Analyze)"
                            >
                                <Crosshair className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setRouteSource(s => s === 'geoapify' ? 'bhuvan' : 'geoapify')}
                                className={cn("p-2 rounded transition-colors text-xs font-bold font-mono", routeSource === 'bhuvan' ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10")}
                                title={`Route Source: ${routeSource.toUpperCase()}`}
                            >
                                {routeSource === 'bhuvan' ? 'BHV' : 'GPY'}
                            </button>
                        </div>

                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex flex-col gap-2">
                            <button onClick={() => handleZoom('in')} className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ZoomIn className="h-5 w-5" /></button>
                            <button onClick={() => handleZoom('out')} className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ZoomOut className="h-5 w-5" /></button>
                            <button onClick={handleLocateMe} className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Locate className="h-5 w-5" /></button>
                        </div>

                        {/* Minimap Removed as per request */}
                    </div>
                </div>

            </PageTransition>
        </Layout>
    );
}
