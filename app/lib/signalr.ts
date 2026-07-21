import * as signalR from "@microsoft/signalr";

// NEXT_PUBLIC_API_URL = "http://localhost:5251/api/" -> hub vive en "http://localhost:5251/hubs/inbox"
const HUB_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/api\/?$/, "") + "hubs/inbox";

let currentToken = "";
export function setHubToken(token: string | null | undefined) {
  currentToken = token ?? "";
}

let connection: signalR.HubConnection | null = null;

export function getHubConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => currentToken })
      .withAutomaticReconnect()
      .build();

    connection.onclose((err) => console.error("SignalR: conexión cerrada", err));
    connection.onreconnecting((err) => console.warn("SignalR: reconectando...", err));
    connection.onreconnected(() => console.log("SignalR: reconectado"));
  }
  return connection;
}

export async function stopHubConnection() {
  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }
}
