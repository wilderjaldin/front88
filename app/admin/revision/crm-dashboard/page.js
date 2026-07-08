"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError, swalSuccess } from '@/app/lib/swal';
import Select from 'react-select';
import { Pagination } from '@mantine/core';
import { customFormat } from '@/app/lib/format';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Link from "next/link";
import Modal from '@/components/modal';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const URL_LISTAR = 'seguimiento/listar';
const URL_CONTROLES = 'seguimiento/controles';
const URL_GUARDAR_CAMBIOS = 'seguimiento/guardar-cambios';
const URL_CERRAR = 'seguimiento/cerrar';
const URL_SAVE_NOTE = 'seguimiento/guardar-anotacion';
const URL_CLOSE_MSG = 'seguimiento/marcar-visto';
const URL_MARK_CLOSE = 'seguimiento/marcar-cerrar';

const CATEGORY_OPTION = { NR: 'quotes', SC: 'quotes-without-code', MA: 'manual' };

const CAT_META = {
  NR: { label: 'Normal', dot: 'bg-sky-500', cls: 'bg-sky-50    text-sky-700    border border-sky-200    dark:bg-sky-900/30   dark:text-sky-400   dark:border-sky-800' },
  SC: { label: 'Sin Código', dot: 'bg-amber-500', cls: 'bg-amber-50  text-amber-700  border border-amber-200  dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  MA: { label: 'Manual', dot: 'bg-violet-500', cls: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' },
};
const CatBadge = ({ cat }) => {
  const m = CAT_META[cat] ?? { label: cat, dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const thClass =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 " +
  "bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

// ── Iconos inline ──
const SpinIcon = ({ cls = "w-3.5 h-3.5" }) => (
  <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
const SaveIcon = ({ cls = "w-3 h-3" }) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const CloseIcon = ({ cls = "w-3 h-3" }) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// ── Sort ──
const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z" /><path d="M3.5 11L0 6.5H7L3.5 11Z" />
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc' ? <path d="M3.5 0L7 7H0L3.5 0Z" /> : <path d="M3.5 7L0 0H7L3.5 7Z" />}
    </svg>
  );
};

const SortableTh = ({ col, label, sort, desc, onSort, className = '' }) => (
  <th
    onClick={() => onSort(col)}
    className={`${thClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
  >
    <span className="inline-flex items-center gap-1.5">
      {label}
      <SortIcon active={sort === col} dir={desc ? 'desc' : 'asc'} />
    </span>
  </th>
);

const selectStyles = {
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  control: (b) => ({ ...b, minHeight: 30, height: 30 }),
  valueContainer: (b) => ({ ...b, padding: '0 6px' }),
  indicatorsContainer: (b) => ({ ...b, height: 30 }),
};

const selectClassNames = {
  control: (s) => `!text-xs !rounded !border-gray-200 dark:!border-gray-600 dark:!bg-gray-800 ${s.isFocused ? '!shadow-none !border-primary' : ''}`,
  option: () => '!text-xs',
  singleValue: () => '!text-xs !text-gray-700 dark:!text-gray-200',
  placeholder: () => '!text-xs !text-gray-400',
};

const EMPTY_EDIT = { nota: '', codOportunidad: null };

const menuPortalTarget = typeof document !== 'undefined' ? document.body : null;

const CRMRow = memo(function CRMRow({ row, idx, edit, isSelected, isBusy, optsOportunidad, onToggle, onEdit }) {
  const quoteLink = row.codCliente && row.catCotizacion
    ? `/admin/revision/quotes?customer=${row.codCliente}&option=${CATEGORY_OPTION[row.catCotizacion] ?? 'quotes'}&id=${row.nroCotizacion}`
    : null;
  return (
    <tr className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/20 ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
      <td className="px-3 py-2 w-8">
        <input type="checkbox" checked={isSelected} onChange={() => onToggle(row.codRegistro)} className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" />
      </td>
      <td className={`${tdClass} w-20`}>
        <div className="flex items-center gap-1.5">
          {quoteLink ? (
            <Link href={quoteLink} className="font-bold text-primary hover:underline text-[13px] shrink-0">{row.nroCotizacion}</Link>
          ) : (
            <span className="font-bold text-primary text-[13px] shrink-0">{row.nroCotizacion}</span>
          )}
          <CatBadge cat={row.catCotizacion} />
        </div>
      </td>
      <td className={`${tdClass} w-20`}>
        <span className="tabular-nums">{row.dias}</span>
      </td>
      <td className={`${tdClass} w-24 max-w-[200px]`}>
        <p className="truncate text-[12px]" title={row.clientePais}>{row.clientePais}</p>
      </td>
      <td className={`${tdClass} text-right tabular-nums w-24`}>
        {row.total > 0
          ? <span className="font-semibold font-mono">{customFormat(row.total)}</span>
          : <span className="text-gray-400">—</span>
        }
      </td>
      <td className={`${tdClass} w-20`}>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">{row.compartidoPor}</span>
      </td>
      <td className="px-1.5 py-1.5 w-44">
        <Select
          options={optsOportunidad}
          value={edit.codOportunidad}
          onChange={opt => onEdit(row.codRegistro, 'codOportunidad', opt)}
          placeholder="Tipo..."
          isDisabled={isBusy}
          menuPortalTarget={menuPortalTarget}
          styles={selectStyles}
          classNames={selectClassNames}
        />
      </td>
      <td className="px-1.5 py-1.5">
        <input
          value={edit.nota}
          onChange={e => onEdit(row.codRegistro, 'nota', e.target.value)}
          disabled={isBusy}
          type="text"
          placeholder="Agregar nota..."
          className="w-full h-[30px] px-2 text-xs rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-800 transition-colors disabled:opacity-50"
        />
      </td>
    </tr>
  );
});

export default function CRMDashboard() {
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useDynamicTitle(`${t.revision} | ${t.panel_crm}`);

  // ── URL como fuente de verdad (paginación + sort + filtros) ──
  const urlPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const urlSort = searchParams.get('sort') ?? 'days';
  const urlDesc = searchParams.get('dir') === 'desc';
  const urlTerm = searchParams.get('term') ?? '';

  // ── Tabla ──
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState({});
  const [selected, setSelected] = useState(new Set());

  // ── Input de filtro (ref — evita re-render en cada tecla) ──
  const inputTermRef = useRef(null);

  // Sincronizar input cuando la URL cambia (ej: botón atrás / Limpiar)
  useEffect(() => {
    if (inputTermRef.current) inputTermRef.current.value = searchParams.get('term') ?? '';
  }, [searchParams]);

  // ── Batch ──
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchClosing, setBatchClosing] = useState(false);

  // ── Controles (oportunidades, inbox, notas) ──
  const [optsOportunidad, setOptsOportunidad] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [closingMsg, setClosingMsg] = useState({});
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // ── Modal cerrar mensaje ──
  const [replyModal, setReplyModal] = useState({ open: false, msg: null });
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Carga oportunidades, inbox, notas — una vez
  const fetchControles = useCallback(async () => {
    try {
      const rs = await axiosClient.get(URL_CONTROLES);
      const body = rs.data ?? {};
      setOptsOportunidad(body.oportunidades ?? []);
      setInbox(body.inbox ?? []);
      const nota = body.notas?.[0];
      if (nota) { setNoteText(nota.nota ?? ''); }
    } catch { /* no crítico */ }
  }, []);

  // Carga página actual con sort
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_LISTAR, {
        params: {
          page: urlPage,
          sortBy: urlSort,
          dir: urlDesc ? 'desc' : 'asc',
          ...(urlTerm && { term: urlTerm }),
        },
      });
      const body = rs.data ?? {};
      const data = body.datos ?? [];
      setRows(data);
      setTotal(body.total ?? 0);
      setTotalPaginas(body.totalPaginas ?? 1);
      setSelected(new Set());
      // Seed edits para filas nuevas (preserva edits existentes)
      setEdits(prev => {
        const next = { ...prev };
        data.forEach(r => {
          if (!next[r.codRegistro]) {
            next[r.codRegistro] = { nota: r.nota ?? '', codOportunidad: null };
          }
        });
        return next;
      });
    } catch {
      swalError('No se pudo cargar el seguimiento');
    } finally {
      setLoading(false);
    }
  }, [urlPage, urlSort, urlDesc, urlTerm]);

  useEffect(() => { fetchControles(); }, [fetchControles]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // Pre-poblar Select oportunidad con el valor que viene del listado
  useEffect(() => {
    if (optsOportunidad.length === 0 || rows.length === 0) return;
    setEdits(prev => {
      const next = { ...prev };
      rows.forEach(r => {
        if (r.oportunidad && !next[r.codRegistro]?.codOportunidad) {
          const opt = optsOportunidad.find(o => o.value === r.oportunidad);
          if (opt) next[r.codRegistro] = { ...next[r.codRegistro], codOportunidad: opt };
        }
      });
      return next;
    });
  }, [optsOportunidad, rows]);

  // ── Filtros server-side ──
  const handleBuscar = () => {
    const term = inputTermRef.current?.value ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set('term', term); else params.delete('term');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLimpiarFiltros = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('term');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ── Sort handler ──
  const handleSort = (col) => {
    const newDesc = urlSort === col ? !urlDesc : false;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', col);
    params.set('dir', newDesc ? 'desc' : 'asc');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // ── Page handler ──
  const handlePage = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.codRegistro));
  const someSelected = rows.some(r => selected.has(r.codRegistro));
  const selectedCount = rows.filter(r => selected.has(r.codRegistro)).length;

  const toggleSelectAll = () => {
    if (allSelected) { setSelected(new Set()); }
    else { setSelected(new Set(rows.map(r => r.codRegistro))); }
  };
  const toggleSelect = useCallback((cod) =>
    setSelected(prev => { const n = new Set(prev); n.has(cod) ? n.delete(cod) : n.add(cod); return n; }), []);

  const setEdit = useCallback((cod, field, val) => {
    setEdits(prev => ({ ...prev, [cod]: { ...prev[cod], [field]: val } }));
    setSelected(prev => { const n = new Set(prev); n.add(cod); return n; });
  }, []);

  // ── Guardar en bloque ──
  const handleGuardarBatch = async () => {
    const sel = rows.filter(r => selected.has(r.codRegistro));
    const res = await swalConfirm('¿Guardar cambios?', `Se guardarán ${sel.length} seguimiento(s)`,
      { confirmText: 'Guardar', cancelText: 'Cancelar' });
    if (!res.isConfirmed) return;
    setBatchSaving(true);
    try {
      await axiosClient.post(URL_GUARDAR_CAMBIOS,
        sel.map(r => ({ CodRegistro: r.codRegistro, CodOportunidad: edits[r.codRegistro]?.codOportunidad?.value ?? null, Nota: edits[r.codRegistro]?.nota ?? '' }))
      );
      swalSuccess(`${sel.length} seguimiento(s) guardados`);
      await fetchData();
    } catch {
      swalError('Error al guardar cambios');
    } finally {
      setBatchSaving(false);
    }
  };

  // ── Cerrar en bloque ──
  const handleCerrarBatch = async () => {
    const sel = rows.filter(r => selected.has(r.codRegistro));
    const res = await swalConfirm('¿Cerrar seguimientos?', `Se cerrarán ${sel.length} seguimiento(s)`,
      { confirmText: 'Cerrar', cancelText: 'Cancelar', confirmColor: '#dc2626' });
    if (!res.isConfirmed) return;
    setBatchClosing(true);
    try {
      await axiosClient.post(URL_CERRAR,
        sel.map(r => ({ CodRegistro: r.codRegistro, CodOportunidad: edits[r.codRegistro]?.codOportunidad?.value ?? null, Nota: edits[r.codRegistro]?.nota ?? '' }))
      );
      swalSuccess(`${sel.length} seguimiento(s) cerrados`);
      await fetchData();
    } catch {
      swalError('Error al cerrar seguimientos');
    } finally {
      setBatchClosing(false);
    }
  };

  // ── Sidebar: Notas ──
  const handleSaveNote = async () => {
    setNoteSaving(true);
    try {
      await axiosClient.post(URL_SAVE_NOTE, { nota: noteText });
      swalSuccess('Nota guardada');
    } catch {
      swalError('Error al guardar la nota');
    } finally {
      setNoteSaving(false);
    }
  };

  // ── Sidebar: Inbox ──
  const handleCloseMsg = async (msg) => {
    setClosingMsg(prev => ({ ...prev, [msg.codMensaje]: true }));
    try {
      await axiosClient.post(URL_CLOSE_MSG, { codMensaje: msg.codMensaje });
      setInbox(prev => prev.map(m => m.codMensaje === msg.codMensaje ? { ...m, leido: true } : m));
    } catch {
      swalError('Error al cerrar mensaje');
    } finally {
      setClosingMsg(prev => ({ ...prev, [msg.codMensaje]: false }));
    }
  };

  const openReplyModal = (msg) => { setReplyModal({ open: true, msg }); setReplyText(''); };
  const closeReplyModal = () => { if (!replySubmitting) setReplyModal({ open: false, msg: null }); };

  const handleReplySubmit = async (withReply) => {
    if (withReply && !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const payload = { codMensaje: replyModal.msg.codMensaje };
      if (withReply) payload.respuesta = replyText.trim();
      const rs = await axiosClient.post(URL_MARK_CLOSE, payload);
      setInbox(rs.data?.inbox ?? []);
      closeReplyModal();
    } catch {
      swalError('Error al cerrar mensaje');
    } finally {
      setReplySubmitting(false);
    }
  };

  const isBatchBusy = batchSaving || batchClosing;

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
        <li>{t.revision}</li>
        <li className="before:content-['/'] ltr:before:mr-1.5 rtl:before:ml-1.5">
          <span className="text-gray-700 dark:text-gray-300 font-medium">{t.panel_crm}</span>
        </li>
      </ul>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.panel_crm}</h1>
        <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
      </div>

      {/* Layout */}
      <div className="flex gap-5 items-start">

        {/* ─── Tabla principal ─── */}
        <div className="flex-1 min-w-0">
          <div className="panel p-0 overflow-hidden">

            {/* Filtros + acciones en bloque */}
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Buscar</label>
                <input
                  ref={inputTermRef}
                  defaultValue={urlTerm}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  type="text"
                  placeholder="Cliente, país, Nro. orden..."
                  className="form-input text-xs py-1 px-2 h-[30px] w-64"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleBuscar}
                  className="h-[30px] px-3 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  Buscar
                </button>
                {urlTerm && (
                  <button
                    onClick={handleLimpiarFiltros}
                    className="h-[30px] px-3 text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Limpiar
                  </button>
                )}
              </div>

              <div className="ml-auto flex items-center gap-3">
                {total > 0 && selectedCount === 0 && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {total} seguimiento{total !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePage(urlPage - 1)}
                        disabled={urlPage <= 1}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[60px] text-center">
                        {urlPage} / {totalPaginas}
                      </span>
                      <button
                        onClick={() => handlePage(urlPage + 1)}
                        disabled={urlPage >= totalPaginas}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCount} seleccionado(s)</span>
                  <button
                    onClick={handleGuardarBatch}
                    disabled={isBatchBusy}
                    className="h-[30px] px-3 text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                  >
                    {batchSaving ? <SpinIcon cls="w-3 h-3" /> : <SaveIcon />}
                    Guardar Cambios
                  </button>
                  <button
                    onClick={handleCerrarBatch}
                    disabled={isBatchBusy}
                    className="h-[30px] px-3 text-[11px] font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded flex items-center gap-1.5 disabled:opacity-40 transition-colors dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                  >
                    {batchClosing ? <SpinIcon cls="w-3 h-3" /> : <CloseIcon />}
                    Cerrar Seguimiento
                  </button>
                </div>
              )}
            </div>

            {/* Spinner solo en carga inicial (sin filas previas) */}
            {loading && rows.length === 0 && (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <SpinIcon cls="w-4 h-4" /><span>Cargando...</span>
              </div>
            )}

            {/* Empty */}
            {!loading && rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <svg className="w-12 h-12 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm">
                  {urlTerm ? 'Sin resultados para los filtros aplicados' : 'No hay seguimientos pendientes'}
                </span>
              </div>
            )}

            {/* Tabla — siempre visible cuando hay filas; overlay durante paginación */}
            {rows.length > 0 && (
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 z-10 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center pointer-events-none">
                    <SpinIcon cls="w-5 h-5 text-primary" />
                  </div>
                )}
                <>
                  <div className="table-responsive">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700/60">
                          <th className={`${thClass} w-8 !px-3`}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={toggleSelectAll}
                              className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                            />
                          </th>
                          <SortableTh col="quote" label="# Orden" sort={urlSort} desc={urlDesc} onSort={handleSort} />
                          <SortableTh col="days" label="Días" sort={urlSort} desc={urlDesc} onSort={handleSort} />
                          <SortableTh col="customer" label="Cliente - País" sort={urlSort} desc={urlDesc} onSort={handleSort} />
                          <SortableTh col="total" label="Total $us" sort={urlSort} desc={urlDesc} onSort={handleSort} className="text-right" />
                          <SortableTh col="by" label="Compartido por" sort={urlSort} desc={urlDesc} onSort={handleSort} />
                          <th className={`${thClass} w-44`}>Oportunidad</th>
                          <th className={`${thClass} w-72`}>Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                        {rows.map((row, idx) => (
                          <CRMRow
                            key={row.codRegistro}
                            row={row}
                            idx={idx}
                            edit={edits[row.codRegistro] ?? EMPTY_EDIT}
                            isSelected={selected.has(row.codRegistro)}
                            isBusy={isBatchBusy}
                            optsOportunidad={optsOportunidad}
                            onToggle={toggleSelect}
                            onEdit={setEdit}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {total} resultado{total !== 1 ? 's' : ''} · página {urlPage} de {totalPaginas}
                    </span>
                    <Pagination
                      total={totalPaginas}
                      value={urlPage}
                      onChange={handlePage}
                      size="sm"
                      withEdges
                    />
                  </div>
                </>
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="w-96 shrink-0 flex flex-col gap-4 sticky top-4">

          {/* Notas */}
          <div className="panel p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
              <svg className="w-3.5 h-3.5 text-primary opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {t.notes ?? 'Notas'}
              </span>
            </div>
            <div className="p-3 space-y-3">
              <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                <ReactQuill
                  theme="snow"
                  value={noteText}
                  onChange={setNoteText}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['clean'],
                    ],
                  }}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setNoteText('')}
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                  Limpiar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={noteSaving}
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {noteSaving ? <SpinIcon cls="w-3 h-3" /> : <SaveIcon cls="w-3 h-3 stroke-white" />}
                  {t.btn_save ?? 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          {/* Inbox */}
          <div className="panel p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
              <svg className="w-3.5 h-3.5 text-primary opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
              </svg>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {t.inbox ?? 'Inbox'}
              </span>
              {inbox.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 leading-none">
                  {inbox.length}
                </span>
              )}
            </div>
            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                <svg className="w-8 h-8 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="text-xs">Sin mensajes</span>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {inbox.map((msg, i) => (
                  <div
                    key={i}
                    onClick={() => !msg.leido && handleCloseMsg(msg)}
                    title={!msg.leido ? 'Marcar como leído' : undefined}
                    className={`group flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 transition-colors
                      ${msg.leido
                        ? 'bg-gray-50/60 dark:bg-gray-800/20 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 cursor-default'
                        : 'bg-white dark:bg-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer'
                      }`}
                  >
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${msg.leido ? 'bg-transparent' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] truncate ${msg.leido ? 'font-normal text-gray-500 dark:text-gray-400' : 'font-bold text-gray-800 dark:text-gray-100'}`}>
                        {msg.notificacion}
                      </p>
                      <p className={`text-[11px] truncate ${msg.leido ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {msg.desMensaje} | { msg.codMensaje }
                      </p>
                    </div>
                    {closingMsg[msg.codMensaje] ? (
                      <SpinIcon cls="shrink-0 w-3 h-3 text-gray-400" />
                    ) : (
                      <>
                        <span className="shrink-0 group-hover:hidden">
                          {msg.visto ? (
                            <svg className="w-4 h-3" viewBox="0 0 20 12" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1,6 4,10 11,1" /><polyline points="6,6 9,10 16,1" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-3 text-gray-300 dark:text-gray-600" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1,6 4,10 11,1" /><polyline points="6,6 9,10 16,1" />
                            </svg>
                          )}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openReplyModal(msg); }}
                          className="shrink-0 hidden group-hover:block px-1.5 py-0.5 text-[10px] font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-all whitespace-nowrap"
                        >
                          Cerrar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      {/* ── Modal cerrar mensaje ── */}
      <Modal
        showModal={replyModal.open}
        closeModal={closeReplyModal}
        title="Cerrar mensaje"
        size="w-full max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{replyModal.msg?.notificacion}</p>
            {replyModal.msg?.desMensaje && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{replyModal.msg.desMensaje}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Respuesta</label>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              disabled={replySubmitting}
              rows={4}
              placeholder="Escribe una respuesta..."
              className="form-textarea w-full resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={closeReplyModal} disabled={replySubmitting} className="btn btn-outline-danger">
              Cancelar
            </button>
            <button type="button" onClick={() => handleReplySubmit(false)} disabled={replySubmitting} className="btn btn-outline-warning">
              {replySubmitting ? <SpinIcon cls="w-3.5 h-3.5" /> : 'Cerrar sin responder'}
            </button>
            <button type="button" onClick={() => handleReplySubmit(true)} disabled={replySubmitting || !replyText.trim()} className="btn btn-primary">
              {replySubmitting ? <SpinIcon cls="w-3.5 h-3.5" /> : 'Responder'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
