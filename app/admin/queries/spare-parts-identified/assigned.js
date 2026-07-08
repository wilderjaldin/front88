'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { Pagination } from '@mantine/core';
import { swalError } from '@/app/lib/swal';

const URL_LIST = 'repuestosporidentificar/ver-asignaciones';

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

const Assigned = ({ t, action_cancel }) => {
  const [records,    setRecords]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [sortCol,    setSortCol]    = useState('nomUsuario');
  const [sortDesc,   setSortDesc]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const lastKeyRef = useRef('');

  const fetchData = useCallback(async (pg, col, desc) => {
    const key = `${pg}|${col}|${desc}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_LIST, {
        params: { page: pg, codUsuFiltro: 0, sortBy: col, sortDesc: desc },
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

  useEffect(() => {
    fetchData(1, 'nomUsuario', false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (col) => {
    const newDesc = sortCol === col ? !sortDesc : false;
    setSortCol(col);
    setSortDesc(newDesc);
    setPage(1);
    lastKeyRef.current = '';
    fetchData(1, col, newDesc);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    lastKeyRef.current = '';
    fetchData(newPage, sortCol, sortDesc);
  };

  return (
    <div className="space-y-4">

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <SortableHeader col="nomUsuario" label={t.user        ?? 'Usuario'}  sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="nomCliente" label={t.customer    ?? 'Cliente'}  sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="nomMarca"   label={t.brand       ?? 'Marca'}    sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} />
                <SortableHeader col="dias"       label={t.days        ?? 'Días'}     sortCol={sortCol} sortDesc={sortDesc} onSort={handleSort} className="text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-gray-100 dark:border-gray-700">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-3 rounded animate-pulse bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                    {t.empty_results ?? 'Sin resultados'}
                  </td>
                </tr>
              ) : records.map((o, i) => (
                <tr key={o.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${tdClass} text-primary`}>{o.nomUsuario}</td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={tdClass}>{o.nomMarca}</td>
                  <td className={`${tdClass} text-center`}>{o.dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>
        {totalPages > 1 && (
          <Pagination total={totalPages} value={page} onChange={handlePageChange} size="sm" radius="xl" />
        )}
        {action_cancel && (
          <button type="button" onClick={action_cancel}
            className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            {t.close ?? 'Cerrar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Assigned;
