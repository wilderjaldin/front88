'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import Swal from 'sweetalert2';
import axios from 'axios';
import { swalSuccess, swalError } from '@/app/lib/swal';
import IconBackSpace from '@/components/icon/icon-backspace';
import IconArrowDown from '@/components/icon/icon-arrow-down';

// Contrato legacy (ValToken) sin confirmar todavía para modernizar — se deja intacto,
// solo se refresca el listado real (embalaje/listar) después de un cancel exitoso.
const url_cancel_reception = process.env.NEXT_PUBLIC_API_URL + 'embalaje/AnularRecepcion';

const PAGE_SIZE = 50;

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2 py-1.5";

const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z" />
        <path d="M3.5 11L0 6.5H7L3.5 11Z" />
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc'
        ? <path d="M3.5 0L7 7H0L3.5 0Z" />
        : <path d="M3.5 7L0 0H7L3.5 7Z" />
      }
    </svg>
  );
};

const SortableHeader = ({ col, label, sort, dir, onSort, className = '' }) => (
  <th
    onClick={() => onSort(col)}
    className={`${thClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
  >
    <span className="inline-flex items-center gap-1.5">
      {label}
      <SortIcon active={sort === col} dir={dir} />
    </span>
  </th>
);

const Pendings = ({ t, token, data = [], attachOrder, onRefresh }) => {

  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('NroOrden');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => { setPage(1); }, [filter]);

  const filteredData = useMemo(() => {
    const f = filter.trim().toLowerCase();
    let list = !f ? data : data.filter(o =>
      String(o.NroOrden ?? '').toLowerCase().includes(f) ||
      String(o.NroOrdenCompra ?? '').toLowerCase().includes(f) ||
      String(o.NomCliente ?? '').toLowerCase().includes(f) ||
      String(o.NroRecepcion ?? '').toLowerCase().includes(f) ||
      String(o.DirEntrega ?? '').toLowerCase().includes(f)
    );

    list = [...list].sort((a, b) => {
      const av = a[sortColumn] ?? '';
      const bv = b[sortColumn] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [data, filter, sortColumn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
  };

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);

  const handleCancelReception = async () => {
    const result = await Swal.fire({
      title: t.question_cancel_the_order_reception,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.close,
      reverseButtons: true
    });
    if (!result.isConfirmed) return;

    setCanceling(true);
    try {
      const data_send = selected.map(o => ({ NroRecepcion: o.NroRecepcion, ValToken: token }));
      const rs = await axios.post(url_cancel_reception, data_send);
      if (rs.data.estado === 'Ok') {
        setSelected([]);
        await onRefresh?.();
        swalSuccess(t.the_order_reception_was_cancel);
      } else {
        swalError(t.error, t.error, t.close);
      }
    } catch (error) {
      swalError(t.error, t.error, t.close);
    }
    setCanceling(false);
  };

  const handleAttach = async () => {
    setSubmitting(true);
    await attachOrder(selected);
    setSelected([]);
    setSubmitting(false);
  };

  return (
    <div>
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={handleAttach}
          disabled={selected.length === 0 || submitting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.attach_order}
          <IconArrowDown className="w-3.5 h-3.5 rotate-90" />
        </button>

        <button
          type="button"
          onClick={handleCancelReception}
          disabled={selected.length === 0 || canceling}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-35 disabled:cursor-not-allowed transition dark:bg-red-900/20 dark:text-red-400"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t.cancel_reception}
        </button>

        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <input
              type="text"
              className="form-input w-full h-8 text-xs pe-9"
              placeholder={t.filter}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <div className="absolute inset-y-0 end-0 flex items-center pe-2.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setFilter('')}>
                <IconBackSpace className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${thClass} w-10 text-center`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-[16px] w-[16px]"
                    checked={pageData.length > 0 && selected.length === pageData.length}
                    onChange={toggleAll}
                  />
                </th>
                <SortableHeader col="NroOrden"        label={t.nro_order}          sort={sortColumn} dir={sortDir} onSort={handleSort} />
                <SortableHeader col="NroOrdenCompra"   label={t.nro_purchase_order} sort={sortColumn} dir={sortDir} onSort={handleSort} />
                <SortableHeader col="NomCliente"       label={t.customer}           sort={sortColumn} dir={sortDir} onSort={handleSort} />
                <SortableHeader col="NroRecepcion"     label={t.nro_reception}      sort={sortColumn} dir={sortDir} onSort={handleSort} />
                <SortableHeader col="DirEntrega"       label={t.delivery_address}   sort={sortColumn} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : pageData.map((o, index) => (
                <tr
                  key={o.id ?? index}
                  onClick={() => toggleRow(o)}
                  className={`cursor-pointer transition-colors ${
                    selected.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="form-checkbox h-[16px] w-[16px]"
                      checked={selected.includes(o)}
                      onChange={() => toggleRow(o)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>{o.NroOrden}</td>
                  <td className={tdClass}>{o.NroOrdenCompra}</td>
                  <td className={tdClass}>{o.NomCliente}</td>
                  <td className={tdClass}>{o.NroRecepcion}</td>
                  <td className={tdClass}>{o.DirEntrega}</td>
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

export default Pendings;
