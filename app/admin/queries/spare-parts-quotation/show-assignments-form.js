'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { Pagination } from '@mantine/core';
import { swalError, swalSuccess } from '@/app/lib/swal';

const URL_CONTROLES = 'repuestosporcotizar/asignaciones-controles';
const URL_LIST      = 'repuestosporcotizar/ver-asignaciones';
const URL_REMOVE    = 'repuestosporcotizar/quitar-asignacion';
const URL_CHANGE    = 'repuestosporcotizar/modificar-asignacion';

const PAGE_SIZE = 10;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const SortIcon = ({ active, desc }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z"/><path d="M3.5 11L0 6.5H7L3.5 11Z"/>
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {!desc ? <path d="M3.5 0L7 7H0L3.5 0Z"/> : <path d="M3.5 7L0 0H7L3.5 7Z"/>}
    </svg>
  );
};

const SortableHeader = ({ col, label, sortCol, sortDesc, onSort, className = '' }) => (
  <th onClick={() => onSort(col)}
    className={`${thClass} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}>
    <span className="inline-flex items-center gap-1.5">
      {label}<SortIcon active={sortCol === col} desc={sortDesc} />
    </span>
  </th>
);

const filterOpts = {
  filterOption:     (opt, input) => input.length < 2 ? false : opt.label.toLowerCase().includes(input.toLowerCase()),
  noOptionsMessage: ({ inputValue }) => inputValue.length < 2 ? 'Ingrese al menos 2 caracteres' : 'Sin resultados',
};

const ShowAssignmentsForm = ({ t, action_cancel }) => {
  const [records,       setRecords]       = useState([]);
  const [usuarios,      setUsuarios]      = useState([]);
  const [marcas,        setMarcas]        = useState([]);
  const [total,         setTotal]         = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [page,          setPage]          = useState(1);
  const [sortCol,       setSortCol]       = useState('nroCotizacion');
  const [sortDesc,      setSortDesc]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [activeFilters, setActiveFilters] = useState({ usuario: null, marca: null });

  const lastKeyRef = useRef('');

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: { usuario: null, marca: null },
  });

  const watchedUsuario = watch('usuario');

  // controles: una sola llamada al montar
  useEffect(() => {
    axiosClient.get(URL_CONTROLES)
      .then(rs => {
        setUsuarios((rs.data.usuarios ?? []).filter(u => u.value !== '0'));
        setMarcas((rs.data.marcas   ?? []).filter(m => m.value !== '0'));
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async (filters, pg, col, desc) => {
    const key = `${pg}|${col}|${desc}|${filters.usuario?.value ?? '0'}|${filters.marca?.value ?? '0'}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLoading(true);
    setSelectedItems([]);
    try {
      const rs = await axiosClient.get(URL_LIST, {
        params: {
          page:       pg,
          codUsuario: filters.usuario?.value ?? 0,
          codMarca:   filters.marca?.value   ?? 0,
          sortBy:     col,
          sortDesc:   desc,
        },
      });
      setRecords((rs.data.data ?? []).map((o, i) => ({ ...o, id: i })));
      setTotal(rs.data.totalRegistros ?? 0);
      setTotalPages(rs.data.totalPaginas ?? 1);
    } catch {
      swalError('Error', 'No se pudo cargar las asignaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  // carga inicial de datos
  useEffect(() => {
    fetchData({ usuario: null, marca: null }, 1, 'nroCotizacion', false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBuscar = (data) => {
    const filters = { usuario: data.usuario, marca: data.marca };
    setActiveFilters(filters);
    setPage(1);
    setSortCol('nroCotizacion');
    setSortDesc(false);
    lastKeyRef.current = '';
    fetchData(filters, 1, 'nroCotizacion', false);
  };

  const onLimpiar = () => {
    reset({ usuario: null, marca: null });
    const filters = { usuario: null, marca: null };
    setActiveFilters(filters);
    setPage(1);
    setSortCol('nroCotizacion');
    setSortDesc(false);
    lastKeyRef.current = '';
    fetchData(filters, 1, 'nroCotizacion', false);
  };

  const handleSort = (col) => {
    const newDesc = sortCol === col ? !sortDesc : false;
    setSortCol(col);
    setSortDesc(newDesc);
    setPage(1);
    lastKeyRef.current = '';
    fetchData(activeFilters, 1, col, newDesc);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    lastKeyRef.current = '';
    fetchData(activeFilters, newPage, sortCol, sortDesc);
  };

  const toggleRow = (row) =>
    setSelectedItems(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const toggleAll = () =>
    setSelectedItems(selectedItems.length === records.length ? [] : [...records]);

  const removeAssignment = async () => {
    if (selectedItems.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const payload = selectedItems.map(item => item.codRegistro);
      await axiosClient.post(URL_REMOVE, payload);
      swalSuccess(t.remove_assignment_success ?? 'Asignación eliminada');
      lastKeyRef.current = '';
      fetchData(activeFilters, page, sortCol, sortDesc);
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? (t.remove_assignment_error ?? 'No se pudo quitar la asignación.'));
    } finally {
      setSubmitting(false);
    }
  };

  const changeUser = async () => {
    if (selectedItems.length === 0 || !watchedUsuario || submitting) return;
    setSubmitting(true);
    try {
      await axiosClient.post(URL_CHANGE, {
        codUsuario:   Number(watchedUsuario.value),
        codRegistros: selectedItems.map(item => item.codRegistro),
      });
      swalSuccess(t.change_user_success ?? 'Usuario actualizado');
      lastKeyRef.current = '';
      fetchData(activeFilters, page, sortCol, sortDesc);
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? (t.change_user_error ?? 'No se pudo cambiar el usuario.'));
    } finally {
      setSubmitting(false);
    }
  };

  const noSel        = selectedItems.length === 0 || submitting;
  const noChangeUser = noSel || !watchedUsuario;

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <form onSubmit={handleSubmit(onBuscar)}>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">

            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                {t.user ?? 'Usuario'}
              </label>
              <Controller name="usuario" control={control}
                render={({ field }) => (
                  <Select {...field} isClearable options={usuarios}
                    placeholder="Seleccionar..." />
                )} />
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                {t.application ?? 'Aplicación'}
              </label>
              <Controller name="marca" control={control}
                render={({ field }) => (
                  <Select {...field} isClearable options={marcas}
                    placeholder="Seleccionar..." {...filterOpts} />
                )} />
            </div>

            <div className="flex items-center gap-2 pb-0.5">
              <button type="submit"
                className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition whitespace-nowrap">
                Buscar
              </button>
              <button type="button" onClick={onLimpiar}
                className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition whitespace-nowrap">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Acciones sobre selección */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={removeAssignment} disabled={noSel}
          className={`h-9 px-3 rounded-lg text-sm font-medium transition ${noSel ? 'border border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>
          {t.remove_assignment ?? 'Quitar Asignación'}
        </button>
        <button type="button" onClick={changeUser} disabled={noChangeUser}
          className={`h-9 px-3 rounded-lg text-sm font-medium transition ${noChangeUser ? 'border border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'bg-primary text-white hover:bg-primary/90'}`}>
          {t.change_user ?? 'Cambiar Usuario'}
        </button>
        {selectedItems.length > 0 && (
          <span className="text-xs font-medium text-primary ml-1">
            {selectedItems.length} seleccionado{selectedItems.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <input type="checkbox" className="form-checkbox"
                    checked={records.length > 0 && selectedItems.length === records.length}
                    onChange={toggleAll} />
                </th>
                <SortableHeader col="nroCotizacion" label={t.nro_order   ?? 'Nro. Orden'}   sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="nroParte"      label={t.nro_part    ?? 'Nro. Parte'}    sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="aplicacion"    label={t.application ?? 'Aplicación'}    sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="cantidad"      label={t.amount      ?? 'Cantidad'}      sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} className="text-center" />
                <SortableHeader col="cliente"       label={t.customer    ?? 'Cliente'}       sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="usuario"       label={t.user        ?? 'Usuario'}       sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="dias"          label={t.days        ?? 'Días'}          sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} className="text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <>
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-gray-100 dark:border-gray-700">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-3 py-2">
                          <div className="h-3 rounded animate-pulse bg-gray-100 dark:bg-gray-700" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : records.length === 0 ? (
                <>
                  <tr><td colSpan={8} className="py-4 text-center text-sm text-gray-400">{t.empty_results ?? 'Sin resultados'}</td></tr>
                  {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-t border-gray-50 dark:border-gray-800">
                      <td colSpan={8} className="py-[13px]" />
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {records.map((o, i) => (
                    <tr key={o.id ?? i}
                      className={`transition-colors ${selectedItems.includes(o) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                      <td className={`${tdClass} text-center`}>
                        <input type="checkbox" className="form-checkbox"
                          checked={selectedItems.includes(o)} onChange={() => toggleRow(o)} />
                      </td>
                      <td className={`${tdClass} font-semibold text-primary`}>{o.nroCotizacion}</td>
                      <td className={`${tdClass} font-medium`}>{o.nroParte}</td>
                      <td className={tdClass}>{o.aplicacion}</td>
                      <td className={`${tdClass} text-center`}>{o.cantidad}</td>
                      <td className={tdClass}>{o.nomCliente}</td>
                      <td className={`${tdClass} text-primary`}>{o.nomUsuario}</td>
                      <td className={`${tdClass} text-center`}>{o.dias}</td>
                    </tr>
                  ))}
                  {Array.from({ length: PAGE_SIZE - records.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-t border-gray-50 dark:border-gray-800">
                      <td colSpan={8} className="py-[13px]" />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación + Cerrar */}
      <div className="flex items-center justify-between">
        {totalPages > 1 ? (
          <Pagination total={totalPages} value={page} onChange={handlePageChange} size="sm" radius="xl" />
        ) : <div />}
        <button type="button" onClick={action_cancel}
          className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          {t.close ?? 'Cerrar'}
        </button>
      </div>
    </div>
  );
};

export default ShowAssignmentsForm;
