'use client';
import { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Pagination } from '@mantine/core';
import { useForm } from 'react-hook-form';

import IconPencil     from '@/components/icon/icon-pencil';
import IconListCheck  from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSearch     from '@/components/icon/icon-search';
import IconBackSpace  from '@/components/icon/icon-backspace';
import IconPlus       from '@/components/icon/icon-plus';

import { useDevice } from '@/context/device-context';

const DatatablesSparesSite = ({
  data           = [],
  t,
  page,
  pageSize,
  total,
  currentFilters = {},
  onPageChange,
  handleSearch,
  handleClear,
  handleNew,
  handleEdit,
}) => {
  const { isMobile }    = useDevice();
  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  const { register, reset, handleSubmit } = useForm({
    defaultValues: { term: currentFilters.term ?? '' },
  });

  // Sync form cuando la URL cambia externamente (ej: botón atrás del browser)
  useEffect(() => {
    reset({ term: currentFilters.term ?? '' });
  }, [currentFilters.term]);

  return (
    <div>
      {/* ── HEADER + CONTROLES ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Repuestos Site <span>({total})</span>
          </h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center justify-end gap-3">

          {/* Toggle list / grid */}
          <div className="flex h-10 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center transition
                ${view === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('list')}
            >
              <IconListCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center transition
                ${view === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('grid')}
            >
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Form búsqueda */}
          <form onSubmit={handleSubmit(handleSearch)} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.filter ?? 'Filtrar'}
              {...register('term')}
              className="h-10 w-64 rounded-lg border border-gray-300 dark:border-gray-700
                         bg-white dark:bg-gray-900 px-4 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <button
              type="submit"
              className="flex h-10 px-3 items-center gap-2 rounded-lg
                         bg-primary/20 text-primary hover:bg-primary/40 transition text-sm"
            >
              <IconSearch className="h-4 w-4" />
              {t.search ?? 'Buscar'}
            </button>

            <button
              type="button"
              onClick={() => { reset({ term: '' }); handleClear(); }}
              className="flex h-10 px-3 items-center gap-2 rounded-lg
                         bg-gray-200 text-gray-700 hover:bg-gray-300 transition
                         dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-sm"
            >
              <IconBackSpace className="h-4 w-4" />
              {t.btn_clear ?? 'Limpiar'}
            </button>
          </form>

          {/* Separador */}
          <div className="h-10 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Nuevo */}
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2
                       text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition group"
          >
            <IconPlus className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
            {t.btn_add_spare_parts ?? 'Agregar nuevo repuesto'}
          </button>

        </div>
      </div>

      {/* ── VISTA LIST ─────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="datatables">
            <DataTable
              className="table-hover whitespace-nowrap"
              records={data}
              columns={[
                {
                  accessor: 'id',
                  title: '',
                  render: (s) => (
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      onClick={() => handleEdit(s)}
                      title={t.btn_edit ?? 'Editar'}
                    >
                      <IconPencil className="w-4 h-4 text-blue-500" />
                    </button>
                  ),
                },
                {
                  accessor: 'nroParte',
                  title: t.nro_part ?? 'Nro. Parte',
                  sortable: false,
                },
                {
                  accessor: 'desRepuesto',
                  title: t.description ?? 'Descripción',
                  sortable: false,
                },
                {
                  accessor: 'aplicacion',
                  title: t.application ?? 'Aplicación',
                  sortable: false,
                  render: (s) => s.aplicacion || '—',
                },
                {
                  accessor: 'categoria',
                  title: t.category ?? 'Categoría',
                  sortable: false,
                  render: (s) => s.categoria || '—',
                },
                {
                  accessor: 'hCode',
                  title: 'H Code',
                  sortable: false,
                  render: (s) => s.hCode?.trim() || '—',
                },
                {
                  accessor: 'peso',
                  title: `${t.weight ?? 'Peso'} (lb)`,
                  sortable: false,
                  render: (s) => (s.peso ?? 0).toFixed(2),
                },
                {
                  accessor: 'largo',
                  title: t.long ?? 'Largo',
                  sortable: false,
                  render: (s) => (s.largo ?? 0).toFixed(2),
                },
                {
                  accessor: 'ancho',
                  title: t.width ?? 'Ancho',
                  sortable: false,
                  render: (s) => (s.ancho ?? 0).toFixed(2),
                },
                {
                  accessor: 'alto',
                  title: t.height ?? 'Alto',
                  sortable: false,
                  render: (s) => (s.alto ?? 0).toFixed(2),
                },
                {
                  accessor: 'blnSeo',
                  title: 'SEO',
                  sortable: false,
                  render: (s) =>
                    s.blnSeo
                      ? <span className="badge bg-success">{t.yes ?? 'SI'}</span>
                      : <span className="badge bg-dark">{t.no ?? 'NO'}</span>,
                },
                {
                  accessor: 'fecModifica',
                  title: t.date ?? 'Fecha',
                  sortable: false,
                  render: (s) => (
                    <div className="text-xs leading-tight">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registrado</span>
                          <span className="text-gray-500">{s.fecRegistra}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{s.usuarioRegistra}</div>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">Modificado</span>
                          <span className="text-gray-500">{s.fecModifica}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{s.usuarioModifica}</div>
                      </div>
                    </div>
                  ),
                },
              ]}
              highlightOnHover
              page={page}
              onPageChange={onPageChange}
              totalRecords={total}
              recordsPerPage={pageSize}
              paginationText={({ from, to, totalRecords }) => `${from} - ${to} / ${totalRecords}`}
            />
          </div>
        </div>
      )}

      {/* ── VISTA GRID ─────────────────────────────────────────────────────── */}
      {view === 'grid' && (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.map((s, index) => (
              <div
                key={index}
                className="group relative rounded-2xl
                           bg-white dark:bg-gray-900
                           border border-gray-200 dark:border-gray-700
                           shadow-sm hover:shadow-lg hover:-translate-y-0.5
                           transition-all duration-200 overflow-hidden"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 font-mono truncate max-w-[70%]">
                    {s.nroParte}
                  </h3>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    onClick={() => handleEdit(s)}
                    title={t.btn_edit ?? 'Editar'}
                  >
                    <IconPencil className="w-4 h-4 text-blue-500" />
                  </button>
                </div>

                {/* DESCRIPCIÓN */}
                <div className="px-4 pt-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {s.desRepuesto || '—'}
                  </p>
                </div>

                {/* INFO */}
                <div className="px-4 py-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.application ?? 'Aplicación'}</span>
                    <span className="font-medium">{s.aplicacion || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.category ?? 'Categoría'}</span>
                    <span className="font-medium">{s.categoria || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">H Code</span>
                    <span className="font-medium">{s.hCode?.trim() || '—'}</span>
                  </div>
                </div>

                {/* DATOS NUMÉRICOS */}
                <div className="grid grid-cols-4 text-center border-t border-gray-100 dark:border-gray-700 py-3 text-xs">
                  <div>
                    <div className="text-gray-400">{t.weight ?? 'Peso'}</div>
                    <div className="font-semibold">{(s.peso ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t.long ?? 'Largo'}</div>
                    <div className="font-semibold">{(s.largo ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t.width ?? 'Ancho'}</div>
                    <div className="font-semibold">{(s.ancho ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t.height ?? 'Alto'}</div>
                    <div className="font-semibold">{(s.alto ?? 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* SEO */}
                <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  {s.blnSeo ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      SEO ✓
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800">
                      Sin SEO
                    </span>
                  )}
                </div>

                {/* FOOTER auditoría */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span>Reg: {s.usuarioRegistra || '—'}</span>
                    <span>{s.fecRegistra}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mod: {s.usuarioModifica || '—'}</span>
                    <span>{s.fecModifica}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={Math.ceil(total / pageSize)}
                value={page}
                onChange={onPageChange}
                size="sm"
                radius="xl"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DatatablesSparesSite;