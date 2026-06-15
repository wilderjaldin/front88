'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRepresentative } from '../../RepresentativeContext';
import { useForm } from 'react-hook-form';
import { useDevice } from '@/context/device-context';
import { Pagination } from '@mantine/core';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSave from '@/components/icon/icon-save';

const BASE = '/parametrostransporterepresentante';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const fmt = (v) => (v != null ? Number(v).toFixed(2) : '0.00');

// ── Helpers formulario ────────────────────────────────────────────────────────
function FField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function Divider({ label, color = 'text-primary' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
      <span className={`text-[11px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
      <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

function Num({ v }) {
  return <span className="tabular-nums">{fmt(v)}</span>;
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function CostRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 dark:text-gray-200 tabular-nums">{value}</span>
    </div>
  );
}

function ParamCard({ row, canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex gap-3 text-[11px] text-gray-400">
          <span>Aduana <strong className="text-gray-600 dark:text-gray-300">{fmt(row.porAduana)}%</strong></span>
          <span>Peso mín. <strong className="text-gray-600 dark:text-gray-300">{fmt(row.pesoMinimo)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Standard</p>
          <CostRow label="Días bodega"  value={row.diasBodegaStandard  ?? 0} />
          <CostRow label="Días ship."   value={row.diasShipingStandard ?? 0} />
          <CostRow label="Días aduana"  value={row.diasAduanaStandard  ?? 0} />
          <CostRow label="$/lb"         value={fmt(row.pesoKgShipingStandard)} />
          <CostRow label="Costo fijo"   value={fmt(row.costoFijoStandard)} />
          <CostRow label="Costo mín."   value={fmt(row.costoMinimoStandard)} />
        </div>
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider mb-2">Express</p>
          <CostRow label="Días bodega"  value={row.diasBodegaExpress  ?? 0} />
          <CostRow label="Días ship."   value={row.diasShipingExpress ?? 0} />
          <CostRow label="Días aduana"  value={row.diasAduanaExpress  ?? 0} />
          <CostRow label="$/lb"         value={fmt(row.pesoKgShipingExpress)} />
          <CostRow label="Costo fijo"   value={fmt(row.costoFijoExpress)} />
          <CostRow label="Costo mín."   value={fmt(row.costoMinimoExpress)} />
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Marítimo</p>
        <div className="grid grid-cols-2 gap-2">
          <CostRow label="Días ship." value={row.diasShipingMaritimo ?? 0} />
          <CostRow label="Peso ship. (lb)" value={fmt(row.pesoShipingMaritimo)} />
        </div>
      </div>

      {(canEdit || canDelete) && (
        <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
          {canEdit && (
            <button onClick={() => onEdit(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-warning/10 hover:text-warning transition">
              <IconPencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
              <IconTrashLines className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────
function TransporteForm({ codEmp, representante, editingRow, onSaved, onCancel }) {
  const isEdit = !!editingRow;

  const DEFAULTS = {
    porAduana: '0.00', pesoMinimo: '0.00',
    diasBodegaStandard: 0, diasShipingStandard: 0, diasAduanaStandard: 0,
    pesoKgShipingStandard: '0.00', costoFijoStandard: '0.00', costoMinimoStandard: '0.00',
    diasBodegaExpress: 0, diasShipingExpress: 0, diasAduanaExpress: 0,
    pesoKgShipingExpress: '0.00', costoFijoExpress: '0.00', costoMinimoExpress: '0.00',
    diasShipingMaritimo: 0, pesoShipingMaritimo: '0.00',
  };

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      porAduana:             editingRow.porAduana              ?? '0.00',
      pesoMinimo:            editingRow.pesoMinimo             ?? '0.00',
      diasBodegaStandard:    editingRow.diasBodegaStandard     ?? 0,
      diasShipingStandard:   editingRow.diasShipingStandard    ?? 0,
      diasAduanaStandard:    editingRow.diasAduanaStandard     ?? 0,
      pesoKgShipingStandard: editingRow.pesoKgShipingStandard  ?? '0.00',
      costoFijoStandard:     editingRow.costoFijoStandard      ?? '0.00',
      costoMinimoStandard:   editingRow.costoMinimoStandard    ?? '0.00',
      diasBodegaExpress:     editingRow.diasBodegaExpress      ?? 0,
      diasShipingExpress:    editingRow.diasShipingExpress     ?? 0,
      diasAduanaExpress:     editingRow.diasAduanaExpress      ?? 0,
      pesoKgShipingExpress:  editingRow.pesoKgShipingExpress   ?? '0.00',
      costoFijoExpress:      editingRow.costoFijoExpress       ?? '0.00',
      costoMinimoExpress:    editingRow.costoMinimoExpress     ?? '0.00',
      diasShipingMaritimo:   editingRow.diasShipingMaritimo    ?? 0,
      pesoShipingMaritimo:   editingRow.pesoShipingMaritimo    ?? '0.00',
    } : DEFAULTS,
  });

  const onSubmit = async (data) => {
    const toNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;
    const toInt = (v) => parseInt(v) || 0;

    const commonFields = {
      codPaisDestino:        representante?.codPais,
      codPaisCentral:        representante?.codPais,
      porAduana:             toNum(data.porAduana),
      pesoMinimo:            toNum(data.pesoMinimo),
      diasBodegaStandard:    toInt(data.diasBodegaStandard),
      diasShipingStandard:   toInt(data.diasShipingStandard),
      diasAduanaStandard:    toInt(data.diasAduanaStandard),
      pesoKgShipingStandard: toNum(data.pesoKgShipingStandard),
      costoFijoStandard:     toNum(data.costoFijoStandard),
      costoMinimoStandard:   toNum(data.costoMinimoStandard),
      diasBodegaExpress:     toInt(data.diasBodegaExpress),
      diasShipingExpress:    toInt(data.diasShipingExpress),
      diasAduanaExpress:     toInt(data.diasAduanaExpress),
      pesoKgShipingExpress:  toNum(data.pesoKgShipingExpress),
      costoFijoExpress:      toNum(data.costoFijoExpress),
      costoMinimoExpress:    toNum(data.costoMinimoExpress),
      diasShipingMaritimo:   toInt(data.diasShipingMaritimo),
      pesoShipingMaritimo:   toNum(data.pesoShipingMaritimo),
    };

    const payload = isEdit
      ? { codRegistro: editingRow.codRegistro, ...commonFields }
      : { codEmpresa: codEmp, ...commonFields };

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
            {representante?.pais || representante?.codPais || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FField label="% Aduana">
          <input type="number" step="0.01" min="0" {...register('porAduana')} className="form-input w-full" />
        </FField>
        <FField label="Peso mínimo (lb)">
          <input type="number" step="0.01" min="0" {...register('pesoMinimo')} className="form-input w-full" />
        </FField>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">

        {/* STANDARD */}
        <div className="space-y-3 rounded-lg bg-primary/[0.03] dark:bg-primary/[0.06] border border-primary/10 p-3">
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-primary/10" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Standard</span>
            <span className="h-px flex-1 bg-primary/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FField label="Días Bodega">
              <input type="number" min="0" {...register('diasBodegaStandard')} className="form-input w-full" />
            </FField>
            <FField label="Días Shipping">
              <input type="number" min="0" {...register('diasShipingStandard')} className="form-input w-full" />
            </FField>
            <FField label="Días Aduana">
              <input type="number" min="0" {...register('diasAduanaStandard')} className="form-input w-full" />
            </FField>
            <FField label="$/lb Shipping">
              <input type="number" step="0.01" min="0" {...register('pesoKgShipingStandard')} className="form-input w-full" />
            </FField>
            <FField label="Costo Fijo">
              <input type="number" step="0.01" min="0" {...register('costoFijoStandard')} className="form-input w-full" />
            </FField>
            <FField label="Costo Mínimo">
              <input type="number" step="0.01" min="0" {...register('costoMinimoStandard')} className="form-input w-full" />
            </FField>
          </div>
        </div>

        {/* EXPRESS */}
        <div className="space-y-3 rounded-lg bg-cyan-500/[0.03] dark:bg-cyan-500/[0.06] border border-cyan-500/10 p-3">
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-cyan-500/10" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-500">Express</span>
            <span className="h-px flex-1 bg-cyan-500/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FField label="Días Bodega">
              <input type="number" min="0" {...register('diasBodegaExpress')} className="form-input w-full" />
            </FField>
            <FField label="Días Shipping">
              <input type="number" min="0" {...register('diasShipingExpress')} className="form-input w-full" />
            </FField>
            <FField label="Días Aduana">
              <input type="number" min="0" {...register('diasAduanaExpress')} className="form-input w-full" />
            </FField>
            <FField label="$/lb Shipping">
              <input type="number" step="0.01" min="0" {...register('pesoKgShipingExpress')} className="form-input w-full" />
            </FField>
            <FField label="Costo Fijo">
              <input type="number" step="0.01" min="0" {...register('costoFijoExpress')} className="form-input w-full" />
            </FField>
            <FField label="Costo Mínimo">
              <input type="number" step="0.01" min="0" {...register('costoMinimoExpress')} className="form-input w-full" />
            </FField>
          </div>
        </div>

      </div>

      <Divider label="MARÍTIMO" color="text-blue-500" />
      <div className="grid grid-cols-2 gap-4">
        <FField label="Días Shipping">
          <input type="number" min="0" {...register('diasShipingMaritimo')} className="form-input w-full" />
        </FField>
        <FField label="Peso Shipping (lb)">
          <input type="number" step="0.01" min="0" {...register('pesoShipingMaritimo')} className="form-input w-full" />
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
function FormView({ codEmp, representante, editingRow, onSaved, onCancel }) {
  return (
    <div className="mx-auto max-w-4xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
      <TransporteForm
        codEmp={codEmp}
        representante={representante}
        editingRow={editingRow}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ParametrosTransporte({ representante, isAdmin, isRepresentante }) {
  const codEmp   = representante?.codEmp;
  const canEdit  = isAdmin || isRepresentante;
  const canAdd   = isAdmin;
  const canDelete = isAdmin;

  const router  = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useDevice();
  const { basePath } = useRepresentative();

  const isNew  = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');
  const baseUrl = `${basePath}/parameters`;

  const [rows,       setRows]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState('list');
  const [formRow,    setFormRow]    = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => { setView(isMobile ? 'grid' : 'list'); }, [isMobile]);

  // Load list
  useEffect(() => { fetchList(page); }, [page]);

  // Load detail when edit param is present
  useEffect(() => {
    if (!editId) { setFormRow(null); return; }
    setLoadingForm(true);
    axiosClient.get(`${BASE}/detalle/${editId}`)
      .then(rs => setFormRow(rs.data))
      .catch(() => router.push(baseUrl))
      .finally(() => setLoadingForm(false));
  }, [editId]);

  const fetchList = async (p = 1) => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(`${BASE}/listar`, {
        params: { codEmpresa: codEmp, page: p, pageSize: PAGE_SIZE, codEstado: 'AC' },
      });
      const data = rs.data?.data ?? (Array.isArray(rs.data) ? rs.data : []);
      setRows(data);
      setTotal(rs.data?.total ?? data.length);
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: '¿Eliminar parámetro?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await axiosClient.post(`${BASE}/status`, { codRegistro: row.codRegistro, codEstado: 'IN' });
        Toast.fire({ icon: 'success', title: 'Parámetro eliminado' });
        setRows(prev => prev.filter(r => r.codRegistro !== row.codRegistro));
        setTotal(prev => Math.max(0, prev - 1));
      } catch (err) {
        Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Error al eliminar' });
      }
    });
  };

  const handleSaved = (responseData) => {
    const wasEditing = !!editId;
    Toast.fire({ icon: 'success', title: wasEditing ? 'Parámetro actualizado' : 'Parámetro registrado' });
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

  // ── Form view ──────────────────────────────────────────────────────────────
  if (isNew) {
    return (
      <FormView
        codEmp={codEmp}
        representante={representante}
        editingRow={null}
        onSaved={handleSaved}
        onCancel={() => router.push(baseUrl)}
      />
    );
  }

  if (editId) {
    if (loadingForm || !formRow) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }
    return (
      <FormView
        codEmp={codEmp}
        representante={representante}
        editingRow={formRow}
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
            Parámetros de Transporte
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

          {canAdd && (
            <button type="button" onClick={() => router.push(`${baseUrl}?new=1`)}
              className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all">
              <IconPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Agregar
            </button>
          )}
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
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p className="text-sm">Sin parámetros de transporte registrados</p>
        </div>
      )}

      {/* ── LIST ── */}
      {!loading && rows.length > 0 && view === 'list' && (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-right">% Aduana</th>
                  <th className="px-4 py-3 text-right">Peso Mín.</th>
                  <th className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700" colSpan={6}>
                    <span className="text-primary">STANDARD</span>
                  </th>
                  <th className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700" colSpan={6}>
                    <span className="text-cyan-500">EXPRESS</span>
                  </th>
                  <th className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700" colSpan={2}>
                    <span className="text-blue-500">MARÍTIMO</span>
                  </th>
                  {(canEdit || canDelete) && <th className="px-4 py-3 text-center">Acciones</th>}
                </tr>
                <tr className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800/80">
                  <th colSpan={2} />
                  <th className="px-3 py-2 text-right border-l border-gray-200 dark:border-gray-700">D.Bodega</th>
                  <th className="px-3 py-2 text-right">D.Ship.</th>
                  <th className="px-3 py-2 text-right">D.Aduana</th>
                  <th className="px-3 py-2 text-right">$/Kg</th>
                  <th className="px-3 py-2 text-right">C.Fijo</th>
                  <th className="px-3 py-2 text-right">C.Mín.</th>
                  <th className="px-3 py-2 text-right border-l border-gray-200 dark:border-gray-700">D.Bodega</th>
                  <th className="px-3 py-2 text-right">D.Ship.</th>
                  <th className="px-3 py-2 text-right">D.Aduana</th>
                  <th className="px-3 py-2 text-right">$/Kg</th>
                  <th className="px-3 py-2 text-right">C.Fijo</th>
                  <th className="px-3 py-2 text-right">C.Mín.</th>
                  <th className="px-3 py-2 text-right border-l border-gray-200 dark:border-gray-700">D.Ship.</th>
                  <th className="px-3 py-2 text-right">Peso (lb)</th>
                  {(canEdit || canDelete) && <th />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {rows.map((row, i) => (
                  <tr key={row.codRegistro ?? i} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
                    <td className="px-4 py-2.5 text-right tabular-nums"><Num v={row.porAduana} />%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums"><Num v={row.pesoMinimo} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-gray-100 dark:border-gray-700/50">{row.diasBodegaStandard  ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.diasShipingStandard ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.diasAduanaStandard  ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.pesoKgShipingStandard} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.costoFijoStandard} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.costoMinimoStandard} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-gray-100 dark:border-gray-700/50">{row.diasBodegaExpress  ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.diasShipingExpress ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.diasAduanaExpress  ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.pesoKgShipingExpress} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.costoFijoExpress} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.costoMinimoExpress} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-gray-100 dark:border-gray-700/50">{row.diasShipingMaritimo ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums"><Num v={row.pesoShipingMaritimo} /></td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && (
                            <button onClick={() => router.push(`${baseUrl}?edit=${row.codRegistro}`)}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-warning/10 hover:text-warning transition">
                              <IconPencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(row)}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
                              <IconTrashLines className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
              <ParamCard
                key={row.codRegistro ?? i}
                row={row}
                canEdit={canEdit}
                canDelete={canDelete}
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
