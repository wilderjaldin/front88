"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";
import axiosClient from "@/app/lib/axiosClient";
import { useTranslation } from "@/app/locales";
import { selectToken } from "@/store/authSlice";
import { setTotalNoLeidos } from "@/store/notificationsSlice";
import { getHubConnection, setHubToken, stopHubConnection, setOnReconnected } from "@/app/lib/signalr";
import { checkSession, forceLogout } from "@/app/lib/session";

const URL_NO_LEIDOS = "inbox/no-leidos";
const TOAST_DURATION_MS = 8000;

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

// Antes esto usaba Swal.mixin({ toast: true }) — SweetAlert2 solo mantiene UNA
// instancia visible por posición: un segundo .fire() mientras el primero
// seguía abierto lo REEMPLAZABA en vez de apilarlo (el primero desaparecía
// sin que nadie lo viera). Si llegan varios eventos de SignalR casi
// simultáneos (p.ej. "cotizar-items" mandando una notificación por ítem), se
// perdían todos menos el último. La solución no es encolarlos uno detrás de
// otro (eso solo retrasa el mismo problema) sino mostrarlos TODOS a la vez,
// apilados — por eso acá cada notificación es un ítem en un state array,
// renderizado como su propia tarjeta, con su propio timer de auto-cierre.
type ToastItem = {
  id: string;
  kind: "message" | "oc";
  // kind "message"
  avatarInitials?: string;
  avatarColorClass?: string;
  nombre?: string;
  titulo?: string;
  mensajeHtml?: string; // puede traer un <span data-quote-link> adentro
  // kind "oc"
  ocTitle?: string;
  numOrdenCompra?: string;
  empresaRepresentante?: string;
  nomUsuario?: string;
  codPaisOrigen?: string;
  // común
  onNavigate: () => void;
  onLinkNavigate?: () => void;
};

let toastIdSeq = 0;

export default function NotificationsProvider() {
  const token = useSelector(selectToken);
  const dispatch = useDispatch();
  const router = useRouter();
  const t = useTranslation();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Barra de progreso: se anima por CSS (más preciso que recalcular % a mano
  // en cada render) — pausedIds solo controla animation-play-state, y al
  // pausar/reanudar la propia animación CSS congela y retoma el ancho actual
  // sola, en sincronía exacta con el timer real de abajo (ambos miden el
  // mismo reloj: Date.now()).
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  // Por toast: tiempo restante + cuándo arrancó el timer actual (para poder
  // pausar en hover y reanudar con el tiempo que quedaba, no desde cero).
  const timersRef = useRef<Record<string, { remaining: number; startedAt: number; timeoutId: ReturnType<typeof setTimeout> | null }>>({});

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    const timer = timersRef.current[id];
    if (timer?.timeoutId) clearTimeout(timer.timeoutId);
    delete timersRef.current[id];
  };

  const pauseToast = (id: string) => {
    const timer = timersRef.current[id];
    if (!timer?.timeoutId) return;
    clearTimeout(timer.timeoutId);
    timer.timeoutId = null;
    timer.remaining -= Date.now() - timer.startedAt;
    setPausedIds((prev) => new Set(prev).add(id));
  };

  const resumeToast = (id: string) => {
    const timer = timersRef.current[id];
    if (!timer || timer.timeoutId) return;
    timer.startedAt = Date.now();
    timer.timeoutId = setTimeout(() => removeToast(id), Math.max(timer.remaining, 300));
    setPausedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const addToast = (item: Omit<ToastItem, "id">) => {
    const id = `t${++toastIdSeq}`;
    setToasts((prev) => [...prev, { ...item, id }]);
    timersRef.current[id] = {
      remaining: TOAST_DURATION_MS,
      startedAt: Date.now(),
      timeoutId: setTimeout(() => removeToast(id), TOAST_DURATION_MS),
    };
  };

  const handleCardClick = (item: ToastItem, e: React.MouseEvent) => {
    const isLinkClick = (e.target as HTMLElement).closest("[data-quote-link]");
    if (isLinkClick && item.onLinkNavigate) item.onLinkNavigate();
    else item.onNavigate();
    removeToast(item.id);
  };

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
      const nombre = data?.nomUsuario ?? "Nuevo mensaje";
      addToast({
        kind: "message",
        avatarInitials: getInitials(nombre),
        avatarColorClass: avatarColor(nombre),
        nombre,
        titulo: data?.titulo,
        mensajeHtml: data?.desMensaje ?? "",
        onNavigate: () => router.push("/admin/inbox?status=unread"),
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
      const nombre = data?.nomUsuarioAsigna ?? "Cotización asignada";
      addToast({
        kind: "message",
        avatarInitials: getInitials(nombre),
        avatarColorClass: avatarColor(nombre),
        nombre,
        mensajeHtml: mensaje,
        onNavigate: () => router.push("/admin/inbox?status=unread"), // click general → inbox, igual que los mensajes
        onLinkNavigate: () => router.push(link),                      // click en "#numero" → la cotización
      });
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
      addToast({
        kind: "oc",
        ocTitle: t.purchase_order_generated_title ?? "Nueva Orden de Compra",
        numOrdenCompra: String(data?.numOrdenCompra ?? ""),
        empresaRepresentante: data?.empresaRepresentante ?? "",
        nomUsuario: data?.nomUsuario ?? "",
        codPaisOrigen: data?.codPaisOrigen,
        onNavigate: () => router.push(`/admin/queries/purchase-orders?oc=${data?.numOrdenCompra ?? ""}`),
      });
    };

    // Mismo payload que ordenCompraGenerada, pero se dispara al anular una OC del
    // flujo RE → MI. También llega solo a los usuarios de MIAMI conectados.
    const onOrdenCompraAnulada = (data: any) => {
      if (data?.codMensaje != null) specialCodMensajes.add(data.codMensaje);
      if (data?.totalNoLeidos != null) dispatch(setTotalNoLeidos(data.totalNoLeidos));
      addToast({
        kind: "oc",
        ocTitle: t.purchase_order_cancelled_title ?? "Orden de Compra Anulada",
        numOrdenCompra: String(data?.numOrdenCompra ?? ""),
        empresaRepresentante: data?.empresaRepresentante ?? "",
        nomUsuario: data?.nomUsuario ?? "",
        codPaisOrigen: data?.codPaisOrigen,
        onNavigate: () => router.push(`/admin/queries/purchase-orders?oc=${data?.numOrdenCompra ?? ""}`),
      });
    };

    // Corte directo de sesión (revocada por un admin) — sin session-check, no hay
    // nada que refrescar. El aviso es un modal central bloqueante (swalError), no
    // un toast de esquina: corta el acceso, así que debe confirmarse, no perderse.
    const onSesionRevocada = () => { forceLogout(router, t); };

    // Cambio de permisos en vivo: refresca token/permisos y avisa (modal central
    // informativo), sin desloguear si la sesión sigue activa.
    const onPermisosActualizados = () => { checkSession(router, t); };

    conn.on("nuevaMensaje", onNuevaMensaje);
    conn.on("mensajeVisto", onMensajeVisto);
    conn.on("mensajeArchivado", onMensajeArchivado);
    conn.on("seguimientoAsignado", onSeguimientoAsignado);
    conn.on("ordenCompraGenerada", onOrdenCompraGenerada);
    conn.on("ordenCompraAnulada", onOrdenCompraAnulada);
    conn.on("sesionRevocada", onSesionRevocada);
    conn.on("permisosActualizados", onPermisosActualizados);

    // Red de seguridad: si la conexión se cae justo cuando cambian los permisos/
    // sesión, al reconectar se vuelve a chequear (ver comentario en signalr.ts —
    // este callback se reasigna en cada efecto, pero el registro real en el SDK
    // ocurre una sola vez, al crear la conexión).
    setOnReconnected(() => { checkSession(router, t); });

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
      conn.off("sesionRevocada", onSesionRevocada);
      conn.off("permisosActualizados", onPermisosActualizados);
    };
  }, [token, dispatch, router, t]);

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2 w-[360px] pointer-events-none">
      <style>{`
        @keyframes toast-progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
      {toasts.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => pauseToast(item.id)}
          onMouseLeave={() => resumeToast(item.id)}
          onClick={(e) => handleCardClick(item, e)}
          className="pointer-events-auto relative w-full overflow-hidden border border-gray-300 dark:border-gray-600 shadow-[0_4px_24px_rgba(0,0,0,0.18)] bg-[#eef2ff] dark:bg-gray-800 text-[#1e293b] dark:text-gray-100 p-3 cursor-pointer"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={(e) => { e.stopPropagation(); removeToast(item.id); }}
            className="absolute top-2 right-2 flex items-center justify-center h-6 w-6 text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.25" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          {item.kind === "message" ? (
            <div className="flex items-start gap-2.5 text-left pr-6">
              <div className={`${item.avatarColorClass} h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {item.avatarInitials}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold truncate">{item.nombre}</p>
                {item.titulo && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-snug mt-0.5 truncate">{item.titulo}</p>}
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5"
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  dangerouslySetInnerHTML={{ __html: item.mensajeHtml ?? "" }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-left pr-6">
              {item.codPaisOrigen ? (
                <img src={`/assets/flags/${String(item.codPaisOrigen).toLowerCase()}.svg`} alt={item.codPaisOrigen} className="h-7 w-10 rounded object-cover shrink-0 border border-gray-200 dark:border-gray-600 mt-0.5" />
              ) : (
                <div className="h-7 w-10 rounded bg-primary/10 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {item.ocTitle} <span className="text-primary dark:text-blue-400">N° {item.numOrdenCompra}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">{item.empresaRepresentante}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{item.nomUsuario}</p>
              </div>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 h-0.5 bg-primary"
            style={{
              animation: `toast-progress ${TOAST_DURATION_MS}ms linear forwards`,
              animationPlayState: pausedIds.has(item.id) ? "paused" : "running",
            }}
          />
        </div>
      ))}
    </div>
  );
}
