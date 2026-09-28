import * as signalR from "@microsoft/signalr";

// NEXT_PUBLIC_API_URL = "http://localhost:5251/api/" -> hub vive en "http://localhost:5251/hubs/inbox"
const HUB_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/api\/?$/, "") + "hubs/inbox";

let currentToken = "";
export function setHubToken(token: string | null | undefined) {
  currentToken = token ?? "";
}

let connection: signalR.HubConnection | null = null;

// El SDK no tiene "offreconnected" para desregistrar un callback puntual — sus
// callbacks se acumulan. Por eso el registro real (connection.onreconnected)
// se hace una sola vez, acá abajo, al crear la conexión; lo que puede cambiar
// entre renders (router, t del componente) se pasa por esta referencia mutable
// en vez de volver a llamar connection.onreconnected en cada efecto.
let onReconnectedCallback: (() => void) | null = null;
export function setOnReconnected(cb: (() => void) | null) {
  onReconnectedCallback = cb;
}

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
    });
    connection.onreconnecting((err) => console.warn("SignalR: reconectando...", err));
    // Red de seguridad para el usuario que se queda desconectado justo en el
    // momento de un cambio de permisos/sesión: al reconectar, vuelve a chequear.
    connection.onreconnected(() => onReconnectedCallback?.());
  }
  return connection;
}

export async function stopHubConnection() {
  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }
}
