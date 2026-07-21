"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import Swal from "sweetalert2";
import axiosClient from "@/app/lib/axiosClient";
import { selectToken } from "@/store/authSlice";
import { setTotalNoLeidos } from "@/store/notificationsSlice";
import { getHubConnection, setHubToken, stopHubConnection } from "@/app/lib/signalr";

const URL_NO_LEIDOS = "inbox/no-leidos";

// Mismos colores de avatar que usa app/admin/inbox/page.tsx, para que la notificación
// se sienta parte del mismo sistema en vez de una caja oscura genérica.
const AVATAR_COLORS = [
  "bg-primary", "bg-secondary", "bg-info", "bg-success",
  "bg-warning", "bg-danger", "bg-violet-500", "bg-pink-500",
];
function getInitials(name: string = ""): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function avatarColor(name: string = ""): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: false, // el cierre lo maneja nuestro propio botón dentro del html (evita el solapamiento del close nativo)
  timer: 8000,
  timerProgressBar: true,
  width: 320,
  padding: "0.75rem",
  customClass: {
    popup: "!bg-white dark:!bg-gray-800 !rounded-xl !shadow-lg !border !border-gray-200 dark:!border-gray-700",
    timerProgressBar: "!bg-primary",
  },
  didOpen: (el) => {
    el.onmouseenter = Swal.stopTimer;
    el.onmouseleave = Swal.resumeTimer;
    el.querySelector<HTMLElement>("[data-toast-close]")?.addEventListener("click", () => Swal.close());
  },
});

function fireMessageToast(nombre: string, mensaje: string) {
  const initials = getInitials(nombre);
  const color = avatarColor(nombre);
  Toast.fire({
    html: `
      <div class="flex items-start gap-2.5 text-left">
        <div class="${color} h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">${initials}</div>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-sm font-semibold text-gray-800 dark:text-white truncate">${nombre}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${mensaje}</p>
        </div>
        <button data-toast-close type="button" class="shrink-0 -mt-1 -mr-1 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `,
  });
}

export default function NotificationsProvider() {
  const token = useSelector(selectToken);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      stopHubConnection();
      return;
    }

    // Conteo inicial del badge — los eventos del hub solo lo actualizan a partir de aquí
    axiosClient.get(URL_NO_LEIDOS)
      .then((rs) => dispatch(setTotalNoLeidos(rs.data?.total ?? 0)))
      .catch(() => {});

    setHubToken(token);
    const conn = getHubConnection();

    const onNuevaMensaje = (data: any) => {
      dispatch(setTotalNoLeidos(data?.totalNoLeidos ?? 0));
      fireMessageToast(data?.nomUsuario ?? "Nuevo mensaje", data?.desMensaje ?? "");
    };

    // El backend todavía no dispara estos dos en flujos reales — los listeners
    // quedan listos para cuando responder/archivar emitan al otro usuario.
    const onMensajeVisto = (_data: any) => {};
    const onMensajeArchivado = (_data: any) => {};

    conn.on("nuevaMensaje", onNuevaMensaje);
    conn.on("mensajeVisto", onMensajeVisto);
    conn.on("mensajeArchivado", onMensajeArchivado);

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn.start().catch((err) => console.error("SignalR: error al conectar", err));
    }

    return () => {
      conn.off("nuevaMensaje", onNuevaMensaje);
      conn.off("mensajeVisto", onMensajeVisto);
      conn.off("mensajeArchivado", onMensajeArchivado);
    };
  }, [token, dispatch]);

  return null;
}
