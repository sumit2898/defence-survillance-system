import { Layout } from '@/components/Layout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DroneFleetManager } from '@/components/DroneFleetManager';
import { SystemPulse } from '@/components/SystemPulse';
import { useDroneFleet } from '@/hooks/useDroneTelemetry';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Plane, Activity, Layers3, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom marker icons
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-center; box-shadow: 0 0 20px ${color}50;"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

export default function TacticalOverview() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [showDrones, setShowDrones] = useState(true);
    const { drones, fleetStatus, isConnected } = useDroneFleet();

    // Mock camera locations
    const cameras = [
        { id: 'cam-001', lat: 28.6139, lng: 77.2090, name: 'Sector Alpha' },
        { id: 'cam-002', lat: 28.6155, lng: 77.2105, name: 'Sector Beta' },
        { id: 'cam-003', lat: 28.6125, lng: 77.2120, name: 'Sector Gamma' },
    ];

    const cameraIcon = createCustomIcon('#00ffff');
    const droneIcon = createCustomIcon('#fbbf24');

    // Mock Chart Data
    const batteryData = drones.map(d => ({ name: d.name.replace('Drone-', 'D'), battery: d.battery }));
    const signalData = [
        { time: '10:00', strength: 85 }, { time: '10:05', strength: 82 },
        { time: '10:10', strength: 90 }, { time: '10:15', strength: 88 },
        { time: '10:20', strength: 95 }, { time: '10:25', strength: 92 },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 border border-white/10 p-2 rounded text-xs font-mono">
                    <p className="text-white mb-1">{label}</p>
                    <p className="text-cyan-400">{payload[0].value}{payload[0].unit || '%'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Layout>
            <div className="flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Layers3 className="w-6 h-6 text-cyan-500" />
                            <div>
                                <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white">
                                    TACTICAL OVERVIEW
                                </h1>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    3D BATTLEFIELD INTELLIGENCE SYSTEM
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono">
                                {isConnected ? 'UPLINK ACTIVE' : 'CONNECTING...'}
                            </Badge>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDrones(!showDrones)}
                                className={cn(
                                    'font-mono text-xs border-white/10',
                                    showDrones && 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                )}
                            >
                                <Plane className="w-3 h-3 mr-2" />
                                DRONES
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex gap-4 p-4">
                    {/* Left Sidebar - System Health */}
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-80 flex flex-col gap-4"
                    >
                        <SystemPulse />

                        <Card className="bg-black/40 border-white/10 backdrop-blur-md p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-cyan-500" />
                                <h3 className="text-xs font-black tracking-wider uppercase text-white">
                                    SIGNAL INTEGRITY
                                </h3>
                            </div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={signalData}>
                                        <defs>
                                            <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="strength" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSignal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Tactical Alert Feed */}
                        <Card className="bg-black/40 border-white/10 backdrop-blur-md p-4 flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <h3 className="text-xs font-black tracking-wider uppercase text-white">
                                    TACTICAL ALERTS
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { time: '10:42:05', msg: 'UNAUTHORIZED_DRONE_DETECTED', level: 'crit' },
                                    { time: '10:41:50', msg: 'PERIMETER_BREACH_SECTOR_4', level: 'crit' },
                                    { time: '10:40:12', msg: 'MOTION_SENSOR_TRIP_ZONE_B', level: 'warn' },
                                    { time: '10:38:00', msg: 'SIGNAL_INTERFERENCE_DETECTED', level: 'warn' },
                                ].map((alert, i) => (
                                    <div key={i} className="flex gap-3 text-xs border-b border-white/5 pb-2 last:border-0">
                                        <span className="font-mono text-zinc-500">{alert.time}</span>
                                        <span className={cn(
                                            "font-black tracking-tight",
                                            alert.level === 'crit' ? "text-red-500" : "text-amber-500"
                                        )}>{alert.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Center - Map */}
                    <div className="flex-1 relative rounded-lg overflow-hidden border border-white/10 h-[800px]">
                        <MapContainer
                            center={[28.6139, 77.2090]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            />

                            {/* Camera Markers */}
                            {cameras.map((camera) => (
                                <Marker
                                    key={camera.id}
                                    position={[camera.lat, camera.lng]}
                                    icon={cameraIcon}
                                    eventHandlers={{
                                        click: () => setSelectedNode(camera.id),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-sm font-mono">
                                            <div className="font-bold">{camera.name}</div>
                                            <div className="text-xs text-zinc-600">
                                                {camera.lat.toFixed(4)}°, {camera.lng.toFixed(4)}°
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Drone Markers & Paths */}
                            {showDrones && drones.map((drone) => {
                                const pathCoordinates: [number, number][] = [
                                    [drone.location.lat - 0.001, drone.location.lng - 0.001],
                                    [drone.location.lat, drone.location.lng],
                                    [drone.location.lat + 0.001, drone.location.lng + 0.001],
                                ];

                                return (
                                    <div key={drone.id}>
                                        <Marker
                                            position={[drone.location.lat, drone.location.lng]}
                                            icon={droneIcon}
                                        >
                                            <Popup>
                                                <div className="text-sm font-mono">
                                                    <div className="font-bold">{drone.name}</div>
                                                    <div className="text-xs">
                                                        <div>Battery: {drone.battery.toFixed(0)}%</div>
                                                        <div>Altitude: {drone.location.altitude.toFixed(0)}m</div>
                                                        <div>Speed: {drone.speed.toFixed(1)} m/s</div>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        <Polyline
                                            positions={pathCoordinates}
                                            pathOptions={{ color: '#00ffff', weight: 2, opacity: 0.6 }}
                                        />
                                    </div>
                                );
                            })}
                        </MapContainer>

                        {/* Map Overlay Info */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 rounded p-3 z-[1000]">
                            <div className="text-[10px] text-zinc-500 font-mono mb-1">COORDINATES</div>
                            <div className="text-xs font-mono text-cyan-400">
                                28.6139°, 77.2090°
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Telemetry & Fleet */}
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-96 flex flex-col gap-4"
                    >
                        {/* Drone Battery Matrix */}
                        <Card className="bg-black/40 border-white/10 backdrop-blur-md p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-yellow-500" />
                                <h3 className="text-xs font-black tracking-wider uppercase text-white">
                                    FLEET ENERGY MATRIX
                                </h3>
                            </div>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={batteryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="battery" fill="#eab308" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <DroneFleetManager
                            drones={drones}
                            fleetStatus={fleetStatus}
                            onDroneClick={(drone) => {
                                console.log('Drone clicked:', drone.name);
                            }}
                        />
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
