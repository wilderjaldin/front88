'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRepresentative } from '../../RepresentativeContext';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import { useDevice } from '@/context/device-context';
import { Pagination } from '@mantine/core';
import axiosClient from '@/app/lib/axiosClient';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSave from '@/components/icon/icon-save';

const BASE = '/direccionesentregarepresentante';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ── Helpers formulario ────────────────────────────────────────────────────────
function FField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function DireccionCard({ row, canEdit, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
          {row.nomEmpresa || '—'}
        </p>
        {row.nomContacto && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{row.nomContacto}</p>
        )}
      </div>

      <div className="px-4 py-3 space-y-1.5 text-xs">
        {row.direccion && (
          <div className="flex gap-2">
            <svg className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">{row.direccion}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400">
          {(row.nomPais || row.nomCiudad) && (
            <span>{[row.nomCiudad, row.nomPais].filter(Boolean).join(', ')}</span>
          )}
          {row.nomEstado && <span>{row.nomEstado}</span>}
          {row.codPostal && <span>ZIP {row.codPostal}</span>}
        </div>
        {row.numTelefono && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <svg className="h-3 w-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {row.numTelefono}
          </div>
        )}
        {row.email && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 truncate">
            <svg className="h-3 w-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="truncate">{row.email}</span>
          </div>
        )}
      </div>

      {canEdit && (
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
      )}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────
function DireccionForm({ codEmp, representante, editingRow, paises, onSaved, onCancel }) {
  const isEdit = !!editingRow;
  const t = useTranslation();

  const [cities,        setCities]        = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      nomEmpresa:  editingRow.nomEmpresa  ?? '',
      nomContacto: editingRow.nomContacto ?? '',
      email:       editingRow.email       ?? '',
      direccion:   editingRow.direccion   ?? '',
      numTelefono: editingRow.numTelefono ?? '',
      nomEstado:   editingRow.nomEstado   ?? '',
      codPostal:   editingRow.codPostal   ?? '',
      country: null,
      city:    null,
    } : {
      nomEmpresa: '', nomContacto: '', email: '',
      direccion: '', numTelefono: '', nomEstado: '', codPostal: '',
      country: null, city: null,
    },
  });

  const selectedCountry = watch('country');
  const isUS = selectedCountry?.value === 'US';

  const loadCities = async (codPais, preselectCodCiudad = null) => {
    setLoadingCities(true);
    setCities([]);
    setValue('city', null);
    try {
      const rs   = await axiosClient.get('/ciudades', { params: { CodPais: codPais } });
      const list = rs.data ?? [];
      setCities(list);
      if (preselectCodCiudad && list.length > 0) {
        const obj = list.find(c => c.value?.toUpperCase() === preselectCodCiudad.toString().toUpperCase()) ?? null;
        if (obj) setValue('city', obj);
      }
    } catch {}
    finally { setLoadingCities(false); }
  };

  // Pre-select country and load cities in edit mode once paises are available
  useEffect(() => {
    if (!isEdit || !editingRow.codPais || paises.length === 0) return;
    const paisObj = paises.find(p => p.value?.toUpperCase() === editingRow.codPais.toUpperCase()) ?? null;
    if (paisObj) setValue('country', paisObj);
    loadCities(editingRow.codPais, editingRow.codCiudad ?? null);
  }, [paises]);

  const onSubmit = async (data) => {
    const clean = (v) => (v === '' || v == null) ? null : v;
    const payload = isEdit
      ? {
          codRegistro: editingRow.codRegistro,
          codPais:     clean(data.country?.value),
          codCiudad:   clean(data.city?.value),
          nomEmpresa:  clean(data.nomEmpresa),
          nomContacto: clean(data.nomContacto),
          direccion:   clean(data.direccion),
          numTelefono: clean(data.numTelefono),
          email:       clean(data.email),
          nomEstado:   clean(data.nomEstado),
          codPostal:   clean(data.codPostal),
        }
      : {
          codEmpresa:  codEmp,
          codPais:     clean(data.country?.value),
          codCiudad:   clean(data.city?.value),
          nomEmpresa:  clean(data.nomEmpresa),
          nomContacto: clean(data.nomContacto),
          direccion:   clean(data.direccion),
          numTelefono: clean(data.numTelefono),
          email:       clean(data.email),
          nomEstado:   clean(data.nomEstado),
          codPostal:   clean(data.codPostal),
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
            {representante?.pais || representante?.codPais || '—'}
          </p>
        </div>
      </div>

      {/* Nom. Empresa */}
      <FField label="Nombre Empresa">
        <input type="text" {...register('nomEmpresa')} className="form-input w-full" placeholder="Nombre de la empresa" />
      </FField>

      {/* Contacto + Email */}
      <div className="grid grid-cols-2 gap-4">
        <FField label="Nombre Contacto">
          <input type="text" {...register('nomContacto')} className="form-input w-full" />
        </FField>
        <FField label="Email">
          <input type="email" {...register('email')} className="form-input w-full" />
        </FField>
      </div>

      {/* País + Ciudad */}
      <div className="grid grid-cols-2 gap-4">
        <FField label="País">
          <SelectCountry
            t={t}
            options={paises}
            control={control}
            errors={errors}
            setValue={setValue}
            current={editingRow?.codPais ?? ''}
            show_add={false}
            onChange={(option) => {
              if (option?.value) loadCities(option.value);
              else { setCities([]); setValue('city', null); }
            }}
          />
        </FField>
        <FField label="Ciudad">
          <SelectCity
            t={t}
            cities={cities}
            control={control}
            errors={errors}
            setValue={setValue}
            isLoading={loadingCities}
            show_add={false}
            selectedCountry={selectedCountry}
          />
        </FField>
      </div>

      {/* Dirección */}
      <FField label="Dirección">
        <input type="text" {...register('direccion')} className="form-input w-full" />
      </FField>

      {/* Teléfono + Estado + Cód. Postal */}
      <div className={`grid gap-4 ${isUS ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <FField label="Teléfono">
          <input type="text" {...register('numTelefono')} className="form-input w-full" />
        </FField>
        {isUS && (
          <>
            <FField label="Estado / Provincia">
              <input type="text" {...register('nomEstado')} className="form-input w-full" />
            </FField>
            <FField label="Cód. Postal">
              <input type="text" {...register('codPostal')} className="form-input w-full" />
            </FField>
          </>
        )}
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
function FormView({ codEmp, representante, editingRow, paises, onSaved, onCancel }) {
  return (
    <div className="mx-auto max-w-2xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
      <DireccionForm
        codEmp={codEmp}
        representante={representante}
        editingRow={editingRow}
        paises={paises}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DireccionesEntrega({ representante, isAdmin, isRepresentante }) {
  const codEmp  = representante?.codEmp;
  const canEdit = isAdmin || isRepresentante;

  const router  = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useDevice();
  const { basePath } = useRepresentative();

  const isNew  = searchParams.get('new') === '1';
  const editId = searchParams.get('edit');
  const baseUrl = `${basePath}/address`;

  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState('list');
  const [paises,      setPaises]      = useState([]);
  const [formRow,     setFormRow]     = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => { setView(isMobile ? 'grid' : 'list'); }, [isMobile]);

  useEffect(() => {
    axiosClient.get(`${BASE}/controles`)
      .then(rs => setPaises(rs.data?.paises ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchList(page); }, [page]);

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
      title: '¿Eliminar dirección?',
      text: row.nomEmpresa || 'Registro',
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
        Toast.fire({ icon: 'success', title: 'Dirección eliminada' });
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
    Toast.fire({ icon: 'success', title: wasEditing ? 'Dirección actualizada' : 'Dirección registrada' });
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
        paises={paises}
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
        paises={paises}
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
            Direcciones de Entrega
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

          {canEdit && (
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
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-sm">Sin direcciones de entrega registradas</p>
        </div>
      )}

      {/* ── LIST ── */}
      {!loading && rows.length > 0 && view === 'list' && (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Empresa</th>
                  <th className="px-4 py-3 text-left">Nombre Contacto</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">País</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Cód. Postal</th>
                  {canEdit && <th className="px-4 py-3 text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {rows.map((row, i) => (
                  <tr key={row.codRegistro ?? i} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">{row.nomEmpresa  ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomContacto ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{row.direccion   ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomPais    ?? row.codPais   ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomCiudad  ?? row.codCiudad ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.numTelefono ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.email      ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomEstado  ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.codPostal  ?? '—'}</td>
                    {canEdit && (
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
              <DireccionCard
                key={row.codRegistro ?? i}
                row={row}
                canEdit={canEdit}
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
