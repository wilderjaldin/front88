'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import { Pagination } from '@mantine/core';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';

const PAGE_SIZE = 20;
const MIN_SEARCH_CHARS = 4;

const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2 whitespace-nowrap";

const ESTADO_OPTIONS = (t) => [
  { value: 'AC',  label: t.active   ?? 'Activos' },
  { value: 'IN',  label: t.inactive ?? 'Inactivos' },
  { value: 'ALL', label: t.all      ?? 'Todos' },
];

const EstadoBadge = ({ codEstado, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEstado === 'AC'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    }`}>
    {codEstado === 'AC' ? (t.active ?? 'Activo') : (t.inactive ?? 'Inactivo')}
  </span>
);

// Catálogo normal (genartme) ligado al proveedor vía Repuesto.CodPrv.
export default function Spares() {
  const { proveedor } = useSupplier();
  const t = useTranslation();

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [term,    setTerm]    = useState('');
  const [estado,  setEstado]  = useState('AC');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  // No se carga nada hasta que el usuario busque algo explícitamente — puede
  // haber repuestos para este proveedor aunque todavía no se vean, así que el
  // estado inicial no puede confundirse con "no tiene repuestos".
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSpares = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE, term };
      if (estado !== 'ALL') params.codEstado = estado;
      const rs = await axiosClient.get(`proveedores/${proveedor.codPrv}/repuestos`, { params });
      setRows(rs.data?.data ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSearched) return;
    fetchSpares();
  }, [page, term, estado, hasSearched]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {t.spare_parts ?? 'Repuestos'} <span className="font-normal text-gray-400">({total})</span>
        </h2>

        {/* Columna: fila de filtros + una línea fija reservada para el error
            de búsqueda (siempre ocupa espacio, así nunca se superpone con la
            tabla ni desacomoda el resto cuando aparece/desaparece). */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
              <Select isClearable={false} options={ESTADO_OPTIONS(t)}
                value={ESTADO_OPTIONS(t).find(o => o.value === estado) ?? null}
                onChange={opt => { setPage(1); setEstado(opt.value); setHasSearched(true); }}
                menuPortalTarget={portalTarget}
                styles={{ control: (b) => ({ ...b, minWidth: '130px', width: '130px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs px-1 invisible select-none">{t.status}</span>
              <SearchFilter t={t} value={term}
                onSearch={(v) => {
                  const trimmed = v.trim();
                  if (trimmed.length > 0 && trimmed.length < MIN_SEARCH_CHARS) {
                    setSearchError((t.type_n_chars_search ?? 'Ingresa {n} caracteres para buscar').replace('{n}', MIN_SEARCH_CHARS));
                    return;
                  }
                  setSearchError('');
                  setPage(1);
                  setTerm(trimmed);
                  setHasSearched(true);
                }}
                onClear={() => { setSearchError(''); setPage(1); setTerm(''); setHasSearched(true); }}
                placeholder={t.nro_part_ph ?? 'Nro. Parte...'} className="w-56" />
            </div>
          </div>
          <span className="h-4 text-[11px] text-red-500 px-1">{searchError}</span>
        </div>
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !hasSearched ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            {t.search_to_see_results ?? 'Realiza una búsqueda para ver los repuestos de este proveedor'}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            {t.no_records ?? 'Sin registros'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                    <th className={thClass}>{t.description ?? 'Descripción'}</th>
                    <th className={thClass}>{t.brand ?? 'Marca'}</th>
                    <th className={thClass}>{t.application ?? 'Aplicación'}</th>
                    <th className={`${thClass} text-right`}>{t.cost ?? 'Costo'}</th>
                    <th className={thClass}>{t.status}</th>
                    <th className={thClass}>{t.registered_on ?? 'Registrado'}</th>
                    <th className={thClass}>{t.modified_on ?? 'Modificado'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((r) => (
                    <tr key={r.codRepuesto} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className={`${tdClass} font-medium`}>
                        <Link href={`/admin/register/spares/${r.codRepuesto}`} className="text-primary hover:underline">
                          {r.nroParte}
                        </Link>
                      </td>
                      <td className={tdClass}>
                        <span className="block truncate max-w-[220px]" title={r.desRepuesto}>{r.desRepuesto}</span>
                      </td>
                      <td className={tdClass}>{r.marca || '—'}</td>
                      <td className={tdClass}>{r.aplicacion || '—'}</td>
                      <td className={`${tdClass} text-right`}>{r.costo ?? '—'}</td>
                      <td className={tdClass}><EstadoBadge codEstado={r.codEstado} t={t} /></td>
                      <td className={`${tdClass} text-gray-400`}>{r.fecRegistra}</td>
                      <td className={`${tdClass} text-gray-400`}>{r.fecModifica}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
                <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
