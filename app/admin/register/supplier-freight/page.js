"use client";
import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import axiosClient from "@/app/lib/axiosClient";
import Swal from 'sweetalert2';
import Select from 'react-select';
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconPlus from "@/components/icon/icon-plus";
import IconPencil from "@/components/icon/icon-pencil";
import IconSave from "@/components/icon/icon-save";

const INITIAL_ROWS = [
  { id: 1, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 },
  { id: 2, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 },
  { id: 3, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 },
  { id: 4, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 },
  { id: 5, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 },
];

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const formatOnBlur = (e) => {
  const n = parseFloat(e.target.value.replace(',', '.'));
  if (!isNaN(n)) e.target.value = n.toFixed(2);
};

export default function SupplierFreight() {
  const t = useTranslation();
  useDynamicTitle(`${t.register} | ${t.zone_cost}`);

  // ── Catálogos (una sola carga) ───────────────────────────────────────────
  const [controles,    setControles]    = useState(null);

  // ── Lista ────────────────────────────────────────────────────────────────
  const [zones,        setZones]        = useState([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [filterTerm,   setFilterTerm]   = useState('');
  const [selectedZone, setSelectedZone] = useState(null);

  // ── Formulario ───────────────────────────────────────────────────────────
  const [showForm,     setShowForm]     = useState(false);
  const [editData,     setEditData]     = useState(null);
  const [rows,         setRows]         = useState([]);
  const [nextId,       setNextId]       = useState(6);
  const [submitting,   setSubmitting]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const {
    register, control, reset, handleSubmit, getValues, setValue,
    formState: { errors },
  } = useForm();

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => { loadControles(); }, []);

  const loadControles = async () => {
    try {
      const rs = await axiosClient.get('/zonafletes/controles');
      setControles(rs.data);
    } catch {}
    loadZones();
  };

  const loadZones = async () => {
    setLoadingList(true);
    try {
      const rs = await axiosClient.get('/zonafletes');
      setZones(rs.data.data ?? []);
    } catch {}
    finally { setLoadingList(false); }
  };

  // ── Lista filtrada ───────────────────────────────────────────────────────
  const filteredZones = useMemo(() => {
    if (!filterTerm.trim()) return zones;
    const q = filterTerm.trim().toUpperCase();
    return zones.filter(z => z.zonaFlete?.toUpperCase().includes(q));
  }, [zones, filterTerm]);

  // ── Acciones lista ───────────────────────────────────────────────────────
  const openNew = () => {
    setEditData(null);
    setRows(INITIAL_ROWS);
    setNextId(6);
    reset({ zona: '', costoMin: '', pais: null, tipProceso: null });
    setShowForm(true);
  };

  const openEdit = async (z) => {
    try {
      const rs  = await axiosClient.get(`/zonafletes/${z.codFlete}`);
      const dto = rs.data;
      setEditData(dto);

      const paisOpt = controles?.paises?.find(p => p.value === dto.codPais)     ?? null;
      const tipOpt  = controles?.tiposProceso?.find(p => p.value === dto.tipProceso) ?? null;

      const detRows = (dto.detalles ?? []).map((d, i) => ({
        id:          i + 1,
        pesoInicial: d.pesoInicial ?? 0,
        pesoFinal:   d.pesoFinal   ?? 0,
        costoLibra:  d.costoLibra  ?? 0,
      }));
      setRows(detRows.length ? detRows : INITIAL_ROWS);
      setNextId((detRows.length || 5) + 1);

      reset({ zona: dto.zonaFlete, costoMin: dto.costoMin, pais: paisOpt, tipProceso: tipOpt });
      setShowForm(true);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cargar la zona' });
    }
  };

  const cancel = () => {
    setShowForm(false);
    setEditData(null);
    setRows([]);
    reset();
  };

  // ── Tabla dinámica ───────────────────────────────────────────────────────
  const addRow = () => {
    setRows(prev => [...prev, { id: nextId, pesoInicial: 0, pesoFinal: 0, costoLibra: 0 }]);
    setNextId(n => n + 1);
  };

  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const detalles = rows.map(r => ({
      pesoInicial: parseFloat(getValues(`row_${r.id}_pi`) || '0') || 0,
      pesoFinal:   parseFloat(getValues(`row_${r.id}_pf`) || '0') || 0,
      costoLibra:  parseFloat(getValues(`row_${r.id}_cl`) || '0') || 0,
    }));

    const payload = {
      codFlete:   editData?.codFlete     ?? null,
      codPais:    data.pais?.value       ?? '',
      tipProceso: data.tipProceso?.value ?? '',
      zonaFlete:  data.zona.trim().toUpperCase(),
      costoMin:   parseFloat(data.costoMin) || 0,
      detalles,
    };

    setSubmitting(true);
    try {
      const rs = await axiosClient.post('/zonafletes/guardar', payload);
      setZones(rs.data.data ?? []);
      Toast.fire({ icon: 'success', title: t.freight_successfully_saved });
      cancel();
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.mensaje ?? t.freight_zone_add_error });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const deleteZone = () => {
    Swal.fire({
      title:              t.question_delete_freight_zone,
      text:               editData?.zonaFlete,
      icon:               'question',
      showCancelButton:   true,
      confirmButtonColor: '#dc2626',
      confirmButtonText:  t.yes_delete,
      cancelButtonText:   t.btn_cancel,
      reverseButtons:     true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setDeleting(true);
      try {
        await axiosClient.delete(`/zonafletes/eliminar/${editData.codFlete}`);
        setZones(prev => prev.filter(z => z.codFlete !== editData.codFlete));
        if (selectedZone?.codFlete === editData.codFlete) setSelectedZone(null);
        Toast.fire({ icon: 'success', title: t.freight_zone_deleted });
        cancel();
      } catch (err) {
        Toast.fire({ icon: 'error', title: err?.response?.data?.mensaje ?? t.freight_zone_deleted_error });
      } finally {
        setDeleting(false);
      }
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <li>{t.register}</li>
        <li className="before:content-['/'] before:mx-2 font-semibold text-gray-700 dark:text-gray-300">
          {t.supplier_freight}
        </li>
      </ul>

      {showForm ? (
        /* ── FORMULARIO ─────────────────────────────────────────────────── */
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {editData ? t.edit_freight_zone : t.btn_add_freight}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* Panel izquierdo — campos */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700
                            bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-5">

              {/* País */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.country} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="pais"
                  control={control}
                  rules={{ required: t.required_field }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={controles?.paises ?? []}
                      isClearable
                      placeholder={t.select_option}
                      instanceId="select-pais-freight"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.pais && <p className="text-xs text-red-500 mt-1">{errors.pais.message}</p>}
              </div>

              {/* Tipo Proceso */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.process_Type} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="tipProceso"
                  control={control}
                  rules={{ required: t.required_field }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={controles?.tiposProceso ?? []}
                      isClearable
                      placeholder={t.select_option}
                      instanceId="select-tip-proceso-freight"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.tipProceso && <p className="text-xs text-red-500 mt-1">{errors.tipProceso.message}</p>}
              </div>

              {/* Zona de Flete */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.zone_cost} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  {...register('zona', {
                    required:  { value: true, message: t.required_field },
                    maxLength: { value: 100,  message: 'Máximo 100 caracteres' },
                  })}
                  placeholder={t.zone_cost}
                  className={`form-input w-full ${errors.zona ? 'border-red-500' : ''}`}
                />
                {errors.zona && <p className="text-xs text-red-500 mt-1">{errors.zona.message}</p>}
              </div>

              {/* Costo Mínimo */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.minimum_cost} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  {...register('costoMin', {
                    required: { value: true,                 message: t.required_field },
                    pattern:  { value: /^\d+(\.\d{0,2})?$/, message: 'Solo valores numéricos' },
                  })}
                  onBlur={formatOnBlur}
                  placeholder="0.00"
                  className={`form-input w-full ${errors.costoMin ? 'border-red-500' : ''}`}
                />
                {errors.costoMin && <p className="text-xs text-red-500 mt-1">{errors.costoMin.message}</p>}
              </div>
            </div>

            {/* Panel derecho — tabla dinámica */}
            <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700
                            bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-3 text-left">{t.initial_weight}</th>
                    <th className="px-3 py-3 text-left">{t.final_weight}</th>
                    <th className="px-3 py-3 text-left">{t.cost}</th>
                    <th className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={addRow}
                        title={t.btn_add}
                        className="group inline-flex items-center justify-center h-7 w-7 rounded-full
                                   bg-primary text-white shadow-sm hover:bg-primary/90 transition"
                      >
                        <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((r, index) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          autoComplete="off"
                          defaultValue={Number(r.pesoInicial).toFixed(2)}
                          {...register(`row_${r.id}_pi`)}
                          onBlur={(e) => { formatOnBlur(e); setValue(`row_${r.id}_pi`, e.target.value); }}
                          className="form-input w-full !py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          autoComplete="off"
                          defaultValue={Number(r.pesoFinal).toFixed(2)}
                          {...register(`row_${r.id}_pf`)}
                          onBlur={(e) => { formatOnBlur(e); setValue(`row_${r.id}_pf`, e.target.value); }}
                          className="form-input w-full !py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          autoComplete="off"
                          defaultValue={Number(r.costoLibra).toFixed(2)}
                          {...register(`row_${r.id}_cl`)}
                          onBlur={(e) => { formatOnBlur(e); setValue(`row_${r.id}_cl`, e.target.value); }}
                          className="form-input w-full !py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <IconTrashLines className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {editData && (
              <button
                type="button"
                onClick={deleteZone}
                disabled={deleting}
                className="btn btn-outline-danger disabled:opacity-50"
              >
                {deleting ? t.deleting : t.btn_delete}
              </button>
            )}
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2
                         text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {t.btn_cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.saving_data}
                </>
              ) : (
                <>
                  <IconSave className="h-4 w-4" />
                  {t.btn_save}
                </>
              )}
            </button>
          </div>
        </div>

      ) : (
        /* ── LISTA ──────────────────────────────────────────────────────── */
        <div className="space-y-4">

          {/* Título estilo Usuarios */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {t.zone_cost}{' '}
              <span className="text-base font-normal text-gray-400">({zones.length})</span>
            </h1>
            <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
          </div>

          {/* Filtro + botón agregar */}
          <div className="flex items-center justify-end gap-3">
            <input
              type="text"
              value={filterTerm}
              onChange={e => setFilterTerm(e.target.value)}
              placeholder="Buscar zona..."
              className="form-input max-w-[220px] !py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={openNew}
              className="group flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5
                         text-white text-xs font-medium shadow-sm hover:bg-primary/90 transition shrink-0"
            >
              <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              {t.btn_add_freight}
            </button>
          </div>

          {/* Grid lista + detalles */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* ── Lista (3/5) ────────────────────────────────────────────── */}
            <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700
                            bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 overflow-hidden">
              {loadingList ? (
                <div className="flex items-center justify-center h-40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  <div className="max-h-[520px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase z-10">
                        <tr>
                          <th className="px-4 py-3 text-left">{t.country}</th>
                          <th className="px-4 py-3 text-left">{t.process_Type}</th>
                          <th className="px-4 py-3 text-left">{t.zone_cost}</th>
                          <th className="px-4 py-3 text-left">{t.minimum_cost}</th>
                          <th className="px-4 py-3 text-center">Detalles</th>
                          <th className="px-4 py-3 text-center">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredZones.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                              {filterTerm ? 'Sin resultados para la búsqueda' : t.record_empty}
                            </td>
                          </tr>
                        ) : filteredZones.map((z) => {
                          const isSelected = selectedZone?.codFlete === z.codFlete;
                          return (
                            <tr
                              key={z.codFlete}
                              className={`transition ${isSelected
                                ? 'bg-primary/5 dark:bg-primary/10'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                              <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{z.nomPais}</td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
                                  {z.proceso ?? z.tipProceso}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                                {z.zonaFlete}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{z.costoMin}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedZone(isSelected ? null : z)}
                                  title="Ver detalles"
                                  className={`inline-flex items-center justify-center h-6 min-w-[24px] px-2
                                              rounded-full text-xs font-semibold transition cursor-pointer
                                              ${isSelected
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary'
                                              }`}
                                >
                                  {z.detalles?.length ?? 0}
                                </button>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => openEdit(z)}
                                  title={t.edit}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                                >
                                  <IconPencil className="h-4 w-4 text-blue-500" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredZones.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700
                                    text-xs text-gray-400 text-right">
                      {filteredZones.length} {filteredZones.length === 1 ? 'zona' : 'zonas'}
                      {filterTerm && ` de ${zones.length} total`}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Detalles (2/5) ─────────────────────────────────────────── */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700
                            bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 overflow-hidden min-h-[140px]">
              {!selectedZone ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-sm text-gray-400">
                  <svg className="h-8 w-8 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  <p>Selecciona una zona para ver los detalles</p>
                </div>
              ) : (
                <>
                  {/* Header del panel */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        {selectedZone.zonaFlete}
                      </p>
                      <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
                        {selectedZone.proceso ?? selectedZone.tipProceso}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{selectedZone.nomPais}</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span>{t.minimum_cost}: <strong className="text-gray-700 dark:text-gray-300">{selectedZone.costoMin}</strong></span>
                    </div>
                  </div>

                  {/* Tabla de bandas */}
                  {(!selectedZone.detalles || selectedZone.detalles.length === 0) ? (
                    <div className="flex items-center justify-center h-24 text-sm text-gray-400">
                      Sin bandas de peso registradas
                    </div>
                  ) : (
                    <div className="max-h-[440px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-3 py-2 text-center w-8">#</th>
                            <th className="px-3 py-2 text-right">{t.initial_weight}</th>
                            <th className="px-3 py-2 text-right">{t.final_weight}</th>
                            <th className="px-3 py-2 text-right">{t.cost_per_pound}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {selectedZone.detalles.map((d) => (
                            <tr key={d.numCor} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 text-center text-gray-400 text-xs">{d.numCor}</td>
                              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{d.pesoInicial?.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{d.pesoFinal?.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">{d.costoLibra?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
