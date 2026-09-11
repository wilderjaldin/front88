"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import Swal from "sweetalert2";
import axiosClient from "@/app/lib/axiosClient";
import { useTranslation } from "@/app/locales";
import { selectToken } from "@/store/authSlice";
import { setTotalNoLeidos } from "@/store/notificationsSlice";
import { getHubConnection, setHubToken, stopHubConnection } from "@/app/lib/signalr";

const URL_NO_LEIDOS = "inbox/no-leidos";

// Misma tabla que usa app/admin/revision/quotes/page.js para elegir el sub-form
// según la categoría de la cotización — la necesitamos acá para armar el link.
const CATEGORY_OPTION: Record<string, string> = { NR: "quotes", SC: "quotes-without-code", MA: "manual" };

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

// Click en el toast → ir al inbox (comportamiento por defecto, igual en todos
// los toasts). Si el click cae dentro de un [data-quote-link] (el "#numero"
// dentro del mensaje), va a esa cotización en cambio. Se setean justo antes de
// cada fire() porque SweetAlert2 no deja pasar callbacks por fire() sin pisar
// el didOpen del mixin.
let pendingNavigate: (() => void) | null = null;
let pendingLinkNavigate: (() => void) | null = null;

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: false, // el cierre lo maneja nuestro propio botón dentro del html (evita el solapamiento del close nativo)
  timer: 8000,
  timerProgressBar: true,
  width: 360,
  padding: "0.75rem",
  customClass: {
    // overflow-hidden fuerza a que el toast nunca muestre scrollbar propia,
    // sin redondeo, con borde visible y sombra fuerte para que se note. Sin
    // cursor-pointer forzado: el puntero solo debe verse sobre el link interno.
    // min-w fija un ancho mínimo uniforme para todas las notificaciones SignalR
    // (si no, sweetalert2 encoge el toast al contenido cuando el texto es corto).
    popup: "!rounded-none !shadow-2xl !border !border-gray-300 dark:!border-gray-600 !overflow-hidden !min-w-[360px]",
    timerProgressBar: "!bg-primary",
  },
  didOpen: (el) => {
    el.onmouseenter = Swal.stopTimer;
    el.onmouseleave = Swal.resumeTimer;
    el.addEventListener("click", (e) => {
      const isLinkClick = (e.target as HTMLElement).closest("[data-quote-link]");
      if (isLinkClick && pendingLinkNavigate) {
        pendingLinkNavigate();
      } else {
        pendingNavigate?.();
      }
      Swal.close();
    });
    el.querySelector<HTMLElement>("[data-toast-close]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      Swal.close();
    });
  },
});

function fireMessageToast(nombre: string, mensaje: string, onNavigate: () => void, onLinkNavigate?: () => void) {
  const initials = getInitials(nombre);
  const color = avatarColor(nombre);
  // background/color van inline (opciones nativas de Swal) en vez de clases de
  // Tailwind porque el CSS propio de sweetalert2 le ganaba a las clases con
  // !important — un estilo inline sí se impone sin pelea de especificidad.
  const isDark = document.documentElement.classList.contains("dark");
  pendingNavigate = onNavigate;
  pendingLinkNavigate = onLinkNavigate ?? null;
  Toast.fire({
    background: isDark ? "#1f2937" : "#eef2ff",
    color: isDark ? "#f3f4f6" : "#1e293b",
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

// Formato propio (no fireMessageToast) para notificaciones de evento con varios
// datos estructurados — a diferencia de un mensaje de chat, acá nada se trunca:
// bandera en proporción horizontal real (no el círculo de iniciales) + 3 líneas.
function fireOcToast(title: string, data: {
  numOrdenCompra?: number | string;
  nomUsuario?: string;
  empresaRepresentante?: string;
  codPaisOrigen?: string;
  fecha?: string;
}, onNavigate: () => void) {
  const isDark = document.documentElement.classList.contains("dark");
  pendingNavigate = onNavigate;
  pendingLinkNavigate = null;
  const flag = data.codPaisOrigen
    ? `<img src="/assets/flags/${String(data.codPaisOrigen).toLowerCase()}.svg" alt="${data.codPaisOrigen}" class="h-7 w-10 rounded object-cover shrink-0 border border-gray-200 dark:border-gray-600 mt-0.5" />`
    : `<div class="h-7 w-10 rounded bg-primary/10 shrink-0"></div>`;
  Toast.fire({
    background: isDark ? "#1f2937" : "#eef2ff",
    color: isDark ? "#f3f4f6" : "#1e293b",
    html: `
      <div class="flex items-start gap-3 text-left">
        ${flag}
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-800 dark:text-white">
            ${title} <span class="text-primary dark:text-blue-400">N° ${data.numOrdenCompra ?? ""}</span>
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">${data.empresaRepresentante ?? ""}</p>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">${data.nomUsuario ?? ""}</p>
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
  const router = useRouter();
  const t = useTranslation();

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

    // El backend registra en inbox (y por lo tanto dispara "nuevaMensaje" genérico)
    // el mismo mensaje que ya viene cubierto por un evento específico (seguimientoAsignado,
    // ordenCompraGenerada/Anulada) — se identifican por compartir codMensaje. Sin esto,
    // el toast genérico ("Nuevo mensaje" con iniciales "NM") termina tapando al específico.
    const specialCodMensajes = new Set<number>();

    const onNuevaMensaje = (data: any) => {
      // Igual que en los eventos de OC: si totalNoLeidos no viene, no pisar el
      // contador con 0 — puede llegar después de un evento específico que ya lo
      // actualizó correctamente (comparten codMensaje).
      if (data?.totalNoLeidos != null) dispatch(setTotalNoLeidos(data.totalNoLeidos));
      if (data?.codMensaje != null && specialCodMensajes.has(data.codMensaje)) {
        specialCodMensajes.delete(data.codMensaje);
        return;
      }
      fireMessageToast(data?.nomUsuario ?? "Nuevo mensaje", data?.desMensaje ?? "", () => {
        router.push("/admin/inbox?status=unread");
      });
    };

    // El backend todavía no dispara estos dos en flujos reales — los listeners
    // quedan listos para cuando responder/archivar emitan al otro usuario.
    const onMensajeVisto = (_data: any) => {};
    const onMensajeArchivado = (_data: any) => {};

    // Payload real de CotizacionBusquedaService.RegistrarSeguimientoAsync vía
    // NotificacionService.EnviarSeguimientoAsignado: { codMensaje, nomUsuarioAsigna,
    // nroCotizacion, codCliente, categoria, nomCliente }. Sigue siendo un evento
    // propio (no "nuevaMensaje") pese a que también registra un mensaje en inbox.
    const onSeguimientoAsignado = (data: any) => {
      if (data?.codMensaje != null) specialCodMensajes.add(data.codMensaje);
      const option = CATEGORY_OPTION[data?.categoria] ?? "quotes";
      const link = `/admin/revision/quotes?customer=${data?.codCliente}&option=${option}&id=${data?.nroCotizacion}`;
      const numeroLink = `<span data-quote-link class="text-primary dark:text-blue-400 underline underline-offset-2 font-semibold cursor-pointer">#${data?.nroCotizacion ?? ""}</span>`;
      const mensaje = (t.quote_assigned_notification ?? "Te asignó la cotización {number}")
        .replace("{number}", numeroLink);
      fireMessageToast(
        data?.nomUsuarioAsigna ?? "Cotización asignada",
        mensaje,
        () => router.push("/admin/inbox?status=unread"), // click general → inbox, igual que los mensajes
        () => router.push(link),                          // click en "#numero" → la cotización
      );
    };

    // Payload de OrdenesCompraService al generar una OC: { numOrdenCompra, codUsuario,
    // nomUsuario, codEmpresa, empresaRepresentante, codPaisOrigen, fecha, codMensaje,
    // totalNoLeidos }. Solo llega a los usuarios de la empresa MIAMI conectados en ese
    // momento (filtrado en backend); acá no hace falta filtrar nada más. totalNoLeidos
    // viene calculado igual que en InboxController.Responder — mismo criterio que
    // onNuevaMensaje para refrescar el contador del header sin pedirlo aparte.
    const onOrdenCompraGenerada = (data: any) => {
      if (data?.codMensaje != null) specialCodMensajes.add(data.codMensaje);
      // Solo pisa el badge si el backend realmente mandó el dato — si todavía no lo
      // envía (undefined/null), mejor dejar el contador actual que resetearlo a 0.
      if (data?.totalNoLeidos != null) dispatch(setTotalNoLeidos(data.totalNoLeidos));
      fireOcToast(
        t.purchase_order_generated_title ?? "Nueva Orden de Compra",
        data,
        () => router.push(`/admin/queries/purchase-orders?oc=${data?.numOrdenCompra ?? ""}`),
      );
    };

    // Mismo payload que ordenCompraGenerada, pero se dispara al anular una OC del
    // flujo RE → MI. También llega solo a los usuarios de MIAMI conectados.
    const onOrdenCompraAnulada = (data: any) => {
      if (data?.codMensaje != null) specialCodMensajes.add(data.codMensaje);
      if (data?.totalNoLeidos != null) dispatch(setTotalNoLeidos(data.totalNoLeidos));
      fireOcToast(
        t.purchase_order_cancelled_title ?? "Orden de Compra Anulada",
        data,
        () => router.push(`/admin/queries/purchase-orders?oc=${data?.numOrdenCompra ?? ""}`),
      );
    };

    conn.on("nuevaMensaje", onNuevaMensaje);
    conn.on("mensajeVisto", onMensajeVisto);
    conn.on("mensajeArchivado", onMensajeArchivado);
    conn.on("seguimientoAsignado", onSeguimientoAsignado);
    conn.on("ordenCompraGenerada", onOrdenCompraGenerada);
    conn.on("ordenCompraAnulada", onOrdenCompraAnulada);

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn.start().catch((err) => console.error("SignalR: error al conectar", err));
    }

    return () => {
      conn.off("nuevaMensaje", onNuevaMensaje);
      conn.off("mensajeVisto", onMensajeVisto);
      conn.off("mensajeArchivado", onMensajeArchivado);
      conn.off("seguimientoAsignado", onSeguimientoAsignado);
      conn.off("ordenCompraGenerada", onOrdenCompraGenerada);
      conn.off("ordenCompraAnulada", onOrdenCompraAnulada);
    };
  }, [token, dispatch, router, t]);

  return null;
}
