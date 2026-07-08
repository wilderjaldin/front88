'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import Swal from 'sweetalert2';
import Modal from '@/components/modal';
import DeleteForm from './delete-form';
import ShowAssignmentsForm from './show-assignments-form';
import MailToCustomerForm from './mail-to-customer-form';
import MailToSupplierForm from './mail-to-supplier-form';
import IconBackSpace from '@/components/icon/icon-backspace';
import Link from 'next/link';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError, swalConfirm } from '@/app/lib/swal';

const URL_EXPORT      = 'repuestosporcotizar/exportar';
const URL_SAVE_NOTE   = 'repuestosporcotizar/guardar-notas';
const URL_EXCLUIR = 'repuestosporcotizar/excluir-item';

const URL_GRUPOS          = 'repuestosporcotizar/grupos';
const URL_GRUPOS_GUARDAR  = 'repuestosporcotizar/grupos/guardar';
const URL_GRUPOS_ASIGNAR  = 'repuestosporcotizar/grupos/asignar';
const URL_GRUPOS_QUITAR   = 'repuestosporcotizar/grupos/quitar';
const URL_GRUPOS_ITEMS    = (id) => `repuestosporcotizar/grupos/${id}/items`;
const URL_GRUPOS_ELIMINAR = (id) => `repuestosporcotizar/grupos/${id}`;

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z"/><path d="M3.5 11L0 6.5H7L3.5 11Z"/>
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc' ? <path d="M3.5 0L7 7H0L3.5 0Z"/> : <path d="M3.5 7L0 0H7L3.5 7Z"/>}
    </svg>
  );
};

const SortableHeader = ({ col, label, sortCol, sortDir, onSort, className = '' }) => (
  <th onClick={() => onSort(col)} className={`${thClass} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}>
    <span className="inline-flex items-center gap-1.5">
      {label}<SortIcon active={sortCol === col} dir={sortDir} />
    </span>
  </th>
);

// ── Grupos: panel compacto que contiene toda la lógica de grupos ──────────────
const GruposPanel = ({
  data, grupos, setGrupos,
  grupoActivo, setGrupoActivo, grupoItems, setGrupoItems,
  itemsEnGrupos, setItemsEnGrupos,
  selected, setSelected, setPage,
  setOrdersAssigned, setOrdersUnassigned,
}) => {
  const [loading,       setLoading]       = useState(false);
  const [grupoDestino,  setGrupoDestino]  = useState('');   // destino al asignar (independiente de Vista)
  const [showCrear,     setShowCrear]     = useState(false);
  const [newNombre,     setNewNombre]     = useState('');
  const [showRenombrar, setShowRenombrar] = useState(false);
  const [editNombre,    setEditNombre]    = useState('');

  const noSel  = selected.length === 0;
  const enGrupo = grupoActivo !== '';

  // ── Navegar entre vistas (Todos / grupo específico) ──────────────────────
  const handleCambiarVista = async (codGrupo) => {
    setGrupoActivo(codGrupo);
    setSelected([]);
    setPage(1);
    setShowRenombrar(false);
    if (!codGrupo) { setGrupoItems(null); return; }
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_GRUPOS_ITEMS(codGrupo));
      setGrupoItems((rs.data ?? []).map((o, i) => ({ ...o, id: i })));
    } catch {
      swalError('Error', 'No se pudieron cargar los ítems del grupo.');
      setGrupoItems(null);
      setGrupoActivo('');
    } finally { setLoading(false); }
  };

  // ── Asignar ítems seleccionados al grupo destino ──────────────────────────
  const handleAsignar = async () => {
    if (!grupoDestino || noSel) return;
    try {
      const payload = { codGrupo: Number(grupoDestino), codRegistro: selected.map(o => o.codRegistro) };
      const rs = await axiosClient.post(URL_GRUPOS_ASIGNAR, payload);
      setOrdersUnassigned?.((rs.data.noAsignados ?? []).map((o, i) => ({ ...o, id: i })));
      setOrdersAssigned((rs.data.asignados ?? []).map((o, i) => ({ ...o, id: i })));
      setItemsEnGrupos(prev => {
        const next = new Set(prev);
        selected.forEach(o => next.add(o.codRegistro));
        return next;
      });
      setSelected([]);
      setGrupoDestino('');
      swalSuccess('Ítems asignados al grupo');
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo asignar los ítems.');
    }
  };

  // ── Quitar ítems del grupo activo ─────────────────────────────────────────
  const handleQuitar = async () => {
    if (!enGrupo || noSel) return;
    try {
      const rs = await axiosClient.post(URL_GRUPOS_QUITAR, { codRegistro: selected.map(o => o.codRegistro) });
      setOrdersUnassigned?.((rs.data.noAsignados ?? []).map((o, i) => ({ ...o, id: i })));
      setOrdersAssigned((rs.data.asignados ?? []).map((o, i) => ({ ...o, id: i })));
      const removidos = new Set(selected.map(o => o.codRegistro));
      setGrupoItems(prev => (prev ?? []).filter(o => !removidos.has(o.codRegistro)).map((o, i) => ({ ...o, id: i })));
      setItemsEnGrupos(prev => {
        const next = new Set(prev);
        selected.forEach(o => next.delete(o.codRegistro));
        return next;
      });
      setSelected([]);
      swalSuccess('Ítems removidos del grupo');
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo quitar los ítems.');
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!newNombre.trim()) return;
    try {
      const rs = await axiosClient.post(URL_GRUPOS_GUARDAR, { codGrupo: 0, nomGrupo: newNombre.trim() });
      setGrupos(rs.data ?? []);
      setNewNombre(''); setShowCrear(false);
      swalSuccess('Grupo creado');
    } catch (err) { swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo crear.'); }
  };

  const handleRenombrar = async () => {
    if (!grupoActivo || !editNombre.trim()) return;
    try {
      const rs = await axiosClient.post(URL_GRUPOS_GUARDAR, { codGrupo: Number(grupoActivo), nomGrupo: editNombre.trim() });
      setGrupos(rs.data ?? []);
      setShowRenombrar(false);
      swalSuccess('Nombre actualizado');
    } catch (err) { swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo modificar.'); }
  };

  const handleEliminar = async () => {
    if (!grupoActivo) return;
    const { isConfirmed } = await swalConfirm(
      '¿Eliminar este grupo?',
      'El grupo debe estar vacío.',
      { confirmText: 'Eliminar', confirmColor: '#dc2626' }
    );
    if (!isConfirmed) return;
    try {
      const rs = await axiosClient.delete(URL_GRUPOS_ELIMINAR(grupoActivo));
      setGrupos(rs.data ?? []);
      setGrupoActivo(''); setGrupoItems(null);
      swalSuccess('Grupo eliminado');
    } catch (err) { swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo eliminar.'); }
  };

  const inputCls = "h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const btnSm = "h-8 px-3 rounded-lg text-xs font-medium transition whitespace-nowrap";

  return (
    <div className="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">

      {/* ── Fila 1: navegación + gestión del grupo ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">

        {/* Etiqueta */}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 shrink-0">Grupos</span>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block shrink-0" />

        {/* Select de Vista */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Ver:</label>
          <div className="relative flex items-center">
            <select
              value={grupoActivo}
              onChange={e => handleCambiarVista(e.target.value)}
              disabled={loading}
              className={`${inputCls} pr-8 appearance-none disabled:opacity-60 min-w-[160px]`}
            >
              <option value="">Sin grupo ({data.filter(o => !itemsEnGrupos.has(o.codRegistro)).length})</option>
              {grupos.map(g => (
                <option key={g.codGrupo} value={String(g.codGrupo)}>{g.nomGrupo}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 text-gray-400">
              {loading
                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              }
            </span>
          </div>
          {enGrupo && !loading && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {(grupoItems ?? []).length} ítem{(grupoItems ?? []).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Gestión del grupo activo: Renombrar + Eliminar */}
        {enGrupo && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block shrink-0" />
            {showRenombrar ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenombrar(); if (e.key === 'Escape') setShowRenombrar(false); }}
                  className={`${inputCls} w-44`}
                  placeholder="Nuevo nombre..."
                />
                <button onClick={handleRenombrar} disabled={!editNombre.trim()}
                  className={`${btnSm} bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40`}>
                  Guardar
                </button>
                <button onClick={() => setShowRenombrar(false)}
                  className={`${btnSm} text-gray-400 hover:text-gray-600`}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const g = grupos.find(g => String(g.codGrupo) === grupoActivo); setEditNombre(g?.nomGrupo ?? ''); setShowRenombrar(true); }}
                  className={`${btnSm} border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                  </svg>
                  Renombrar
                </button>
                <button onClick={handleEliminar}
                  className={`${btnSm} border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            )}
          </>
        )}

        {/* Crear nuevo grupo */}
        <div className="ml-auto flex items-center gap-2">
          {showCrear ? (
            <>
              <input
                autoFocus
                type="text"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCrear(); if (e.key === 'Escape') { setShowCrear(false); setNewNombre(''); } }}
                placeholder="Nombre del nuevo grupo..."
                className={`${inputCls} w-48`}
              />
              <button onClick={handleCrear} disabled={!newNombre.trim()}
                className={`${btnSm} bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed`}>
                Crear
              </button>
              <button onClick={() => { setShowCrear(false); setNewNombre(''); }}
                className={`${btnSm} text-gray-400 hover:text-gray-600`}>
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={() => setShowCrear(true)}
              className={`${btnSm} border border-primary/60 text-primary bg-primary/5 hover:bg-primary/15 dark:border-primary/50 dark:bg-primary/10 dark:hover:bg-primary/20 flex items-center gap-1.5 font-semibold transition`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo grupo
            </button>
          )}
        </div>
      </div>

      {/* ── Fila 2: acciones con ítems seleccionados (solo visible si hay selección) ── */}
      {!noSel && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-primary/3">

          <span className="text-xs font-medium text-primary whitespace-nowrap">
            {selected.length} ítem{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}:
          </span>

          {/* Opción A: estamos en "Todos" → asignar a un grupo */}
          {!enGrupo && grupos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Asignar a:</span>
              <div className="relative flex items-center">
                <select
                  value={grupoDestino}
                  onChange={e => setGrupoDestino(e.target.value)}
                  className={`${inputCls} pr-7 appearance-none min-w-[150px]`}
                >
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(g => (
                    <option key={g.codGrupo} value={String(g.codGrupo)}>{g.nomGrupo}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </span>
              </div>
              <button
                onClick={handleAsignar}
                disabled={!grupoDestino}
                className={`${btnSm} bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
                Asignar
              </button>
            </div>
          )}

          {/* Opción B: estamos en un grupo → quitar del grupo */}
          {enGrupo && (
            <button
              onClick={handleQuitar}
              className={`${btnSm} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1.5`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Quitar del grupo
            </button>
          )}

        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const ItemsAssigned = ({ token, t, data, unassignOrder, setOrdersAssigned, setOrdersUnassigned }) => {
  const [selected,  setSelected]  = useState([]);
  const [filter,    setFilter]    = useState('');
  const [sortCol,   setSortCol]   = useState('');
  const [sortDir,   setSortDir]   = useState('asc');
  const [page,      setPage]      = useState(1);

  const [show_modal,    setShowModal]    = useState(false);
  const [modal_title,   setModalTitle]   = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size,    setModalSize]    = useState('w-full max-w-xl');

  const [users,      setUsers]      = useState([]);
  const [loadUsers,  setLoadUsers]  = useState(true);
  const [notesDirty,     setNotesDirty]     = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e) => { if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) setStatusMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusMenuOpen]);

  const [grupos,        setGrupos]        = useState([]);
  const [grupoActivo,   setGrupoActivo]   = useState('');
  const [grupoItems,    setGrupoItems]    = useState(null);
  const [itemsEnGrupos, setItemsEnGrupos] = useState(new Set());

  const { register, getValues, setValue } = useForm();

  useEffect(() => { setSelected([]); setPage(1); }, [data]);

  useEffect(() => {
    data.forEach(o => {
      setValue(`note.${o.codRegistro}`, o.nota ?? '');
      if (o.sugerencias?.length > 0)
        setValue(`sugerPrv.${o.codRegistro}`, o.sugerencias[0].value);
    });
  }, [data]);

  useEffect(() => {
    axiosClient.get(URL_GRUPOS)
      .then(async rs => {
        const groups = rs.data ?? [];
        setGrupos(groups);
        if (groups.length === 0) return;
        const results = await Promise.all(
          groups.map(g => axiosClient.get(URL_GRUPOS_ITEMS(g.codGrupo)).then(r => r.data ?? []).catch(() => []))
        );
        setItemsEnGrupos(new Set(results.flat().map(o => o.codRegistro)));
      })
      .catch(() => {});
  }, []);

  const sourceData = grupoActivo
    ? (grupoItems ?? [])
    : data.filter(o => !itemsEnGrupos.has(o.codRegistro));

  const filteredData = useMemo(() => {
    let result = [...sourceData];
    if (filter.trim()) {
      const f = filter.trim().toLowerCase();
      result = result.filter(item =>
        (item.nomCliente      ?? '').toLowerCase().includes(f) ||
        (item.nroCotizacion?.toString() ?? '').includes(f) ||
        (item.nroParte        ?? '').toLowerCase().includes(f) ||
        (item.nomMarca        ?? '').toLowerCase().includes(f)
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [sourceData, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData   = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const handleSaveNote = async () => {
    const payload = pageData.map(o => ({ CodRegistro: o.codRegistro, Nota: getValues(`note.${o.codRegistro}`) }));
    try {
      await axiosClient.put(URL_SAVE_NOTE, payload);
      setNotesDirty(false);
      swalSuccess('Notas guardadas correctamente');
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo guardar las notas.');
    }
  };

  const handleSaveStatus = (option) => {
    const label = option === 'IV' ? t.question_change_status_invalid
      : option === 'DE'           ? t.question_change_status_discontinued
      : t.question_change_status_no_option;
    Swal.fire({
      title: label, icon: 'question', showCancelButton: true,
      confirmButtonColor: '#15803d', confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel, reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const payload = selected.map(o => ({ estadoCodigo: option, codRegistro: o.codRegistro, nroOrden: o.nroCotizacion, nroParte: o.nroParte }));
        await axiosClient.post(URL_EXCLUIR, payload);
        swalSuccess(t.save_change_status_order_success);
        setOrdersAssigned(prev => prev.filter(o => !selected.some(s => s.codRegistro === o.codRegistro)));
      } catch (err) {
        swalError('Error', err?.response?.data?.mensaje ?? t.save_change_status_order_error);
      }
    });
  };

  const handleExportOrders = async () => {
    if (selected.length === 0) return;
    try {
      const response = await axiosClient.post(URL_EXPORT, selected.map(o => o.codRegistro), { responseType: 'blob' });
      const disposition = response.headers['content-disposition'];
      const filename    = disposition?.match(/filename="?([^";\n]+)"?/)?.[1] ?? 'ListaItems.xlsx';
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleMailToCustomer = () => {
    const names = [...new Set(selected.map(o => o.nomCliente))];
    if (names.length > 1) { Swal.fire({ title: t.error, text: t.different_customers_send_email_error, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close }); return; }
    setModalSize('w-full max-w-3xl'); setModalTitle('Mail a Cliente');
    setModalContent(<MailToCustomerForm selected={selected} close={() => setShowModal(false)} t={t} token={token} />);
    setShowModal(true);
  };

  const handleMailToSupplier = () => {
    setModalSize('w-full max-w-3xl'); setModalTitle('Mail a Proveedor');
    setModalContent(<MailToSupplierForm selected={selected} close={() => setShowModal(false)} t={t} token={token} />);
    setShowModal(true);
  };

  const handleDeleteOrders = () => {
    if (selected.length === 0) return;

    const onDeleted = (deletedIds) => {
      if (grupoActivo) {
        setGrupoItems(prev => (prev ?? []).filter(o => !deletedIds.has(o.codRegistro)).map((o, i) => ({ ...o, id: i })));
      }
      setItemsEnGrupos(prev => {
        const next = new Set(prev);
        deletedIds.forEach(id => next.delete(id));
        return next;
      });
    };

    setModalSize('w-full max-w-3xl'); setModalTitle('');
    setModalContent(<DeleteForm t={t} token={token} action_cancel={() => setShowModal(false)} onDeleted={onDeleted} users={users} setUsers={setUsers} loadUsers={loadUsers} setLoadUsers={setLoadUsers} selected_orders={selected} setOrdersAssigned={setOrdersAssigned} />);
    setShowModal(true);
  };

  const handleShowAssignments = () => {
    setModalSize('w-full max-w-7xl'); setModalTitle('Items Asignados a otros Usuarios');
    setModalContent(<ShowAssignmentsForm t={t} token={token} action_cancel={() => setShowModal(false)} users={users} setUsers={setUsers} loadUsers={loadUsers} setLoadUsers={setLoadUsers} selected_orders={selected} setOrdersAssigned={setOrdersAssigned} />);
    setShowModal(true);
  };


  const noSel           = selected.length === 0;
  const sameCliente     = !noSel && new Set(selected.map(o => o.codCliente)).size === 1;
  const mailClienteTip  = noSel ? 'Seleccione al menos un item' : !sameCliente ? 'Los items seleccionados pertenecen a diferentes clientes' : undefined;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.items_to_be_quoted_assigned}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>
        <div className="relative">
          <input type="text" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} placeholder={t.filter}
            className="h-10 w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {filter && (
            <button onClick={() => setFilter('')} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
              <IconBackSpace className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">

        {/* Grupo 1: asignación */}
        <button onClick={() => unassignOrder(selected)} disabled={noSel}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M3 12h18"/></svg>
          {t.remove_assignment}
        </button>
        <button onClick={handleDeleteOrders} disabled={noSel}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition ${noSel ? 'text-gray-300 cursor-not-allowed dark:text-gray-600' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path strokeLinecap="round" d="M9 6V4h6v2"/></svg>
          {t.delete}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* Grupo 2: comunicación */}
        <button onClick={handleMailToCustomer} disabled={!sameCliente} title={mailClienteTip}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${!sameCliente ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path strokeLinecap="round" d="M2 7l10 7 10-7"/></svg>
          {t.mail_to_customer}
        </button>
        <button onClick={handleMailToSupplier} disabled={noSel}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${noSel ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path strokeLinecap="round" d="M2 7l10 7 10-7"/></svg>
          {t.mail_to_supplier}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* Grupo 3: Marcar como (dropdown) */}
        <div className="relative" ref={statusMenuRef}>
          <button onClick={() => setStatusMenuOpen(o => !o)} disabled={noSel}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${noSel ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
            Marcar como
            <svg className={`w-3 h-3 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
          </button>
          {statusMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-30 min-w-[160px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 overflow-hidden">
              {[
                { code: 'IV', label: t.invalid,       color: 'text-red-600    hover:bg-red-50    dark:text-red-400    dark:hover:bg-red-900/20'    },
                { code: 'DE', label: t.discontinued,  color: 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20' },
                { code: 'SO', label: t.no_option,     color: 'text-amber-600  hover:bg-amber-50  dark:text-amber-400  dark:hover:bg-amber-900/20'  },
              ].map(({ code, label, color }) => (
                <button key={code} onClick={() => { handleSaveStatus(code); setStatusMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold transition ${color}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* Grupo 4: utilidades */}
        <button onClick={handleExportOrders} disabled={noSel}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${noSel ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4M3 19h18"/></svg>
          Exportar xlsx
        </button>
        <button onClick={handleSaveNote} disabled={!notesDirty} title="Guardar notas de la página actual"
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${!notesDirty ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Guardar Notas
        </button>
        <button onClick={handleShowAssignments}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75"/></svg>
          {t.view_assignments}
        </button>

        {/* Contador al extremo derecho */}
        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Panel de grupos — autocontenido */}
      <GruposPanel
        data={data}
        grupos={grupos}
        setGrupos={setGrupos}
        grupoActivo={grupoActivo}
        setGrupoActivo={setGrupoActivo}
        grupoItems={grupoItems}
        setGrupoItems={setGrupoItems}
        itemsEnGrupos={itemsEnGrupos}
        setItemsEnGrupos={setItemsEnGrupos}
        selected={selected}
        setSelected={setSelected}
        setPage={setPage}
        setOrdersAssigned={setOrdersAssigned}
        setOrdersUnassigned={setOrdersUnassigned}
      />

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <input type="checkbox" className="form-checkbox"
                    checked={pageData.length > 0 && selected.length === pageData.length} onChange={toggleAll} />
                </th>
                <SortableHeader col="nroCotizacion"  label={t.nro_order}       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className={thClass}>Creado Por</th>
                <SortableHeader col="nroParte"       label={t.nro_part}        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="cantidad"       label={t.amount}          sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader col="nomCliente"     label={t.customer}        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className={`${thClass} text-center`}>{t.country ?? 'País'}</th>
                <SortableHeader col="nomMarca"       label={t.application}     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className={thClass}>Sugerencia Prv.</th>
                <th className={thClass}>Nota</th>
                <SortableHeader col="dias"           label="Días"              sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader col="fecCotizacion"  label="Fecha Cot."        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr><td colSpan={12} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td></tr>
              ) : pageData.map((o, i) => (
                <tr key={i} className={`transition-colors ${selected.includes(o) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox" checked={selected.includes(o)} onChange={() => toggleRow(o)} />
                  </td>
                  <td className={tdClass}>
                    <Link className="font-semibold text-primary hover:underline"
                      href={`/admin/revision/quotes?customer=${o.codCliente}&option=quotes&id=${o.nroCotizacion}`}>
                      {o.nroCotizacion}
                    </Link>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${o.creadoPor === 1 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {o.creadoPor === 1 ? 'Cliente' : 'Usuario'}
                    </span>
                  </td>
                  <td className={`${tdClass} font-medium`}>{o.nroParte}</td>
                  <td className={`${tdClass} text-center`}>{o.cantidad}</td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={`${tdClass} text-center`}>{o.nomPais}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.nomMarca}</td>
                  <td className={tdClass}>
                    <select {...register(`sugerPrv.${o.codRegistro}`)}
                      className="h-7 w-full min-w-[130px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">
                      <option value="">—</option>
                      {(o.sugerencias ?? []).map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                    </select>
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`note.${o.codRegistro}`, { onChange: () => setNotesDirty(true) })}
                      className="h-7 w-full min-w-[120px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    {o.dias ?? 0}
                  </td>
                  <td className={`${tdClass} text-gray-400`}>{o.fecCotizacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)}
        showModal={show_modal} title={modal_title} content={modal_content} />
    </div>
  );
};

export default ItemsAssigned;
