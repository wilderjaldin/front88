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

    // err solo viene definido cuando el cierre fue inesperado (caída de red, etc.);
    // un stop() intencional (logout, cambio de token) cierra con err=undefined y no
    // debe tratarse como error — Next.js muestra un overlay bloqueante por cada console.error.
    connection.onclose((err) => {
      if (err) console.error("SignalR: conexión cerrada", err);
      else console.log("SignalR: conexión cerrada");
    });
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
