'use client';
import React, { useEffect, useState } from 'react';
import { Pagination } from '@mantine/core';
import { customFormat } from '@/app/lib/format';
import SearchFilter from '@/components/SearchFilter';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalConfirm, swalSuccess } from '@/app/lib/swal';

const PAGE_SIZE = 20;
const URL_DESHACER_CAMBIOS = 'ordenescompra/deshacer-cambios';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TableAssigned = ({ t, orders_assigned, unassignOrder, createPurchaseOrder, setReload, onSearch, onClear }) => {

  const [selected,   setSelected]   = useState([]);
  const [page,       setPage]       = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [undoingRow, setUndoingRow] = useState(null);

  useEffect(() => { setSelected([]); setPage(1); }, [orders_assigned]);

  const undoRowChanges = async (o) => {
    const codItems = o.CodItemsConCambios ?? [];
    if (codItems.length === 0) return;

    const result = await swalConfirm(
      t.question_undo_changes ?? '¿Deshacer los cambios de este proveedor?',
      `${o.NomProveedor} — ${codItems.length} ${codItems.length !== 1 ? (t.items ?? 'ítems') : (t.item ?? 'ítem')} (${t.nro_order ?? 'Cotización'} ${o.NroOrden})`,
      { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#dc2626' }
    );
    if (!result.isConfirmed) return;

    setUndoingRow(o);
    try {
      // Un llamado por cada codItem que tenga cambios en esta fila.
      for (const codItem of codItems) {
        await axiosClient.post(URL_DESHACER_CAMBIOS, {
          nroCotizacion:    o.NroOrden,
          codItem,
          nomPrv:           o.NomProveedor,
          cadNroCotizacion: [o.NroOrden],
        });
      }
      setReload?.();
      swalSuccess(t.undo_changes_success ?? 'Cambios revertidos correctamente');
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? (t.undo_changes_error ?? 'No se pudo deshacer el cambio.'), t.close ?? 'Cerrar');
    } finally {
      setUndoingRow(null);
    }
  };

  const totalPages = Math.ceil(orders_assigned.length / PAGE_SIZE);
  const pageData    = orders_assigned.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);

  const unassignOrderTable = async () => {
    setSubmitting(true);
    const res = await unassignOrder(selected);
    setSubmitting(false);
    if (res) setSelected([]);
  };

  const createOrderTable = () => {
    createPurchaseOrder(selected);
    setSelected([]);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.assigned_purchase_orders}
            <span className="ml-2 text-sm font-normal text-gray-400">({orders_assigned.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro server-side */}
        <SearchFilter t={t} onSearch={onSearch} onClear={onClear} />
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          onClick={unassignOrderTable}
          disabled={selected.length === 0 || submitting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-35 disabled:cursor-not-allowed transition dark:bg-red-900/20 dark:text-red-400"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M3 12h18"/>
          </svg>
          {t.remove_from_list}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          onClick={createOrderTable}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          {t.create_purchase_order}
        </button>

        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={pageData.length > 0 && selected.length === pageData.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className={thClass}>{t.supplier}</th>
                <th className={`${thClass} text-center`}>{t.nro_order}</th>
                <th className={`${thClass} text-center`}>Items</th>
                <th className={`${thClass} text-right`}>{t.value}</th>
                <th className={`${thClass} text-center`}>{t.days}</th>
                <th className={thClass}>{t.customer}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, i) => {
                const isChanged = o.TieneDivididos || o.TieneCambioProveedor;
                return (
                <tr
                  key={i}
                  className={`transition-colors ${
                    selected.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox" checked={selected.includes(o)} onChange={() => toggleRow(o)} />
                  </td>
                  <td className={`${tdClass} font-medium`}>
                    <div className="flex items-center gap-2">
                      <div>
                        {o.NomProveedor}
                        {isChanged && (
                          <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                            {[o.TieneDivididos && (t.divided_tag ?? 'Dividido'), o.TieneCambioProveedor && (t.changed_supplier_tag ?? 'Cambio de proveedor')]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                      {isChanged && (
                        <button
                          type="button"
                          disabled={undoingRow === o}
                          onClick={() => undoRowChanges(o)}
                          title={t.undo_changes_row_hint ?? 'Deshace la división/cambio de proveedor de este proveedor puntual'}
                          className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5"/>
                          </svg>
                          {undoingRow === o ? (t.saving ?? 'Deshaciendo…') : (t.undo_changes ?? 'Deshacer Cambios')}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={`${tdClass} text-center`}>{o.NroOrden}</td>
                  <td className={`${tdClass} text-center`}>{o.NroItems}</td>
                  <td className={`${tdClass} text-right`}>{customFormat(o.Monto)}</td>
                  <td className={`${tdClass} text-center`}>{o.Dias}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.NomCliente}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}
    </div>
  )
}

export default TableAssigned;
