'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRepresentative } from '../../RepresentativeContext';
import { useForm, Controller } from 'react-hook-form';
import { useDevice } from '@/context/device-context';
import { Pagination } from '@mantine/core';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSave from '@/components/icon/icon-save';

const BASE = '/margenescostorepresentante';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const fmt = (v) => (v != null ? Number(v).toFixed(2) : '0.00');

// Only show options after 2+ characters typed
const filterFromSecondChar = (option, inputValue) => {
  if (!inputValue || inputValue.length < 2) return false;
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
};

const noOptMsg2Chars = ({ inputValue }) =>
  !inputValue || inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados';

// ── Helpers ────────────────────────────────────────────────────────────────────
function FField({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function MargenCard({ row, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="text-2xl font-bold text-primary tabular-nums">
          {fmt(row.porCosto)}<span className="text-sm font-medium text-gray-400 ml-1">%</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{row.nomPais ?? row.codPais}</p>
      </div>

      <div className="px-4 py-3 space-y-1.5 text-xs">
        {row.nomProveedor && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-300 w-16 shrink-0">Proveedor</span>
            <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{row.nomProveedor}</span>
          </div>
        )}
        {row.nomAplicacion && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-300 w-16 shrink-0">Aplic.</span>
            <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{row.nomAplicacion}</span>
          </div>
        )}
        {row.nomMarca && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-300 w-16 shrink-0">Marca</span>
            <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{row.nomMarca}</span>
          </div>
        )}
        {!row.nomProveedor && !row.nomAplicacion && !row.nomMarca && (
          <p className="text-gray-300 italic">Sin filtros adicionales</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={() => onEdit(row)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-warning/10 hover:text-warning transition">
          <IconPencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(row)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
          <IconTrashLines className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────
// controles is guaranteed non-null when this component mounts
function MargenForm({ codPais, representante, editingRow, controles, onSaved, onCancel }) {
  const isEdit = !!editingRow;
  const { proveedores = [], marcas = [] } = controles;

  const findById = (list, id) =>
    id != null ? list.find(o => Number(o.value) === Number(id)) ?? null : null;

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      porCosto:   isEdit ? (editingRow.porCosto ?? '') : '',
      proveedor:  isEdit ? findById(proveedores, editingRow.codPrv)        : null,
      aplicacion: isEdit ? findById(marcas,      editingRow.codAplicacion) : null,
      marca:      isEdit ? findById(marcas,      editingRow.codMarca)      : null,
    },
  });

  const onSubmit = async (data) => {
    const toNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;

    const payload = {
      ...(isEdit ? { codRegistro: editingRow.codRegistro } : {}),
      codPais,
      codPrv:        data.proveedor?.value  ?? null,
      codAplicacion: data.aplicacion?.value ?? null,
      codMarca:      data.marca?.value      ?? null,
      porCosto:      toNum(data.porCosto),
    };

    try {
      const rs = isEdit
        ? await axiosClient.put(`${BASE}/editar`, payload)
        : await axiosClient.post(`${BASE}/registro`, payload);
      onSaved(rs.data);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? err?.response?.data?.mensaje ?? 'Error al guardar' });
    }
  };

  return (
    <div className="p-6 space-y-5">

      {/* Referencia representante */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <svg className="h-8 w-8 text-primary/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
            {representante?.razSoc || '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {representante?.nomPais || representante?.pais || codPais || '—'}
          </p>
        </div>
      </div>

      {/* % Costo */}
      <FField label="% Costo *" error={errors.porCosto?.message}>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('porCosto', { required: 'El % Costo es requerido', min: { value: 0, message: 'Debe ser mayor o igual a 0' } })}
          className={`form-input w-full ${errors.porCosto ? 'border-red-500' : ''}`}
          placeholder="0.00"
        />
      </FField>

      {/* Proveedor */}
      <FField label="Proveedor">
        <Controller
          name="proveedor"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={controles?.proveedores ?? []}
              isClearable
              isSearchable
              placeholder="Seleccionar proveedor..."
              noOptionsMessage={() => 'Sin resultados'}
              classNamePrefix="rselect"
              instanceId="margen-proveedor"
              menuPosition="fixed"
            />
          )}
        />
      </FField>

      {/* Aplicación + Marca */}
      <div className="grid grid-cols-2 gap-4">
        <FField label="Aplicación">
          <Controller
            name="aplicacion"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={controles?.marcas ?? []}
                filterOption={filterFromSecondChar}
                isClearable
                isSearchable
                placeholder="Escribe para buscar..."
                noOptionsMessage={noOptMsg2Chars}
                classNamePrefix="rselect"
                instanceId="margen-aplicacion"
                menuPosition="fixed"
              />
            )}
          />
        </FField>

        <FField label="Marca">
          <Controller
            name="marca"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={controles?.marcas ?? []}
                filterOption={filterFromSecondChar}
                isClearable
                isSearchable
                placeholder="Escribe para buscar..."
                noOptionsMessage={noOptMsg2Chars}
                classNamePrefix="rselect"
                instanceId="margen-marca"
                menuPosition="fixed"
              />
            )}
          />
        </FField>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
                     text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white
                     bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150">
          {isSubmitting ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Guardando...</>
          ) : (
            <><IconSave className="h-4 w-4" />{isEdit ? 'Actualizar' : 'Guardar'}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Vista formulario inline ───────────────────────────────────────────────────
function FormView({ codPais, representante, editingRow, controles, onSaved, onCancel }) {
  return (
    <div className="mx-auto max-w-2xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            {editingRow ? 'Editar Margen de Costo' : 'Nuevo Margen de Costo'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {editingRow ? 'Modifica los datos del margen' : 'Registra un nuevo margen de costo'}
          </p>
        </div>
      </div>
      <MargenForm
        codPais={codPais}
        representante={representante}
        editingRow={editingRow}
        controles={controles}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function MargenCosto({ representante }) {
  const codPais = representante?.codPais;
  const router  = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useDevice();
  const { basePath } = useRepresentative();

  const isNew  = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');
  const baseUrl = `${basePath}/margen`;

  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState('list');
  const [controles,   setControles]   = useState(null);
  const [formRow,     setFormRow]     = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => { setView(isMobile ? 'grid' : 'list'); }, [isMobile]);

  useEffect(() => {
    axiosClient.get(`${BASE}/controles`)
      .then(rs => setControles(rs.data ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => { if (codPais) fetchList(page); }, [page, codPais]);

  useEffect(() => {
    if (!editId) { setFormRow(null); return; }
    setLoadingForm(true);
    axiosClient.get(`${BASE}/detalle/${editId}`)
      .then(rs => setFormRow(rs.data))
      .catch(() => router.push(baseUrl))
      .finally(() => setLoadingForm(false));
  }, [editId]);

  const fetchList = async (p = 1) => {
    if (!codPais) return;
    setLoading(true);
    try {
      const rs = await axiosClient.get(`${BASE}/listar`, {
        params: { codPais, page: p, pageSize: PAGE_SIZE, codEstado: 'AC' },
      });
      const data = rs.data?.data ?? (Array.isArray(rs.data) ? rs.data : []);
      setRows(data);
      setTotal(rs.data?.total ?? data.length);
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: '¿Eliminar margen?',
      text: `${fmt(row.porCosto)}%${row.nomProveedor ? ` — ${row.nomProveedor}` : ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.post(`${BASE}/status`, { codRegistro: row.codRegistro, codEstado: 'IN' });
        Toast.fire({ icon: 'success', title: 'Margen eliminado' });
        const list = rs.data?.data ?? (Array.isArray(rs.data) ? rs.data : null);
        if (list) {
          setRows(list);
          setTotal(rs.data?.total ?? list.length);
        } else {
          setRows(prev => prev.filter(r => r.codRegistro !== row.codRegistro));
          setTotal(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Error al eliminar' });
      }
    });
  };

  const handleSaved = (responseData) => {
    const wasEditing = !!editId;
    Toast.fire({ icon: 'success', title: wasEditing ? 'Margen actualizado' : 'Margen registrado' });
    const list = responseData?.data ?? (Array.isArray(responseData) ? responseData : null);
    if (list) {
      setRows(list);
      setTotal(responseData?.total ?? list.length);
    } else {
      fetchList(page);
    }
    router.push(baseUrl);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const spinner = (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  // ── Form view ─── wait for controles in all cases so defaultValues can resolve selects
  if (isNew) {
    if (!controles) return spinner;
    return (
      <FormView
        codPais={codPais}
        representante={representante}
        editingRow={null}
        controles={controles}
        onSaved={handleSaved}
        onCancel={() => router.push(baseUrl)}
      />
    );
  }

  if (editId) {
    if (loadingForm || !formRow || !controles) return spinner;
    return (
      <FormView
        codPais={codPais}
        representante={representante}
        editingRow={formRow}
        controles={controles}
        onSaved={handleSaved}
        onCancel={() => router.push(baseUrl)}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Margen de Costo
            <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
          </h2>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button type="button" onClick={() => setView('list')}
              className={`p-2 transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <IconListCheck className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView('grid')}
              className={`p-2 transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button type="button" onClick={() => router.push(`${baseUrl}?new=1`)}
            className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all">
            <IconPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Agregar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <p className="text-sm">Sin márgenes de costo registrados</p>
        </div>
      )}

      {/* ── LIST ── */}
      {!loading && rows.length > 0 && view === 'list' && (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-right">% Costo</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Aplicación</th>
                  <th className="px-4 py-3 text-left">Marca</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {rows.map((row, i) => (
                  <tr key={row.codRegistro ?? i} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
                    <td className="px-4 py-2.5 text-right font-semibold text-primary tabular-nums">
                      {fmt(row.porCosto)}<span className="text-gray-400 font-normal text-xs">%</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomProveedor  ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomAplicacion ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomMarca      ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => router.push(`${baseUrl}?edit=${row.codRegistro}`)}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-warning/10 hover:text-warning transition">
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(row)}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
                          <IconTrashLines className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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
        </div>
      )}

      {/* ── GRID ── */}
      {!loading && rows.length > 0 && view === 'grid' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row, i) => (
              <MargenCard
                key={row.codRegistro ?? i}
                row={row}
                onEdit={(r) => router.push(`${baseUrl}?edit=${r.codRegistro}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
            </div>
          )}
        </>
      )}

    </div>
  );
}
