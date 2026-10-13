'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsSuperAdmin } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess, swalConfirm } from '@/app/lib/swal';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { useTranslation } from '@/app/locales';
import { Pagination } from '@mantine/core';
import AccessDenied from '@/components/AccessDenied';
import Modal from '@/components/modal';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrash from '@/components/icon/icon-trash';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import BrandFormModal from './BrandForm';

const URL_LIST   = 'marcas/listar';
const URL_DELETE = 'marcas/eliminar';
const PAGE_SIZE  = 20;

// El menú se saca del flujo normal con un portal a <body> — si no, el z-index
// local de la tabla (thead sticky) lo tapa aunque el <Select> esté "por encima" en el DOM.
const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const EstadoBadge = ({ codEstado, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEstado === 'AC'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    }`}>
    {codEstado === 'AC' ? t.active : t.inactive}
  </span>
);

const ESTADO_OPTIONS = (t) => [
  { value: 'AC',  label: t.active   ?? 'Activos' },
  { value: 'IN',  label: t.inactive ?? 'Inactivos' },
  { value: 'ALL', label: t.all      ?? 'Todos' },
];

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function BrandsPage() {
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const t            = useTranslation();
  const router       = useRouter();
  const searchParams = useSearchParams();
  useDynamicTitle(`${t.brands ?? 'Marcas'} | ${t.admin ?? 'Administración'}`);

  // ── Parámetros actuales de la URL — fuente de verdad, igual que en clientes ──
  const currentPage   = Number(searchParams.get('page')) || 1;
  const currentTerm   = searchParams.get('term')   || '';
  const currentEstado = searchParams.get('estado') || 'AC'; // 'AC' | 'IN' | 'ALL'

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null = cerrado, {} = nueva, {...} = editar
  const [saving,  setSaving]  = useState(false);

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = ({ page = 1, term = currentTerm, estado = currentEstado }) => {
    const params = new URLSearchParams();
    if (page > 1)                  params.set('page', page);
    if (term)                      params.set('term', term.trim());
    if (estado && estado !== 'AC') params.set('estado', estado);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, pageSize: PAGE_SIZE, term: currentTerm, codEstado: currentEstado === 'ALL' ? '' : currentEstado };
      const rs = await axiosClient.get(URL_LIST, { params });
      setRows(rs.data?.data ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {
      swalError(t.error ?? 'Error', t.could_not_load_brands ?? 'No se pudieron cargar las marcas');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentTerm, currentEstado]);

  useEffect(() => { if (isSuperAdmin) fetchBrands(); }, [isSuperAdmin, fetchBrands]);

  const handleSearch      = (term) => pushFilters({ page: 1, term });
  const handleClearSearch = () => pushFilters({ page: 1, term: '' });
  const handleSelectEstado = (estado) => pushFilters({ page: 1, estado });
  const handleClear = () => pushFilters({ page: 1, term: '', estado: 'AC' });
  const handlePageChange = (p) => pushFilters({ page: p });

  const openCreate = () => setEditing({});
  const openEdit   = (row) => setEditing(row);
  const closeForm  = () => setEditing(null);

  const handleSaved = () => {
    closeForm();
    fetchBrands();
  };

  // Desactivar (baja lógica) — DELETE. Reactivar — PUT editar con codEstado AC.
  const handleToggleStatus = (row) => {
    const activating = row.codEstado !== 'AC';
    swalConfirm(
      activating ? (t.question_activate_brand ?? '¿Activar esta marca?') : (t.question_deactivate_brand ?? '¿Desactivar esta marca?'),
      row.nomMarca,
      { confirmText: activating ? (t.yes_activate ?? 'Sí, activar') : (t.yes_deactivate ?? 'Sí, desactivar'), cancelText: t.btn_cancel, confirmColor: activating ? '#16a34a' : '#dc2626' }
    ).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        if (activating) {
          await axiosClient.put('marcas/editar', { codMarca: row.codMarca, nomMarca: row.nomMarca, codEstado: 'AC' });
        } else {
          await axiosClient.delete(`${URL_DELETE}/${row.codMarca}`);
        }
        setRows((prev) => prev.map((r) => r.codMarca === row.codMarca ? { ...r, codEstado: activating ? 'AC' : 'IN' } : r));
        swalSuccess(activating ? (t.brand_activated ?? 'Marca activada') : (t.brand_deactivated ?? 'Marca desactivada'));
      } catch (err) {
        swalError(t.error ?? 'Error', err?.response?.data?.message ?? t.error, t.close);
      }
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!isSuperAdmin) return <AccessDenied />;

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">{t.admin ?? 'Administración'}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          {t.brands ?? 'Marcas'}
        </li>
      </ul>

      {/* Título + acciones de página */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.brands ?? 'Marcas'} <span className="font-normal text-gray-400">({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
        >
          <IconPlus className="h-4 w-4" />
          {t.new_brand ?? 'Nueva Marca'}
        </button>
      </div>

      {/* Barra de filtros — mismo patrón que clientes/proveedores/representantes */}
      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3 ml-auto">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
            <Select isClearable={false} options={ESTADO_OPTIONS(t)}
              value={ESTADO_OPTIONS(t).find(o => o.value === currentEstado) ?? null}
              onChange={opt => handleSelectEstado(opt.value)}
              menuPortalTarget={portalTarget}
              styles={{ control: (b) => ({ ...b, minWidth: '140px', width: '140px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
            />
          </div>

          <SearchFilter t={t} value={currentTerm} onSearch={handleSearch} onClear={handleClearSearch}
            placeholder={t.brand_search_ph ?? 'Buscar marca...'} className="w-64" />
          <button type="button" onClick={handleClear}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t.btn_clear ?? 'Limpiar'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel mt-3 overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            {t.no_records ?? 'Sin resultados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={`${thClass} w-[70px]`}></th>
                    <th className={thClass}>{t.brand_name ?? 'Marca'}</th>
                    <th className={`${thClass} text-center`}>{t.spare_parts ?? 'Repuestos'}</th>
                    <th className={thClass}>{t.status}</th>
                    <th className={thClass}>{t.registered_on ?? 'Registrada'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((row) => (
                    <tr key={row.codMarca} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className={`${tdClass} px-2`}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => openEdit(row)}
                            title={t.edit ?? 'Editar'}
                          >
                            <IconPencil className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleToggleStatus(row)}
                            title={row.codEstado === 'AC' ? (t.delete ?? 'Eliminar') : (t.activate ?? 'Activar')}
                          >
                            {row.codEstado === 'AC'
                              ? <IconTrash className="w-4 h-4 text-red-500" />
                              : <IconToggleOn className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </td>
                      <td className={`${tdClass} font-medium text-gray-800 dark:text-gray-100`}>{row.nomMarca}</td>
                      <td className={`${tdClass} text-center`}>{row.cantRepuestos}</td>
                      <td className={tdClass}><EstadoBadge codEstado={row.codEstado} t={t} /></td>
                      <td className={`${tdClass} text-gray-400`}>{formatDate(row.fecRegistra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
                <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} size="sm" radius="xl" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        size="w-full max-w-md"
        showModal={editing !== null}
        closeModal={closeForm}
        title={editing?.codMarca ? (t.edit_brand ?? 'Editar Marca') : (t.new_brand ?? 'Nueva Marca')}
      >
        {editing !== null && (
          <BrandFormModal
            marca={editing.codMarca ? editing : null}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </div>
  );
}
