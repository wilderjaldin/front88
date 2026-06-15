'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import Modal from '@/components/modal';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSave from '@/components/icon/icon-save';

const BASE = '/utilidades';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const fmt = (v) => (v != null ? Number(v).toFixed(2) : '—');

const filterFromSecondChar = (option, inputValue) => {
  if (!inputValue || inputValue.length < 2) return false;
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
};

const noOptMsg2Chars = ({ inputValue }) =>
  !inputValue || inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados';

function FField({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function UtilityPage() {
  const t = useTranslation();
  useDynamicTitle(`${t.register} | ${t.utility}`);

  const user = useSelector(selectUser);

  const [controles,  setControles]  = useState(null);
  const [rows,       setRows]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [listPais,   setListPais]   = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [showModal,  setShowModal]  = useState(false);

  const isEdit = !!editingRow;

  const {
    register, handleSubmit, control, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      pais: null, tipoRepuesto: null, tipoEnvio: null,
      blnEstandard: false, porUtilidad: '', aplicacion: null,
    },
  });

  useEffect(() => {
    axiosClient.get(`${BASE}/controles`)
      .then(rs => {
        const data = rs.data ?? {};
        setControles(data);
        if (user?.countryCode && data.paises?.length) {
          const opt = data.paises.find(o => o.value?.trim() === user.countryCode?.trim()) ?? null;
          if (opt) setListPais(opt);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (listPais?.value) { setPage(1); fetchList(listPais.value, 1); }
    else { setRows([]); setTotal(0); }
  }, [listPais?.value]);

  useEffect(() => {
    if (listPais?.value) fetchList(listPais.value, page);
  }, [page]);

  const fetchList = async (codPais, p = 1) => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(`${BASE}/listar`, { params: { codPais, page: p } });
      const data = rs.data?.data ?? (Array.isArray(rs.data) ? rs.data : []);
      setRows(data);
      setTotal(rs.data?.total ?? data.length);
    } catch {}
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditingRow(null);
    reset({ pais: listPais ?? null, tipoRepuesto: null, tipoEnvio: null, blnEstandard: false, porUtilidad: '', aplicacion: null });
    setShowModal(true);
  };

  const openEdit = async (row) => {
    try {
      const rs = await axiosClient.get(`${BASE}/detalle/${row.codRegistro}`);
      const d = rs.data;
      setEditingRow(d);

      const { paises = [], tiposRepuesto = [], tiposEnvio = [], marcas = [] } = controles ?? {};
      reset({
        pais:         paises.find(o => o.value?.trim() === d.codPais?.trim())            ?? null,
        tipoRepuesto: tiposRepuesto.find(o => o.value?.trim() === d.tipRepuesto?.trim())  ?? null,
        tipoEnvio:    tiposEnvio.find(o => o.value?.trim() === d.tipoEnvio?.trim())       ?? null,
        blnEstandard: !!d.blnEstandard,
        porUtilidad:  d.porUtilidad != null ? Number(d.porUtilidad).toFixed(2) : '',
        aplicacion:   marcas.find(o => Number(o.value) === Number(d.aplicacion)) ?? null,
      });
      setShowModal(true);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cargar registro' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRow(null);
  };

  const onSubmit = async (data) => {
    const toNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;
    const payload = {
      ...(isEdit ? { codRegistro: editingRow.codRegistro } : {}),
      codPais:       data.pais?.value          ?? null,
      codTipRep:     data.tipoRepuesto?.value   ?? null,
      codTipoEnvio:  data.tipoEnvio?.value      ?? null,
      blnEstandard:  !!data.blnEstandard,
      porUtilidad:   toNum(data.porUtilidad),
      codAplicacion: data.aplicacion?.value     ?? null,
    };

    try {
      const rs = isEdit
        ? await axiosClient.put(`${BASE}/editar`, payload)
        : await axiosClient.post(`${BASE}/registro`, payload);

      Toast.fire({ icon: 'success', title: isEdit ? 'Utilidad actualizada' : 'Utilidad registrada' });

      const list = rs.data?.data ?? (Array.isArray(rs.data) ? rs.data : null);
      if (list) {
        setRows(list);
        setTotal(rs.data?.total ?? list.length);
      } else if (listPais?.value) {
        fetchList(listPais.value, page);
      }

      closeModal();
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? err?.response?.data?.mensaje ?? 'Error al guardar' });
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: '¿Eliminar utilidad?',
      text: `${fmt(row.porUtilidad)}%${row.nomAplicacion ? ` — ${row.nomAplicacion}` : ''}`,
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
        Toast.fire({ icon: 'success', title: 'Utilidad eliminada' });
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

  const totalPages = Math.ceil(total / 20);
  const { paises = [], tiposRepuesto = [], tiposEnvio = [], marcas = [] } = controles ?? {};

  return (
    <>
      {/* Breadcrumb */}
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>{t.register}</li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{t.utility}</span>
          </li>
        </ul>
      </div>

      <div className="pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Utilidades
              <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>
            </h2>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select
                value={listPais}
                onChange={(opt) => { setListPais(opt); setPage(1); }}
                options={paises}
                isClearable
                isSearchable
                placeholder="Filtrar por país..."
                noOptionsMessage={() => 'Sin resultados'}
                classNamePrefix="rselect"
                instanceId="list-pais"
                menuPosition="fixed"
                isDisabled={!controles}
              />
            </div>
            <button type="button" onClick={openNew}
              className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all">
              <IconPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Nueva Utilidad
            </button>
          </div>
        </div>

        {/* Loading controles */}
        {!controles && (
          <div className="flex items-center justify-center py-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Empty: no country selected */}
        {controles && !listPais && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
            </svg>
            <p className="text-sm">Selecciona un país para ver las utilidades</p>
          </div>
        )}

        {/* Loading list */}
        {controles && listPais && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Empty list */}
        {controles && listPais && !loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p className="text-sm">Sin utilidades registradas para este país</p>
          </div>
        )}

        {/* Table */}
        {controles && listPais && !loading && rows.length > 0 && (
          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">País</th>
                    <th className="px-4 py-3 text-left">Tipo Repuesto</th>
                    <th className="px-4 py-3 text-left">Tipo Envío</th>
                    <th className="px-4 py-3 text-center">Standard</th>
                    <th className="px-4 py-3 text-right">% Utilidad</th>
                    <th className="px-4 py-3 text-left">Aplicación</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {rows.map((row, i) => (
                    <tr key={row.codRegistro ?? i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomPais         ?? row.codPais   ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.desTipRepuesto  ?? row.tipRepuesto ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.desTipoEnvio    ?? row.tipoEnvio   ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                          ${row.blnEstandard
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                          {row.blnEstandard ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-primary tabular-nums">
                        {fmt(row.porUtilidad)}<span className="text-gray-400 font-normal text-xs">%</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.nomAplicacion ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(row)}
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

      </div>

      {/* Modal: form */}
      <Modal
        showModal={showModal}
        closeModal={closeModal}
        title={isEdit ? 'Editar Utilidad' : 'Nueva Utilidad'}
        size="w-full max-w-lg"
      >
        <div className="space-y-4">

          <FField label="País *" error={errors.pais?.message}>
            <Controller
              name="pais"
              control={control}
              rules={{ required: 'El país es requerido' }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={paises}
                  isClearable
                  isSearchable
                  placeholder="Seleccionar país..."
                  noOptionsMessage={() => 'Sin resultados'}
                  classNamePrefix="rselect"
                  instanceId="modal-pais"
                  menuPosition="fixed"
                />
              )}
            />
          </FField>

          <div className="grid grid-cols-2 gap-4">
            <FField label="Tipo Repuesto">
              <Controller
                name="tipoRepuesto"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={tiposRepuesto}
                    isClearable
                    isSearchable
                    placeholder="Seleccionar..."
                    noOptionsMessage={() => 'Sin resultados'}
                    classNamePrefix="rselect"
                    instanceId="modal-tiprep"
                    menuPosition="fixed"
                  />
                )}
              />
            </FField>

            <FField label="Tipo Envío">
              <Controller
                name="tipoEnvio"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={tiposEnvio}
                    isClearable
                    isSearchable
                    placeholder="Seleccionar..."
                    noOptionsMessage={() => 'Sin resultados'}
                    classNamePrefix="rselect"
                    instanceId="modal-tienvi"
                    menuPosition="fixed"
                  />
                )}
              />
            </FField>
          </div>

          <FField label="Aplicación">
            <Controller
              name="aplicacion"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={marcas}
                  filterOption={filterFromSecondChar}
                  isClearable
                  isSearchable
                  placeholder="Escribe para buscar..."
                  noOptionsMessage={noOptMsg2Chars}
                  classNamePrefix="rselect"
                  instanceId="modal-aplicacion"
                  menuPosition="fixed"
                />
              )}
            />
          </FField>

          <div className="grid grid-cols-2 gap-4 items-end">
            <FField label="% Utilidad *" error={errors.porUtilidad?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('porUtilidad', {
                  required: 'Requerido',
                  min: { value: 0, message: 'Debe ser ≥ 0' },
                })}
                className={`form-input w-full ${errors.porUtilidad ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
            </FField>

            <label className="flex items-center gap-2.5 pb-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                {...register('blnEstandard')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition">
                Es Standard
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={closeModal}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium
                         text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white
                         bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150">
              {isSubmitting ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Guardando...</>
              ) : (
                <><IconSave className="h-3.5 w-3.5" />{isEdit ? 'Actualizar' : 'Guardar'}</>
              )}
            </button>
          </div>

        </div>
      </Modal>
    </>
  );
}
