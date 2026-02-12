
export class SocketClient {
    private static instance: SocketClient;
    private socket: WebSocket | null = null;
    private listeners: ((data: any) => void)[] = [];
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnecting: boolean = false;

    private constructor() {
        this.connect();
    }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    private connect() {
        if (this.isConnecting) return;
        this.isConnecting = true;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log("Connecting to WebSocket:", wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("WebSocket Connected");
            this.isConnecting = false;
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.listeners.forEach((listener) => listener(message));
            } catch (e) {
                console.error("Failed to parse WebSocket message:", e);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket Disconnected. Reconnecting in 3s...");
            this.isConnecting = false;
            this.socket = null;
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
            this.socket?.close();
        };
    }

    public subscribe(callback: (data: any) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }
}

export const socketClient = SocketClient.getInstance();
