"use client";
import { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import DatatablesSparesLot from "@/components/datatables/components-datatables-spares-lot";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconSave from '@/components/icon/icon-save';

const URL_SAVE     = 'repuestos/guardar-lote';
const URL_DOWNLOAD = 'repuestos/descargar-errores-lote';
const URL_CONTROLS = 'repuestos/controles?incluirEstados=true&incluirCategorias=true';

const ASYNC_LIMIT     = 20;
const ASYNC_MIN_CHARS = 2;

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--select-bg, #fff)',
    borderColor: state.isFocused ? '#4361ee' : state.selectProps.error ? '#f87171' : 'var(--select-border, #e0e6ed)',
    borderRadius: '0.5rem',
    minHeight: '42px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(67,97,238,0.12)' : 'none',
    transition: 'border-color .15s, box-shadow .15s',
    '&:hover': { borderColor: '#4361ee' },
  }),
  menu:   (base) => ({ ...base, backgroundColor: 'var(--select-bg, #fff)', border: '1px solid var(--select-border, #e0e6ed)', borderRadius: '0.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden' }),
  menuList:(base) => ({ ...base, padding: '4px' }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? 'rgba(67,97,238,0.08)' : 'transparent',
    color: state.isSelected ? '#fff' : 'inherit',
    borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', padding: '7px 10px',
  }),
  singleValue:        (base) => ({ ...base, color: 'inherit', fontSize: '0.875rem' }),
  input:              (base) => ({ ...base, color: 'inherit', fontSize: '0.875rem' }),
  placeholder:        (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  clearIndicator:     (base) => ({ ...base, color: '#9ca3af', padding: '5px', '&:hover': { color: '#e7515a' } }),
  dropdownIndicator:  (base) => ({ ...base, color: '#9ca3af', padding: '5px' }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--select-border, #e0e6ed)' }),
  valueContainer:     (base) => ({ ...base, padding: '2px 12px' }),
};

// ── Parseo líneas TSV (texto pegado o convertido desde Excel) ─────────────────
function parseLines(text, units) {
  const lines         = text.split(/\r\n|\r|\n/);
  const rows          = [];
  const invalid_lines = [];
  const bad_units     = [];

  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    const spare = line.split(/\t/);
    if (spare.length < 10) { invalid_lines.push(i + 1); continue; }
    const unit = spare[5] ? spare[5].toUpperCase() : '';
    if (!units.some(obj => obj.label?.toUpperCase() === unit)) bad_units.push(unit);
    rows.push({
      id: i, nro_part: spare[0], description: spare[1],
      cost: spare[2], weight: spare[3], min_amount: spare[4],
      unit, special_order: spare[6], days: spare[7],
      special_order_without_date: spare[8], low_inventory: spare[9],
    });
  }
  return { rows, invalid_lines, bad_units };
}

const COLOR_MAP = {
  blue:  { num: 'text-blue-500',  bg: 'bg-blue-50  dark:bg-blue-900/20',  border: 'border-blue-100  dark:border-blue-900/30',  sub: 'text-blue-400'  },
  green: { num: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/30', sub: 'text-green-400' },
  red:   { num: 'text-red-400',   bg: 'bg-red-50   dark:bg-red-900/20',   border: 'border-red-100   dark:border-red-900/30',   sub: 'text-red-400'   },
  gray:  { num: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-100 dark:border-gray-700', sub: 'text-gray-400' },
  cyan:  { num: 'text-cyan-500',  bg: 'bg-cyan-50  dark:bg-cyan-900/20',  border: 'border-cyan-100  dark:border-cyan-900/30',  sub: 'text-cyan-400'  },
};
function StatCard({ value, label, color }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray;
  return (
    <div className={`min-w-[110px] rounded-xl border ${c.border} ${c.bg} p-4 text-center`}>
      <div className={`text-3xl font-bold ${c.num}`}>{value}</div>
      <div className={`text-xs mt-1 ${c.sub}`}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SparesInLot() {
  const t     = useTranslation();
  const token = useSelector(selectToken);
  const locale = useSelector(getLocale);

  const [rowData,       setRowData]       = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [showResult,    setShowResult]    = useState(false);
  const [importResult,  setImportResult]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [importing,     setImporting]     = useState(false);

  const [brands,     setBrands]     = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [types,      setTypes]      = useState([]);
  const [conditions, setConditions] = useState([]);
  const [units,      setUnits]      = useState([]);

  const [categories, setCategories] = useState([]);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    axiosClient(URL_CONTROLS)
      .then(rs => {
        setConditions(rs.data.estados       ?? []);
        setSuppliers( rs.data.proveedores   ?? []);
        setBrands(    rs.data.marcas        ?? []);
        setTypes(     rs.data.tiposRepuesto ?? []);
        setUnits(     rs.data.unidades      ?? []);
        const cats = rs.data.categorias ?? [];
        setCategories(cats);
        const sc = cats.find(c => c.value === 'SC');
        if (sc) setValue('categoria', sc);
      })
      .catch(err => console.error('controls', err));
  }, []);

  // ── AsyncSelect loaders ───────────────────────────────────────────────────
  const filterOpts = useCallback((options, input) => {
    const term = input.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return options.filter(o => o.label.toLowerCase().includes(term)).slice(0, ASYNC_LIMIT);
  }, []);

  const loadSuppliers = useCallback((input, cb) => cb(filterOpts(suppliers, input)), [suppliers, filterOpts]);
  const loadBrands    = useCallback((input, cb) => cb(filterOpts(brands,    input)), [brands,    filterOpts]);

  const noOptsMsg = ({ inputValue }) =>
    inputValue.length < ASYNC_MIN_CHARS ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar` : 'Sin resultados';

  // ── Import (paso 1 → tabla) ───────────────────────────────────────────────
  const onImport = async (data) => {
    setImporting(true);
    try {
      const { rows, invalid_lines, bad_units } = parseLines(data.codes ?? '', units);

      if (invalid_lines.length > 0) {
        Swal.fire({ title: t.error, text: `${t.invalid_format_lines}: ${invalid_lines.join(', ')}`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      if (bad_units.length > 0) {
        Swal.fire({ title: t.error, text: `${t.incorrect_units}: [${bad_units.join(', ')}]`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }

      setRowData(rows);
      setShowForm(true);
    } catch (err) {
      console.error(err);
      Swal.fire({ title: t.error, text: t.unexpected_error || 'Error inesperado al procesar.', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
    } finally {
      setImporting(false);
    }
  };

  // ── Save (paso 2) ─────────────────────────────────────────────────────────
  const getCodUnit = (unit) => units.find(u => u.label?.toLowerCase() === unit.toLowerCase())?.value ?? '';

  const onSave = async (data) => {
    setSaving(true);
    try {
      const data_send = rowData.map(row => ({
        NroParte:            row.nro_part,
        DesRepuesto:         row.description,
        CodProveedor:        data.supplier?.value    ?? null,
        CodMarca:            data.brand?.value       ?? null,
        CodAplicacion:       data.application?.value ?? null,
        CodTipRepuesto:      data.type?.value        ?? null,
        CodEstadoRepuesto:   data.condition?.value   ?? null,
        CodCategoria:        data.categoria?.value   ?? 'SC',
        Peso:                row.weight,
        Costo:               row.cost,
        CanMin:              row.min_amount,
        CodUniMed:           getCodUnit(row.unit),
        PedidoEspecial:      row.special_order,
        CanDias:             row.days,
        PedEspecialSinFecha: row.special_order_without_date,
      }));

      const rs = await axiosClient.post(URL_SAVE, data_send);
      setImportResult({ ...rs.data, supplierLabel: data.supplier?.label ?? '' });
      setShowForm(false);
      setShowResult(true);
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err?.response?.data?.message || 'Error al guardar', showConfirmButton: false, timer: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setShowResult(false);
    setImportResult(null);
    setRowData(null);
    setShowForm(false);
    reset();
    const sc = categories.find(c => c.value === 'SC');
    if (sc) setValue('categoria', sc);
  };

  const onDownloadErrors = async () => {
    try {
      const rs = await axiosClient.get(URL_DOWNLOAD, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([rs.data]));
      const link = document.createElement('a');
      link.href  = url;
      const cd   = rs.headers['content-disposition'] ?? '';
      const name = cd.match(/filename="?([^";\r\n]+)"?/i)?.[1] ?? 'errores_lote.xlsx';
      link.setAttribute('download', name);
      link.className = "no-load";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ position: 'top-end', icon: 'warning', title: 'No hay errores disponibles (sesión expirada)', showConfirmButton: false, timer: 2500 });
    }
  };

  useDynamicTitle(`${t.register} | ${t.spare_parts_in_lot}`);

  return (
    <div>
      <style>{`
        :root { --select-bg: #fff; --select-border: #e0e6ed; }
        .dark  { --select-bg: #1b2e4b; --select-border: #17263c; }
      `}</style>

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li>{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.spare_parts_in_lot}</span>
        </li>
      </ul>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.spare_parts_in_lot}</h1>
        <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
      </div>

      {/* ── PASO 1: Importar ──────────────────────────────────────────────── */}
      {!showForm && !showResult && (
        <form onSubmit={handleSubmit(onImport)}>
          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-6 space-y-5">

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Pega aquí los datos copiados desde Excel (Ctrl+A → Ctrl+C en la hoja)
              </label>
              <textarea
                rows={8}
                placeholder={"3801262\tM BEARING SET...\t40.40\t2\t1\tUNIDAD\t0\t0\t0\t0"}
                {...register("codes", { required: { value: true, message: t.required_field } })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              />
              {errors.codes && <span className="text-red-500 text-xs mt-1 block">{errors.codes.message}</span>}
            </div>

            {/* Footer del panel */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => window.open('/assets/files/FormatoIngresoLote.xlsx', '_blank')}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                </svg>
                Descargar formato
              </button>

              <button type="submit" disabled={importing}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
                {importing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                    </svg>
                    {t.import_data ?? 'Importar'}
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* ── PASO 3: Resultado ────────────────────────────────────────────── */}
      {showResult && importResult && (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-10 flex flex-col items-center gap-7">

          {/* Check icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importación completada</h2>
            {importResult.supplierLabel && (
              <p className="text-sm text-gray-400 mt-1">{importResult.supplierLabel}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3">
            <StatCard value={importResult.total}       label="Total filas"         color="blue"  />
            <StatCard value={importResult.validas}     label="Filas válidas"       color="green" />
            <StatCard value={importResult.errores}     label="Filas observadas"    color="red"   />
            <StatCard value={importResult.insertados}  label="Registrados"         color="gray"  />
            <StatCard value={importResult.actualizados} label="Actualizados"       color="cyan"  />
          </div>

          {/* Error detail */}
          {importResult.hayErrores && importResult.detalleErrores?.length > 0 && (
            <div className="w-full max-w-2xl rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-4">
              <p className="text-sm font-semibold text-red-500 mb-3">Detalle de errores en importación</p>
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {importResult.detalleErrores.map((e, i) => (
                  <p key={i} className="text-xs text-red-500">
                    · Fila {e.fila}: Omitido — {e.observacion}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Download errors */}
          {importResult.hayErrores && (
            <button onClick={onDownloadErrors}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30 transition">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
              </svg>
              Descargar {importResult.errores} filas excluidas (.xlsx)
            </button>
          )}

          {/* Nueva importación */}
          <button onClick={onReset}
            className="inline-flex items-center gap-2 h-10 px-8 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] transition-all duration-150">
            Nueva Importación
          </button>

        </div>
      )}

      {/* ── PASO 2: Revisar + formulario ──────────────────────────────────── */}
      {showForm && rowData && (
        <div className="space-y-5">

          {/* Tabla previa */}
          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Resultados</span>
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                {rowData.length} registros
              </span>
            </div>
            <div className="px-0 pb-4">
              <DatatablesSparesLot t={t} data={rowData} />
            </div>
          </div>

          {/* Formulario de atributos */}
          <form onSubmit={handleSubmit(onSave)}>
            <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-6 space-y-5">

              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Atributos del lote</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.supplier} <span className="text-red-500">*</span></label>
                  <Controller name="supplier" control={control} rules={{ required: 'Seleccione un proveedor' }}
                    render={({ field }) => (
                      <AsyncSelect loadOptions={loadSuppliers} defaultOptions={false}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder="Buscar proveedor..." noOptionsMessage={noOptsMsg}
                        isClearable cacheOptions classNamePrefix="select" styles={selectStyles} className="w-full"
                        error={!!errors.supplier} />
                    )} />
                  {errors.supplier && <span className="text-red-500 text-xs mt-1 block">{errors.supplier.message}</span>}
                </div>

                {/* Aplicación */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.application} <span className="text-red-500">*</span></label>
                  <Controller name="application" control={control} rules={{ required: t.required_select }}
                    render={({ field }) => (
                      <AsyncSelect loadOptions={loadBrands} defaultOptions={false}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder="Buscar aplicación..." noOptionsMessage={noOptsMsg}
                        isClearable cacheOptions classNamePrefix="select" styles={selectStyles} className="w-full"
                        error={!!errors.application} />
                    )} />
                  {errors.application && <span className="text-red-500 text-xs mt-1 block">{errors.application.message}</span>}
                </div>

                {/* Tipo de Repuesto */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.spare_part_type} <span className="text-red-500">*</span></label>
                  <Controller name="type" control={control} rules={{ required: t.required_select }}
                    render={({ field }) => (
                      <Select instanceId="select-type" options={types}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder={t.select_option} isClearable isSearchable
                        classNamePrefix="select" styles={selectStyles} className="w-full"
                        error={!!errors.type} />
                    )} />
                  {errors.type && <span className="text-red-500 text-xs mt-1 block">{errors.type.message}</span>}
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.brand} <span className="text-red-500">*</span></label>
                  <Controller name="brand" control={control} rules={{ required: t.required_select }}
                    render={({ field }) => (
                      <AsyncSelect loadOptions={loadBrands} defaultOptions={false}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder="Buscar marca..." noOptionsMessage={noOptsMsg}
                        isClearable cacheOptions classNamePrefix="select" styles={selectStyles} className="w-full"
                        error={!!errors.brand} />
                    )} />
                  {errors.brand && <span className="text-red-500 text-xs mt-1 block">{errors.brand.message}</span>}
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.status} <span className="text-red-500">*</span></label>
                  <Controller name="condition" control={control} rules={{ required: t.required_select }}
                    render={({ field }) => (
                      <Select instanceId="select-condition" options={conditions}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder={t.select_option} isClearable isSearchable
                        classNamePrefix="select" styles={selectStyles} className="w-full"
                        error={!!errors.condition} />
                    )} />
                  {errors.condition && <span className="text-red-500 text-xs mt-1 block">{errors.condition.message}</span>}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Categoría</label>
                  <Controller name="categoria" control={control}
                    render={({ field }) => (
                      <Select instanceId="select-categoria" options={categories}
                        value={field.value} onChange={(s) => field.onChange(s ?? null)}
                        placeholder={t.select_option} isClearable isSearchable
                        classNamePrefix="select" styles={selectStyles} className="w-full" />
                    )} />
                </div>

              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  {t.btn_cancel}
                </button>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <IconSave className="h-4 w-4" />
                      {t.btn_update ?? 'Actualizar'}
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>

        </div>
      )}
    </div>
  );
}
