import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import postgres from "postgres";

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/defence_surveillance";
    console.log("WS Listener connecting to:", dbUrl.replace(/:[^:@]*@/, ":****@")); // Mask password

    // Using 'postgres' library (postgres.js) as requested for robust auto-reconnect
    const sql = postgres(dbUrl, {
        idle_timeout: 0, // Keep connection alive
        connect_timeout: 10,
        max_lifetime: 0
    });

    console.log("Setting up Postgres Listener on channel 'high_threat_alert'...");

    // Postgres.js handles reconnection automatically!
    sql.listen('high_threat_alert', (payload) => {
        try {
            const data = JSON.parse(payload);
            console.log("🚀 Real-time Alert:", data.id || data.type);

            // If payload has a 'type' (e.g. SYSTEM_EVENT), use it. Otherwise default to NEW_DETECTION
            const messageType = data.type || "NEW_DETECTION";
            const message = JSON.stringify({ type: messageType, data: data.data || data });

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        } catch (e) {
            console.error("Error parsing notification:", e);
        }
    }).then(() => {
        console.log("✅ Listening for high_threat_alert");
    }).catch((err) => {
        console.error("❌ Postgres Listen Error:", err);
    });

    wss.on("connection", (ws) => {
        console.log("Client connected to Live Feed");
        ws.send(JSON.stringify({ type: "CONNECTED", message: "Live Feed Active" }));
    });

    return wss;
}
