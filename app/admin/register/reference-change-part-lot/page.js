"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';
import DataTable from "@/app/admin/register/reference-change-part-lot/table";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconSave from '@/components/icon/icon-save';

const URL_BRANDS = 'repuestos/marcas';
const URL_SAVE   = 'referenciascruzadas/registro';

// ── Stat card ─────────────────────────────────────────────────────────────────
const COLOR_MAP = {
  green: { num: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-100 dark:border-green-900/30', sub: 'text-green-400' },
  cyan:  { num: 'text-cyan-500',  bg: 'bg-cyan-50  dark:bg-cyan-900/20',    border: 'border-cyan-100  dark:border-cyan-900/30',  sub: 'text-cyan-400'  },
  blue:  { num: 'text-blue-500',  bg: 'bg-blue-50  dark:bg-blue-900/20',    border: 'border-blue-100  dark:border-blue-900/30',  sub: 'text-blue-400'  },
};
function StatCard({ value, label, color }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={`min-w-[130px] rounded-xl border ${c.border} ${c.bg} p-5 text-center`}>
      <div className={`text-3xl font-bold ${c.num}`}>{value}</div>
      <div className={`text-xs mt-1.5 ${c.sub}`}>{label}</div>
    </div>
  );
}

// ── Parseo TSV ────────────────────────────────────────────────────────────────
function parseLines(text, brands) {
  const lines          = text.split(/\r\n|\r|\n/);
  const rows           = [];
  const unknown_brands = [];

  const findBrand = (name) => {
    const n = name?.trim()?.toLowerCase();
    if (!n) return null;
    return brands.find(b => b.label.toLowerCase() === n) ?? null;
  };

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(/\t/);
    if (cols.length < 4) continue;

    const brand1 = findBrand(cols[1]);
    const brand2 = findBrand(cols[3]);

    if (!brand1) unknown_brands.push(cols[1]?.trim());
    if (!brand2) unknown_brands.push(cols[3]?.trim());

    rows.push({
      nro_part_1:   cols[0]?.trim(),
      brand_1:      cols[1]?.trim(),
      brand_code_1: brand1?.value ?? 0,
      nro_part_2:   cols[2]?.trim(),
      brand_2:      cols[3]?.trim(),
      brand_code_2: brand2?.value ?? 0,
    });
  }

  return { rows, unknown_brands: [...new Set(unknown_brands)] };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReferenceChangePartLot() {
  const t = useTranslation();

  const [brands,     setBrands]     = useState([]);
  const [rowData,    setRowData]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [importing,  setImporting]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    axiosClient(URL_BRANDS)
      .then(rs => setBrands(rs.data ?? []))
      .catch(err => console.error('brands', err));
  }, []);

  // ── Paso 1: parsear y validar ─────────────────────────────────────────────
  const onImport = (data) => {
    setImporting(true);
    try {
      const { rows, unknown_brands } = parseLines(data.codes ?? '', brands);

      if (rows.length === 0) {
        Swal.fire({ title: t.error, text: t.data_entered_is_incorrect, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      if (unknown_brands.length > 0) {
        Swal.fire({ title: t.error, text: `${t.incorrect_brands} [${unknown_brands.join(', ')}]`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }

      setRowData(rows);
      setShowForm(true);
    } finally {
      setImporting(false);
    }
  };

  // ── Paso 2: guardar ───────────────────────────────────────────────────────
  const onSave = async () => {
    setSaving(true);
    Swal.fire({ html: t.saving_data, timerProgressBar: true, allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });

    try {
      const payload = rowData.map(row => ({
        NroParte1: row.nro_part_1,
        CodMarca1: row.brand_code_1,
        NroParte2: row.nro_part_2,
        CodMarca2: row.brand_code_2,
      }));

      const rs = await axiosClient.post(URL_SAVE, payload);
      Swal.close();

      if (rs.data.success) {
        setSaveResult({ total: rowData.length, ...rs.data });
        setShowForm(false);
        setShowResult(true);
      }
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err?.response?.data?.message || 'Error al guardar', showConfirmButton: false, timer: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setShowResult(false);
    setSaveResult(null);
    setRowData(null);
    setShowForm(false);
    reset();
  };

  useDynamicTitle(`${t.register} | ${t.change_part_in_lot}`);

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li>{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.change_part_in_lot}</span>
        </li>
      </ul>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.change_part_in_lot}</h1>
        <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
      </div>

      {/* ── PASO 1: Pegar datos ───────────────────────────────────────────── */}
      {!showForm && !showResult && (
        <form onSubmit={handleSubmit(onImport)}>
          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-6 space-y-5">

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Pega aquí los datos copiados desde Excel (4 columnas: Nro.Parte 1 · Aplicación 1 · Nro.Parte 2 · Aplicación 2)
              </label>
              <textarea
                rows={8}
                placeholder={"84058860\tCNH\t86593627\tCNH\n87697169\tCNH\t87749106\tCNH"}
                {...register("codes", { required: { value: true, message: t.required_field } })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
              />
              {errors.codes && <span className="text-red-500 text-xs mt-1 block">{errors.codes.message}</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => window.open('/assets/files/FormatoIngresoLote.xlsx', '_blank')}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                </svg>
                {t.download_batch_format}
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

      {/* ── PASO 2: Previsualizar + confirmar ────────────────────────────── */}
      {showForm && rowData && (
        <div className="space-y-5">

          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Vista previa</span>
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                {rowData.length} registros
              </span>
            </div>
            <div className="px-0 pb-4">
              <DataTable items={rowData} t={t} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setRowData(null); }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                {t.btn_cancel}
              </button>
              <button type="button" onClick={onSave} disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
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

        </div>
      )}

      {/* ── PASO 3: Resultado ────────────────────────────────────────────── */}
      {showResult && saveResult && (
        <div className="bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-10 flex flex-col items-center gap-7">

          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Importación completada</h2>
            <p className="text-sm text-gray-400 mt-1">Referencias cruzadas registradas correctamente</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <StatCard value={saveResult.total}      label="Total enviados"      color="blue"  />
            <StatCard value={saveResult.insertados} label="Nuevos registros"    color="green" />
            <StatCard value={saveResult.fusiones}   label="Fusiones aplicadas"  color="cyan"  />
          </div>

          <button onClick={onReset}
            className="inline-flex items-center gap-2 h-10 px-8 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] transition-all duration-150">
            Nueva Importación
          </button>

        </div>
      )}
    </div>
  );
}
