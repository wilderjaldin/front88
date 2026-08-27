'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconX from '@/components/icon/icon-x';
import IconPencil from '@/components/icon/icon-pencil';
import IconFile from '@/components/icon/icon-file';
import IconCheck from '@/components/icon/icon-check';
import BtnImprimir from '@/app/admin/document-delivery/BtnImprimir';

const PAGE_SIZE = 50;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const DocumentDeliveryList = ({ t, data = [], loading, onCancel, onForward, onOpenDispatch, onEdit }) => {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageData = useMemo(
    () => data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data, page]
  );

  return (
    <div>
      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-24 text-center`}>{t.actions ?? 'Acciones'}</th>
                <th className={`${thClass} text-center`}>{t.nro_packaging}</th>
                <th className={`${thClass} text-center`}>{t.nro_dispatch}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.transport}</th>
                <th className={thClass}>{t.delivery_address}</th>
                <th className={thClass}>{t.cargo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.loading}</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td></tr>
              ) : pageData.map((o, i) => (
                <tr key={o.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${tdClass} text-center`}>
                    <div className="flex items-center justify-center gap-1">
                      <BtnImprimir
                        t={t}
                        row={o}
                        onOpenDispatch={onOpenDispatch}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/30 transition"
                      />
                      <button
                        type="button"
                        onClick={() => onCancel?.(o)}
                        title={t.cancel_packaging}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition"
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onForward?.(o)}
                        disabled={!o.NumDespacho}
                        title={t.confirm_documentation}
                        className="relative inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 dark:disabled:hover:bg-emerald-900/20"
                      >
                        <IconFile className="h-3.5 w-3.5" />
                        <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-1 ring-white dark:ring-gray-900">
                          <IconCheck className="h-1.5 w-1.5 text-white dark:text-gray-900" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit?.(o)}
                        disabled={!o.NumDespacho}
                        title={t.edit}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-indigo-50 dark:disabled:hover:bg-indigo-900/20"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className={`${tdClass} text-center font-medium`}>{o.NumEmbalaje ? `EM-${o.NumEmbalaje}` : ''}</td>
                  <td className={`${tdClass} text-center`}>{o.NumDespacho ? `DE-${o.NumDespacho}` : ''}</td>
                  <td className={`${tdClass} font-medium`}>
                    <div className="flex items-center gap-2">
                      {o.CodPais && (
                        <img
                          src={`/assets/flags/${o.CodPais.toLowerCase()}.svg`}
                          alt={o.CodPais}
                          className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                        />
                      )}
                      <span>{o.Cliente}</span>
                    </div>
                  </td>
                  <td className={tdClass}>{o.Transporte}</td>
                  <td className={tdClass}>{o.DireccionEntrega}</td>
                  <td className={`${tdClass} text-gray-500 whitespace-pre-line`}>{o.Carga}</td>
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
    </div>
  );
};

export default DocumentDeliveryList;
