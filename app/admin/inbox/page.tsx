"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import Select from "react-select";
import { Pagination } from "@mantine/core";
import axios from "axios";
import axiosClient from "@/app/lib/axiosClient";
import { swalSuccess, swalError, swalConfirm } from "@/app/lib/swal";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, selectToken } from "@/store/authSlice";
import { selectTotalNoLeidos, setTotalNoLeidos, decrementTotalNoLeidos } from "@/store/notificationsSlice";
import { getHubConnection } from "@/app/lib/signalr";
import { customFormat } from "@/app/lib/format";
import Modal from "@/components/modal";
import IconSearch from "@/components/icon/icon-search";
import IconMailDot from "@/components/icon/icon-mail-dot";
import IconSend from "@/components/icon/icon-send";
import IconArchive from "@/components/icon/icon-archive";
import IconPlus from "@/components/icon/icon-plus";
import IconXCircle from "@/components/icon/icon-x-circle";
import IconX from "@/components/icon/icon-x";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_LISTAR        = "inbox/listar";
const URL_DETALLE       = "inbox/detalle";
const URL_USUARIOS      = "usuarios/mensaje";
const URL_MARCAR_VISTO  = "seguimiento/marcar-visto";
const URL_ARCHIVAR      = "inbox/archivar";
const URL_RESPONDER     = "inbox/responder";
const url_iniciar_msg   = process.env.NEXT_PUBLIC_API_URL + "inbox/IniciarMsg";

const STATUS_TABS = [
  { value: "unread",   label: "No leídos" },
  { value: "read",     label: "Leídos" },
  { value: "archived", label: "Archivados" },
];

function getInitials(name: string = ""): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-primary", "bg-secondary", "bg-info", "bg-success",
  "bg-warning", "bg-danger", "bg-violet-500", "bg-pink-500",
];
function avatarColor(name: string = ""): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Inbox() {
  const currentUser = useSelector(selectUser);
  const token       = useSelector(selectToken);
  const t           = useTranslation();
  useDynamicTitle(t.inbox);

  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const dispatch     = useDispatch();
  const totalUnread  = useSelector(selectTotalNoLeidos);

  // URL como fuente de verdad — permite compartir/recargar en una página o mensaje específico
  const urlPage        = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const urlQuote       = parseInt(searchParams.get("quote") || "0", 10);
  const urlUser        = parseInt(searchParams.get("user") || "0", 10);
  const urlMessageParam = searchParams.get("message");
  const urlMessage      = urlMessageParam ? parseInt(urlMessageParam, 10) : null;
  const urlStatus       = searchParams.get("status") || "all"; // all | unread | read | archived

  const pushParams = (updates: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || v === 0) params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { register: regSearch, handleSubmit: submitSearch, setValue: setValSearch, reset: resetSearch, watch: watchSearch } = useForm();
  const { register: regNew, handleSubmit: submitNew, setValue: setValNew, reset: resetNew, formState: { errors: errorsNew, isSubmitting: isSubmittingNew } } = useForm();

  const [mailList,      setMailList]      = useState<any[]>([]);
  const [total,         setTotal]         = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [selectedMail,  setSelectedMail]  = useState<any>(null);
  const [details,       setDetails]       = useState<any[]>([]);
  const [users,         setUsers]         = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Refleja la selección en curso del formulario (no la URL), para que el Select
  // se actualice al instante al elegir una opción, antes de apretar "Buscar"
  const watchedUser = watchSearch("user");
  const selectedUserOption = watchedUser ? (users.find((u: any) => u.value === watchedUser) ?? null) : null;

  // Sincroniza los campos del formulario con la URL (carga inicial, F5, back/forward)
  useEffect(() => {
    resetSearch({ nro_quote: urlQuote || "" });
    setValSearch("user", urlUser || 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuote, urlUser]);

  const [respuesta, setRespuesta] = useState("");
  const [closing,   setClosing]   = useState(false);
  const [sending,   setSending]   = useState(false);

  const [showNewMsgModal, setShowNewMsgModal] = useState(false);

  const hasActiveFilters = urlQuote !== 0 || urlUser !== 0;

  const [stickyTop, setStickyTop] = useState(0);

  const threadRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [details]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [glider, setGlider] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const measureGlider = () => {
      const index = STATUS_TABS.findIndex(tab => tab.value === urlStatus);
      const el = index >= 0 ? tabRefs.current[index] : null;
      setGlider(el ? { left: el.offsetLeft, width: el.offsetWidth } : { left: 0, width: 0 });
    };
    // Al montar (ej. F5 directo a una URL con ?status=), el layout puede no estar
    // asentado todavía (fuente web cargando, hidratación) — remedir tras el próximo
    // frame y cuando la fuente termine de cargar evita que el glider quede mal calculado.
    measureGlider();
    const raf = requestAnimationFrame(measureGlider);
    window.addEventListener("resize", measureGlider);
    document.fonts?.ready?.then(measureGlider);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureGlider);
    };
  // totalUnread también dispara re-medición: el badge de "No leídos" solo se
  // renderiza cuando totalUnread > 0, lo que cambia el ancho de ese tab después
  // de que responda el fetch (llega más tarde que el raf/fonts.ready de arriba).
  }, [urlStatus, totalUnread]);

  useEffect(() => {
    fetchList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPage, urlQuote, urlUser, urlStatus]);

  useEffect(() => {
    getListUsers();
  }, []);

  useEffect(() => {
    if (!urlMessage) { setSelectedMail(null); setDetails([]); return; }
    loadDetail(urlMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMessage]);

  // Tiempo real: cuando el otro usuario responde, el hub emite "nuevaMensaje".
  // Si el hilo abierto es ese mismo mensaje, se agrega al chat en vivo (details
  // va en orden DESC, igual que la API); si no, solo se refresca la fila de la lista.
  useEffect(() => {
    const conn = getHubConnection();
    const onNuevaMensaje = (data: any) => {
      setMailList(prev => prev.map(m => m.codMensaje === data.codMensaje
        ? { ...m, desMensaje: data.desMensaje, fecha: data.fecha, visto: false }
        : m
      ));
      if (urlMessage === data.codMensaje) {
        setDetails(prev => [
          { correo: data.correo, nomUsuario: data.nomUsuario, fecha: data.fecha, desMensaje: data.desMensaje },
          ...prev,
        ]);
      }
    };
    conn.on("nuevaMensaje", onNuevaMensaje);
    return () => conn.off("nuevaMensaje", onNuevaMensaje);
  }, [urlMessage]);

  // El header global es sticky/fixed en top:0 — el panel de detalle debe engancharse justo debajo, a ras de su borde inferior
  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.getElementById("site-header");
      setStickyTop(header?.getBoundingClientRect().height ?? 0);
    };
    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);
    return () => window.removeEventListener("resize", updateStickyTop);
  }, []);

  const fetchList = async () => {
    try {
      const params: Record<string, number | string> = { page: urlPage };
      if (urlQuote) params.nroCotizacion = urlQuote;
      if (urlUser)  params.codUsuario    = urlUser;
      if (urlStatus !== "all") params.status = urlStatus;
      const rs = await axiosClient.get(URL_LISTAR, { params });
      setMailList(rs.data?.datos ?? []);
      setTotal(rs.data?.total ?? 0);
      dispatch(setTotalNoLeidos(rs.data?.totalNoLeidos ?? 0));
      setTotalPages(rs.data?.totalPaginas ?? 1);
    } catch {}
  };

  const getListUsers = async () => {
    try {
      const rs = await axiosClient.get(URL_USUARIOS);
      setUsers((rs.data ?? []).map((u: any) => ({ value: u.codUsuario, label: u.nomUsuario })));
    } catch {}
  };

  const markAsRead = async (codMensaje: number) => {
    try {
      await axiosClient.post(URL_MARCAR_VISTO, { codMensaje });
      let wasUnread = false;
      setMailList(prev => prev.map(m => {
        if (m.codMensaje !== codMensaje) return m;
        wasUnread = m.visto === false;
        return { ...m, visto: true };
      }));
      if (wasUnread) dispatch(decrementTotalNoLeidos());
    } catch {}
  };

  const loadDetail = async (codMensaje: number) => {
    setRespuesta("");
    setLoadingDetail(true);
    try {
      const item = mailList.find((m: any) => m.codMensaje === codMensaje);
      if (item && !item.visto) await markAsRead(codMensaje);
      const rs = await axiosClient.get(`${URL_DETALLE}/${codMensaje}`);
      setSelectedMail(rs.data?.encabezado ?? null);
      setDetails(rs.data?.detalle ?? []);
    } catch {} finally { setLoadingDetail(false); }
  };

  const onSearch = async (data: any) => {
    pushParams({ quote: data.nro_quote || 0, user: data.user || 0, page: 1 });
  };

  const clearFilters = () => {
    pushParams({ quote: 0, user: 0, page: 1 });
  };

  const openNewMsgModal = () => { resetNew({ user: null, nro_order: "", message: "" }); setShowNewMsgModal(true); };

  const onNewMessage = async (data: any) => {
    try {
      const rs = await axios.post(url_iniciar_msg, {
        CodUsuarioDestino: data.user,
        NroOrden:          data.nro_order || 0,
        Mensaje:           data.message,
        ValToken:          token,
      });
      if (rs.data.estado === "OK") {
        setShowNewMsgModal(false);
        swalSuccess("Mensaje enviado");
        await fetchList();
      } else {
        swalError(t.error ?? "Error", "No se pudo enviar el mensaje.");
      }
    } catch (error: any) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? "Error", apiMsg ?? "No se pudo enviar el mensaje.");
    }
  };

  const handleCerrar = async () => {
    setClosing(true);
    try {
      const rs = await axiosClient.post(URL_ARCHIVAR, {
        codMensaje:    selectedMail.codMensaje,
        page:          urlPage,
        status:        urlStatus === "all" ? "" : urlStatus,
        nroCotizacion: urlQuote,
        codUsuario:    urlUser,
      });
      setMailList(rs.data?.datos ?? []);
      setTotal(rs.data?.total ?? 0);
      dispatch(setTotalNoLeidos(rs.data?.totalNoLeidos ?? 0));
      setTotalPages(rs.data?.totalPaginas ?? 1);
      setRespuesta("");
      setSelectedMail(null);
      setDetails([]);
      pushParams({ message: null });
      swalSuccess("Mensaje archivado");
    } catch (error: any) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? "Error", apiMsg ?? "No se pudo archivar el mensaje.");
    } finally {
      setClosing(false);
    }
  };

  const handleCloseConfirm = async () => {
    const res = await swalConfirm("¿Archivar este mensaje?", "El seguimiento se marcará como cerrado.", {
      confirmText: "Archivar", cancelText: "Cancelar", confirmColor: "#dc2626",
    });
    if (!res.isConfirmed) return;
    await handleCerrar();
  };

  const handleReply = async () => {
    if (!respuesta.trim()) {
      swalError(t.error ?? "Error", "Escribe un mensaje antes de enviar.");
      return;
    }
    setSending(true);
    try {
      const rs = await axiosClient.post(URL_RESPONDER, {
        codMensaje: selectedMail.codMensaje,
        desMensaje: respuesta.trim(),
      });
      setDetails(rs.data?.detalle ?? []);
      setRespuesta("");
    } catch (error: any) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? "Error", apiMsg ?? "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1.5 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] before:mx-2 font-semibold text-gray-700 dark:text-gray-200">
          {t.inbox}
        </li>
      </ul>

      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* ── LEFT: CONVERSATION LIST ─────────────────────────────────────── */}
        <div className="w-full lg:w-2/5 shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900">

          {/* Tabs de estado + Nuevo */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <div className="relative flex gap-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 rounded-lg bg-slate-700 shadow-sm transition-all duration-200 ease-out"
                style={{ left: glider.left, width: glider.width }}
              />
              {STATUS_TABS.map((tab, index) => (
                <button
                  key={tab.value}
                  type="button"
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => pushParams({ status: urlStatus === tab.value ? null : tab.value, page: 1 })}
                  className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                    ${urlStatus === tab.value ? "text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                >
                  {tab.label}
                  {tab.value === "unread" && totalUnread > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-primary text-white">
                      {totalUnread}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openNewMsgModal}
              title="Nuevo mensaje"
              className="shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary/90 transition-all"
            >
              <IconPlus className="h-3.5 w-3.5" />
              Nuevo
            </button>
          </div>

          {/* Search */}
          <form onSubmit={submitSearch(onSearch)} className="flex flex-wrap items-center gap-2 px-3 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <input
              type="number"
              {...regSearch("nro_quote")}
              placeholder={t.nro_quote}
              className="form-input text-xs py-1 px-2 h-[30px] flex-1 min-w-0"
            />
            <div className="flex-1 min-w-0">
              <Select
                isClearable
                placeholder="Usuario..."
                options={users}
                value={selectedUserOption}
                onChange={(opt: any) => setValSearch("user", opt?.value ?? 0)}
                classNamePrefix="react-select"
                instanceId="inbox-user-select"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={{
                  control: (b) => ({ ...b, minHeight: "30px", height: "30px", fontSize: "12px" }),
                  valueContainer: (b) => ({ ...b, padding: "0 8px", height: "30px" }),
                  input: (b) => ({ ...b, margin: 0, padding: 0 }),
                  indicatorsContainer: (b) => ({ ...b, height: "30px" }),
                }}
              />
            </div>
            <button
              type="submit"
              className="h-[30px] px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <IconSearch className="w-3 h-3" />
              Buscar
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-[30px] px-3 text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <IconXCircle className="w-3 h-3" />
                Limpiar
              </button>
            )}

            <div className="w-full flex items-center justify-end gap-3 mt-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {total} {total === 1 ? "mensaje" : "mensajes"}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => pushParams({ page: urlPage - 1 })}
                    disabled={urlPage <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[48px] text-center">
                    {urlPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => pushParams({ page: urlPage + 1 })}
                    disabled={urlPage >= totalPages}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Message list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {mailList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                <IconMailDot className="h-8 w-8 opacity-30" />
                <span className="text-sm">Sin mensajes</span>
              </div>
            ) : (
              mailList.map((mail: any) => {
                const isSelected = selectedMail?.codMensaje === mail.codMensaje;
                const isUnread   = mail.visto === false;
                const initials   = getInitials(mail.destino);
                const color      = avatarColor(mail.destino);
                return (
                  <div
                    key={mail.codMensaje}
                    onClick={() => pushParams({ message: mail.codMensaje })}
                    className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                      ${isSelected
                        ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-primary"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent"
                      }`}
                  >
                    {/* Avatar */}
                    <div className={`${color} h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {mail.notificacion}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {mail.fecha && <span className="text-[10px] text-gray-400 whitespace-nowrap">{mail.fecha}</span>}
                          {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      {mail.destino && (
                        <span
                          title={mail.correo || undefined}
                          className="inline-flex items-center mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-full"
                        >
                          {mail.destino}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {mail.desMensaje}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {total} {total === 1 ? "mensaje" : "mensajes"} · página {urlPage} de {totalPages}
              </span>
              <Pagination
                total={totalPages}
                value={urlPage}
                onChange={(p) => pushParams({ page: p })}
                size="sm"
                withEdges
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: CONVERSATION DETAIL ──────────────────────────────────── */}
        {/* tarjeta independiente (no comparte borde con la lista) + sticky, enganchada justo debajo del header global (altura real medida por JS) */}
        <div className="flex-1 min-w-0 w-full flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 overflow-hidden sticky" style={{ top: stickyTop }}>
          {!selectedMail ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-gray-300 dark:text-gray-600">
              <IconMailDot className="h-14 w-14" />
              <p className="text-sm font-medium">Selecciona un mensaje para leer</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Order info header */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t.customer}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedMail.cliente}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pushParams({ message: null })}
                    title="Cerrar detalle"
                    className="shrink-0 p-1.5 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                  <MetaItem label={t.quote}  value={selectedMail.nroCotizacion} />
                  <MetaItem label="Total"    value={selectedMail.total != null ? `US$ ${customFormat(selectedMail.total)}` : null} />
                  <MetaItem label="Creado"     value={selectedMail.fecRegistra} />
                  <MetaItem label="Modificado" value={selectedMail.fecModifica} />
                </div>
              </div>

              {/* Thread */}
              <div ref={threadRef} className="max-h-[480px] overflow-y-auto px-5 py-4 space-y-3 bg-gray-100/70 dark:bg-gray-900/50">
                {details.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-6">Sin mensajes en la conversación</p>
                ) : (
                  // El backend devuelve detalle en orden DESC (más reciente primero); se invierte para leer el chat cronológicamente
                  [...details].reverse().map((msg: any, i: number) => {
                    const isMe     = !!currentUser?.name && String(msg.nomUsuario).toLowerCase() === String(currentUser.name).toLowerCase();
                    const initials = getInitials(msg.nomUsuario);
                    const color    = avatarColor(msg.nomUsuario);
                    return (
                      <div key={i} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                        <div className={`${color} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`} title={msg.correo || undefined}>
                          {initials}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            {!isMe && <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{msg.nomUsuario}</span>}
                            {msg.fecha && <span className="text-[10px] text-gray-400">{msg.fecha}</span>}
                          </div>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700 shadow-sm"
                          }`}>
                            {msg.desMensaje}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Responder / cerrar seguimiento */}
              {selectedMail.abierto === false ? (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-5 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <IconArchive className="h-4 w-4 shrink-0" />
                  Este mensaje está archivado — no se puede responder.
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 space-y-2">
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    rows={2}
                    placeholder="Escribe una respuesta..."
                    className="form-input w-full resize-none text-sm"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={closing}
                      onClick={handleCloseConfirm}
                      title="Archivar"
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-danger transition disabled:opacity-50"
                    >
                      {closing ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      ) : (
                        <IconArchive className="h-3.5 w-3.5" />
                      )}
                      Archivar
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={handleReply}
                      className="btn btn-primary inline-flex items-center gap-2 h-9 px-4 disabled:opacity-50"
                    >
                      {sending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <IconSend className="h-4 w-4" />
                      )}
                      Responder
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal nuevo mensaje */}
      <Modal showModal={showNewMsgModal} closeModal={() => setShowNewMsgModal(false)} openModal={openNewMsgModal} title="Nuevo mensaje" size="w-full max-w-md">
        <form onSubmit={submitNew(onNewMessage)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.to_user}</label>
            <Select
              isClearable
              placeholder={t.select_option}
              options={users}
              onChange={(opt: any) => setValNew("user", opt?.value ?? null)}
              classNamePrefix="react-select"
              instanceId="new-message-user-select"
            />
            {errorsNew.user && <span className="text-red-400 text-xs mt-1 block">{errorsNew.user?.message?.toString()}</span>}
            <input type="hidden" {...regNew("user", { required: { value: true, message: t.required_select } })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.nro_quote}</label>
            <input
              type="number"
              autoComplete="off"
              {...regNew("nro_order")}
              placeholder={t.nro_order}
              className="form-input w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.message ?? "Mensaje"}</label>
            <textarea
              {...regNew("message", { required: { value: true, message: t.required_field } })}
              rows={4}
              className="form-input w-full resize-none text-sm"
            />
            {errorsNew.message && <span className="text-red-400 text-xs mt-1 block">{errorsNew.message?.message?.toString()}</span>}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewMsgModal(false)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
            >
              {t.btn_cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmittingNew}
              className="btn btn-primary inline-flex items-center gap-2 h-9 disabled:opacity-50"
            >
              {isSubmittingNew ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <IconSend className="h-4 w-4" />
              )}
              {t.accept}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: any }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{isEmpty ? "—" : value}</p>
    </div>
  );
}
