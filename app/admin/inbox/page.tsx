"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { selectToken } from "@/store/authSlice";
import IconCaretDown from "@/components/icon/icon-caret-down";
import IconCheck from "@/components/icon/icon-check";
import IconSearch from "@/components/icon/icon-search";
import IconMailDot from "@/components/icon/icon-mail-dot";
import IconX from "@/components/icon/icon-x";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_list_mails  = process.env.NEXT_PUBLIC_API_URL + "inbox/MostrarMsgPendientes";
const url_detail_mail = process.env.NEXT_PUBLIC_API_URL + "inbox/MostrarDetMsg";
const url_save        = process.env.NEXT_PUBLIC_API_URL + "inbox/GuardarMsg";
const url_close       = process.env.NEXT_PUBLIC_API_URL + "inbox/CerrarMsg";
const url_list_users  = process.env.NEXT_PUBLIC_API_URL + "inbox/MostrarListaUsuarios";

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
  const token = useSelector(selectToken);
  const t     = useTranslation();
  useDynamicTitle(t.inbox);

  const [pager] = useState<any>({
    currentPage: 1, totalPages: 0, pageSize: 10,
    startIndex: 0, endIndex: 0,
  });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  const { register: regSearch, handleSubmit: submitSearch, setValue: setValSearch } = useForm();

  const [mailList,         setMailList]         = useState<any[]>([]);
  const [filteredMailList, setFilteredMailList] = useState<any[]>([]);
  const [pagedMails,       setPagedMails]       = useState<any[]>([]);
  const [selectedMail,     setSelectedMail]     = useState<any>(null);
  const [details,          setDetails]          = useState<any[]>([]);
  const [users,            setUsers]            = useState<any[]>([]);
  const [loadingDetail,    setLoadingDetail]    = useState(false);

  useEffect(() => {
    getList();
    getListUsers();
  }, []);

  useEffect(() => { paginate(mailList); }, [mailList]);

  const getList = async (CodNroOrden = 0, CodUsuario = 0) => {
    try {
      const rs = await axios.post(url_list_mails, { CodNroOrden, CodUsuario, ValToken: token });
      if (rs.data.estado === "OK") {
        setMailList(rs.data.dato);
        setFilteredMailList(rs.data.dato);
      }
    } catch {}
  };

  const getListUsers = async () => {
    try {
      const rs = await axios.post(url_list_users, { ValToken: token });
      if (rs.data.estado === "OK") {
        setUsers(
          rs.data.dato
            .filter((u: any) => u.CodUsuario !== 0)
            .map((u: any) => ({ value: u.CodUsuario, label: u.NomUsuario }))
        );
      }
    } catch {}
  };

  const paginate = (list: any[], resetPage = true) => {
    if (resetPage) pager.currentPage = 1;
    if (!list.length) {
      setPagedMails([]);
      pager.startIndex = -1; pager.endIndex = -1;
      return;
    }
    pager.totalPages  = Math.ceil(list.length / pager.pageSize);
    if (pager.currentPage > pager.totalPages) pager.currentPage = 1;
    pager.startIndex  = (pager.currentPage - 1) * pager.pageSize;
    pager.endIndex    = Math.min(pager.startIndex + pager.pageSize - 1, list.length - 1);
    setPagedMails([...list.slice(pager.startIndex, pager.endIndex + 1)]);
  };

  const selectMail = async (item: any) => {
    if (!item) { setSelectedMail(null); return; }
    setLoadingDetail(true);
    try {
      const rs = await axios.post(url_detail_mail, { CodMensaje: item.CodMensaje, ValToken: token });
      if (rs.data.estado === "OK") {
        setSelectedMail(rs.data.dato1[0]);
        setDetails(rs.data.dato2);
      }
    } catch {} finally { setLoadingDetail(false); }
  };

  const onSearch = async (data: any) => {
    await getList(data.nro_quote || 0, data.user || 0);
  };

  const onSubmit = async (data: any) => {
    try {
      const rs = await axios.post(url_save, {
        CodMensaje: selectedMail.CodMensaje,
        DesMensaje: data.message,
        ValToken:   token,
      });
      if (rs.data.estado === "OK") {
        setDetails(rs.data.dato);
        setValue("message", "");
      }
    } catch {}
  };

  const handleCloseMessage = async (mail: any) => {
    try {
      const rs = await axios.post(url_close, { CodMensaje: mail.CodMensaje, ValToken: token });
      if (rs.data.estado === "OK") {
        const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 1500, timerProgressBar: true });
        Toast.fire({ icon: "success", title: t.message_read });
        setMailList(rs.data.dato);
      }
    } catch {}
  };

  const unreadCount = mailList.filter((m: any) => m.Visto === 0).length;

  return (
    <div className="space-y-4">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1.5 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] before:mx-2 font-semibold text-gray-700 dark:text-gray-200">
          {t.inbox}
        </li>
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden bg-white dark:bg-gray-900" style={{ minHeight: '600px' }}>

        {/* ── LEFT: CONVERSATION LIST ─────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col border-r border-gray-200 dark:border-gray-700">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex items-center gap-2">
              <IconMailDot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-gray-800 dark:text-white text-sm">{t.inbox}</span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {filteredMailList.length} {filteredMailList.length === 1 ? "mensaje" : "mensajes"}
            </span>
          </div>

          {/* Search */}
          <form onSubmit={submitSearch(onSearch)} className="flex flex-col gap-2 px-3 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <input
              type="number"
              {...regSearch("nro_quote")}
              placeholder={t.nro_quote}
              className="form-input text-sm h-8 py-1"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  isClearable
                  placeholder="Usuario..."
                  options={users}
                  onChange={(opt: any) => setValSearch("user", opt?.value ?? 0)}
                  classNamePrefix="react-select"
                  instanceId="inbox-user-select"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm px-3 h-[38px]">
                <IconSearch className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
            {pagedMails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                <IconMailDot className="h-8 w-8 opacity-30" />
                <span className="text-sm">Sin mensajes</span>
              </div>
            ) : (
              pagedMails.map((mail: any) => {
                const isSelected = selectedMail?.CodMensaje === mail.CodMensaje;
                const isUnread   = mail.Visto === 0;
                const initials   = getInitials(mail.IniciadoPor);
                const color      = avatarColor(mail.IniciadoPor);
                return (
                  <div
                    key={mail.CodMensaje}
                    onClick={() => selectMail(mail)}
                    className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                      ${isSelected
                        ? "bg-primary/8 dark:bg-primary/15 border-l-2 border-primary"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent"
                      }`}
                  >
                    {/* Avatar */}
                    <div className={`${color} h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {mail.IniciadoPor}
                        </span>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {mail.DesMensaje}
                      </p>
                      {mail.Destino && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 truncate max-w-full">
                          → {mail.Destino}
                        </span>
                      )}
                    </div>

                    {/* Mark-as-read on hover */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCloseMessage(mail); }}
                      title="Marcar como leído"
                      className="invisible group-hover:visible shrink-0 p-1 rounded-md hover:bg-success/10 text-success transition"
                    >
                      <IconCheck className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredMailList.length > pager.pageSize && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
              <span className="text-xs text-gray-400">
                {pager.startIndex + 1}–{pager.endIndex + 1} {t.of} {filteredMailList.length}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={pager.currentPage === 1}
                  onClick={() => { pager.currentPage--; paginate(mailList, false); }}
                  className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconCaretDown className="h-4 w-4 rotate-90" />
                </button>
                <button
                  type="button"
                  disabled={pager.currentPage === pager.totalPages}
                  onClick={() => { pager.currentPage++; paginate(mailList, false); }}
                  className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconCaretDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: CONVERSATION DETAIL ──────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col">
          {!selectedMail ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-gray-300 dark:text-gray-600">
              <IconMailDot className="h-14 w-14" />
              <p className="text-sm font-medium">Selecciona un mensaje para leer</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Order info header */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t.customer}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedMail.NomCliente}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMail(null)}
                    className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                  <MetaItem label={t.quote}  value={selectedMail.NroOrden}  />
                  <MetaItem label="Total"    value={selectedMail.Total}     />
                  <MetaItem label={t.date}   value={selectedMail.FechaCot}  />
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: '380px' }}>
                {details.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-6">Sin mensajes en la conversación</p>
                ) : (
                  details.map((msg: any, i: number) => {
                    const initials = getInitials(msg.NomUsuario);
                    const color    = avatarColor(msg.NomUsuario);
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`${color} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{msg.NomUsuario}</p>
                          <div className="rounded-2xl rounded-tl-none bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                            {msg.DesMensaje}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply input */}
              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <textarea
                        {...register("message", { required: { value: true, message: t.required_field } })}
                        rows={2}
                        placeholder="Escribe un mensaje..."
                        className="form-input w-full resize-none text-sm"
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500">{errors.message?.message?.toString()}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary shrink-0 h-[58px] px-4 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : t.accept}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{value ?? "—"}</p>
    </div>
  );
}
