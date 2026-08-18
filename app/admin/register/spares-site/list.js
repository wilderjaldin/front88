'use client';
import { useState } from 'react';
import { Pagination } from '@mantine/core';
import SearchFilter from '@/components/SearchFilter';

import IconPencil     from '@/components/icon/icon-pencil';
import IconListCheck  from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconPlus       from '@/components/icon/icon-plus';

import { useDevice } from '@/context/device-context';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2 whitespace-nowrap";

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

  return (
    <div>
      {/* ── Título + acciones + filtro, todo en una fila ─────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Repuestos Site <span className="font-normal text-gray-400">({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle list / grid */}
          <div className="flex h-9 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              type="button"
              className={`flex h-9 w-9 items-center justify-center transition
                ${view === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('list')}
            >
              <IconListCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`flex h-9 w-9 items-center justify-center transition
                ${view === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('grid')}
            >
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Filtro simple: solo texto, sin otras opciones — mismo componente
              compacto que se usa en recepción de compra. */}
          <SearchFilter
            t={t}
            value={currentFilters.term}
            onSearch={(term) => handleSearch({ term })}
            onClear={handleClear}
            placeholder={t.filter ?? 'Filtrar'}
            className="w-64"
          />

          <button
            type="button"
            onClick={handleNew}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-white text-xs font-medium shadow-sm hover:bg-primary/90 transition"
          >
            <IconPlus className="h-3.5 w-3.5" />
            {t.btn_add_spare_parts ?? 'Agregar nuevo repuesto'}
          </button>
        </div>
      </div>

      {/* ── VISTA LIST ─────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={`${thClass} w-[50px]`}></th>
                  <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                  <th className={thClass}>{t.description ?? 'Descripción'}</th>
                  <th className={thClass}>{t.application ?? 'Aplicación'}</th>
                  <th className={thClass}>{t.category ?? 'Categoría'}</th>
                  <th className={thClass}>H Code</th>
                  <th className={`${thClass} text-right`}>{t.weight ?? 'Peso'} (lb)</th>
                  <th className={`${thClass} text-right`}>{t.long ?? 'Largo'}</th>
                  <th className={`${thClass} text-right`}>{t.width ?? 'Ancho'}</th>
                  <th className={`${thClass} text-right`}>{t.height ?? 'Alto'}</th>
                  <th className={thClass}>SEO</th>
                  <th className={thClass}>{t.date ?? 'Fecha'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} px-2`}>
                      <button
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        onClick={() => handleEdit(s)}
                        title={t.btn_edit ?? 'Editar'}
                      >
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </button>
                    </td>
                    <td className={tdClass}>{s.nroParte}</td>
                    <td className={tdClass}>{s.desRepuesto}</td>
                    <td className={tdClass}>{s.aplicacion || '—'}</td>
                    <td className={tdClass}>{s.categoria || '—'}</td>
                    <td className={tdClass}>{s.hCode?.trim() || '—'}</td>
                    <td className={`${tdClass} text-right`}>{(s.peso ?? 0).toFixed(2)}</td>
                    <td className={`${tdClass} text-right`}>{(s.largo ?? 0).toFixed(2)}</td>
                    <td className={`${tdClass} text-right`}>{(s.ancho ?? 0).toFixed(2)}</td>
                    <td className={`${tdClass} text-right`}>{(s.alto ?? 0).toFixed(2)}</td>
                    <td className={tdClass}>
                      {s.blnSeo
                        ? <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{t.yes ?? 'SI'}</span>
                        : <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">{t.no ?? 'NO'}</span>
                      }
                    </td>
                    <td className={tdClass}>
                      <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Reg:</span>
                          <span className="truncate max-w-[110px]">{s.usuarioRegistra || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{s.fecRegistra}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Mod:</span>
                          <span className="truncate max-w-[110px]">{s.usuarioModifica || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{s.fecModifica}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-3 py-10 text-center text-sm text-gray-400">
                      {t.no_matches ?? 'Sin resultados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > pageSize && (
            <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination
                total={Math.ceil(total / pageSize)}
                value={page}
                onChange={onPageChange}
                size="sm"
                radius="xl"
              />
            </div>
          )}
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