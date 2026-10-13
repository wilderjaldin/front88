'use client';
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import { Pagination } from '@mantine/core';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';

const PAGE_SIZE = 20;

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
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchSpares(); }, [page, term, estado]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {t.spare_parts ?? 'Repuestos'} <span className="font-normal text-gray-400">({total})</span>
        </h2>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
            <Select isClearable={false} options={ESTADO_OPTIONS(t)}
              value={ESTADO_OPTIONS(t).find(o => o.value === estado) ?? null}
              onChange={opt => { setPage(1); setEstado(opt.value); }}
              menuPortalTarget={portalTarget}
              styles={{ control: (b) => ({ ...b, minWidth: '130px', width: '130px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
            />
          </div>
          <SearchFilter t={t} value={term}
            onSearch={(v) => { setPage(1); setTerm(v); }}
            onClear={() => { setPage(1); setTerm(''); }}
            placeholder={t.nro_part_ph ?? 'Nro. Parte...'} className="w-56" />
        </div>
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                      <td className={`${tdClass} font-medium text-gray-800 dark:text-gray-100`}>{r.nroParte}</td>
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
