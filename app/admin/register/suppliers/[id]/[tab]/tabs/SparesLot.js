'use client';
import { useEffect, useRef, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalConfirm } from '@/app/lib/swal';
import { Pagination } from '@mantine/core';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';

const PAGE_SIZE = 20;

const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2 whitespace-nowrap";

const ESTADO_OPTIONS = (t) => [
  { value: 'AC',  label: t.active   ?? 'Activos' },
  { value: 'IN',  label: t.inactive ?? 'Inactivos' },
  { value: 'ALL', label: t.all      ?? 'Todos' },
];

// Sin CodEstado explícito (vacío/null — no se completa con "AC" por defecto al
// importar) se muestra como Activo, mismo criterio que el filtro del backend.
const EstadoBadge = ({ codEstado, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEstado === 'IN'
    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    }`}>
    {codEstado === 'IN' ? (t.inactive ?? 'Inactivo') : (t.active ?? 'Activo')}
  </span>
);

// Celda genérica — las columnas las define el backend (preview.columns), acá
// solo se le da un trato visual especial a codEstado (badge AC/IN).
function CellValue({ colKey, value, t }) {
  if (value === null || value === undefined || value === '')
    return <span className="text-gray-300 dark:text-gray-600">—</span>;
  if (colKey === 'codEstado') return <EstadoBadge codEstado={value} t={t} />;
  return <span>{String(value)}</span>;
}

// ── Panel "Agregar en lote" — wizard de 4 pasos, mismo patrón que
// spares-site/import y spares-suppliers (Cargar → Previsualizar → Limpieza →
// Resultado). Dos métodos de carga, cada uno con su propio par de endpoints:
//   texto (pegado, TSV: NroParte · DesRepuesto · CodEstado) → .../importar/texto/*
//   excel (archivo, encabezados NroParte|DesRepuesto|CodEstado) → .../importar/excel/*
function BulkAddPanel({ codPrv, onClose, onImported }) {
  const t = useTranslation();
  const fileInputRef = useRef(null);

  const [step,     setStep]     = useState(1);
  const [text,     setText]     = useState('');
  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode,     setMode]     = useState(null); // 'texto' | 'excel' — se fija al procesar

  const [preview,      setPreview]      = useState(null);
  const [importResult, setImportResult] = useState(null);

  const [loadingValidate, setLoadingValidate] = useState(false);
  const [loadingImport,   setLoadingImport]   = useState(false);
  const [loadingExport,   setLoadingExport]   = useState(false);

  const urlFor = (m, action) => `proveedores/${codPrv}/repuestos-prv/importar/${m}/${action}`;

  const onFileSelected = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      swalError(t.error ?? 'Error', t.invalid_file_format ?? 'Solo se aceptan archivos .xlsx o .xls', t.close);
      return;
    }
    setFile(f);
  };

  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); onFileSelected(e.dataTransfer.files?.[0]); };
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleValidate = async () => {
    const useExcel = !!file;
    if (!useExcel && !text.trim()) return;
    const m = useExcel ? 'excel' : 'texto';

    setLoadingValidate(true);
    try {
      let rs;
      if (useExcel) {
        const form = new FormData();
        form.append('archivo', file);
        rs = await axiosClient.post(urlFor('excel', 'validar'), form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        rs = await axiosClient.post(urlFor('texto', 'validar'), { texto: text });
      }
      setMode(m);
      setPreview(rs.data);
      setStep(2);
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.message ?? (t.process_error ?? 'No se pudo procesar el contenido.'), t.close);
    } finally {
      setLoadingValidate(false);
    }
  };

  const handleImport = async () => {
    const cleanCount = preview?.totalValidos ?? 0;
    const result = await swalConfirm(
      t.question_confirm_import ?? '¿Confirmar importación?',
      `${t.will_register ?? 'Se registrarán'} ${cleanCount} ${t.spares_lot ?? 'Repuestos Lote'}.`,
      { confirmText: t.yes_import ?? 'Sí, importar', cancelText: t.btn_cancel }
    );
    if (!result.isConfirmed) return;

    setLoadingImport(true);
    try {
      let rs;
      if (mode === 'excel') {
        const form = new FormData();
        form.append('archivo', file);
        rs = await axiosClient.post(urlFor('excel', 'registrar'), form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        rs = await axiosClient.post(urlFor('texto', 'registrar'), { texto: text });
      }
      setImportResult(rs.data);
      setStep(4);
      onImported?.();
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.message ?? (t.import_error ?? 'No se pudo completar la importación.'), t.close);
    } finally {
      setLoadingImport(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (mode !== 'excel' || !file) return;
    setLoadingExport(true);
    try {
      const form = new FormData();
      form.append('archivo', file);
      const rs = await axiosClient.post(urlFor('excel', 'exportar-errores'), form, { responseType: 'blob', headers: { 'Content-Type': 'multipart/form-data' } });

      const disposition = rs.headers?.['content-disposition'] ?? '';
      const matchStar  = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
      const matchPlain = disposition.match(/filename=["']?([^"';\s]+)["']?/i);
      const fileName   = matchStar ? decodeURIComponent(matchStar[1].trim())
        : matchPlain ? decodeURIComponent(matchPlain[1].trim())
        : 'repuestos_lote_errores.xlsx';

      const url = window.URL.createObjectURL(new Blob([rs.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = fileName; a.className = 'no-load';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      swalError(t.error ?? 'Error', t.export_errors_error ?? 'No se pudo generar el Excel de errores.', t.close);
    } finally {
      setLoadingExport(false);
    }
  };

  const resetAll = () => {
    setStep(1); setText(''); setFile(null); setMode(null);
    setPreview(null); setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const columns    = preview?.columns ?? [];
  const cleanRows  = preview?.rows ?? [];
  const errorRows  = (preview?.errorRows ?? []).map((row, i) => ({ row, obs: preview?.warnings?.[i] ?? '' }));
  const cleanCount = preview?.totalValidos ?? 0;
  const errorCount = preview?.totalOmitidos ?? 0;

  const STEPS = [
    { n: 1, label: t.load_data ?? 'Cargar' },
    { n: 2, label: t.preview ?? 'Previsualizar' },
    { n: 3, label: t.cleanup ?? 'Limpieza' },
    { n: 4, label: t.result ?? 'Resultado' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {t.bulk_add ?? 'Agregar en lote'}
        </h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* STEPPER */}
      <div className="flex items-center select-none flex-wrap gap-y-2">
        {STEPS.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${step >= n ? "bg-primary text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                {step > n
                  ? <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  : n}
              </div>
              <span className={`text-xs font-medium ${step >= n ? "text-primary" : "text-gray-400"}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-3 h-px w-10 transition-colors ${step > n ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`} />
            )}
          </div>
        ))}
      </div>

      {/* PASO 1 — Cargar */}
      {step === 1 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pegar */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t.paste_from_excel ?? 'Pegar desde Excel'} — {t.columns ?? 'Columnas'}: Nro. Parte · Descripción · Estado
              </label>
              <textarea
                rows={6}
                value={text}
                disabled={!!file}
                onChange={(e) => setText(e.target.value)}
                placeholder={'3415661\tACCELERATOR COIEL\tAC'}
                className="form-textarea w-full font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Importar archivo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t.import_from_excel ?? 'Importar desde Excel'}
              </label>
              {file ? (
                <div className="flex items-center justify-between h-[120px] rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/10 px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 shrink-0 ml-2">
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors h-[120px]
                    ${dragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => onFileSelected(e.target.files?.[0])} />
                  <svg className="mb-2 h-7 w-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.drag_or_click ?? 'Arrastra aquí o haz clic para seleccionar'}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">.xlsx · .xls — {t.headers ?? 'encabezados'}: NroParte | DesRepuesto | CodEstado</p>
                </div>
              )}
            </div>
          </div>

          <button type="button" onClick={handleValidate} disabled={(!text.trim() && !file) || loadingValidate}
            className="flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed">
            {loadingValidate ? (t.processing ?? 'Procesando…') : (t.process_and_preview ?? 'Procesar y previsualizar')}
          </button>
        </>
      )}

      {/* PASO 2 — Previsualizar (oculta pegar/importar, solo el resultado) */}
      {step === 2 && preview && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{preview.total} {t.rows ?? 'filas'}</span>
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">{cleanCount} {t.valid ?? 'válidas'}</span>
              {errorCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                  {errorCount} {t.with_errors ?? 'con error'}
                </span>
              )}
            </div>
            <button type="button" onClick={() => setStep(1)}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              {t.btn_back ?? 'Volver'}
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400">#</th>
                    {columns.map(col => <th key={col.key} className="px-3 py-2 text-left text-gray-500">{col.label}</th>)}
                    <th className="px-3 py-2 text-left text-amber-500">{t.observation ?? 'Observación'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {cleanRows.map((row, i) => (
                    <tr key={`c${i}`}>
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      {columns.map(col => <td key={col.key} className="px-3 py-1.5"><CellValue colKey={col.key} value={row[col.key]} t={t} /></td>)}
                      <td className="px-3 py-1.5 text-green-600">✓ OK</td>
                    </tr>
                  ))}
                  {errorRows.map(({ row, obs }, i) => (
                    <tr key={`e${i}`} className="bg-red-50/40 dark:bg-red-900/10">
                      <td className="px-3 py-1.5 text-gray-400">{cleanRows.length + i + 1}</td>
                      {columns.map(col => <td key={col.key} className="px-3 py-1.5"><CellValue colKey={col.key} value={row[col.key]} t={t} /></td>)}
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">{obs}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.total > cleanRows.length + errorRows.length && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500 text-center">
                {t.showing_n_of_total?.replace('{n}', cleanRows.length + errorRows.length).replace('{total}', preview.total)
                  ?? `Mostrando ${cleanRows.length + errorRows.length} de ${preview.total} registros.`}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setStep(3)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition">
            {t.continue_to_cleanup ?? 'Continuar a Limpieza'}
          </button>
        </>
      )}

      {/* PASO 3 — Limpieza */}
      {step === 3 && preview && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                {cleanCount} {t.ready_to_import ?? 'listos para importar'}
              </span>
              {errorCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                  {errorCount} {t.excluded ?? 'excluidos'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)}
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                {t.btn_back ?? 'Volver'}
              </button>
              <button type="button" onClick={handleImport} disabled={loadingImport || cleanCount === 0}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {loadingImport ? (t.importing ?? 'Importando…') : `${t.btn_import ?? 'Importar'} ${cleanCount}`}
              </button>
            </div>
          </div>

          {errorCount > 0 && mode === 'excel' && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2.5">
              <p className="text-xs text-red-600 dark:text-red-500">{errorCount} {t.excluded_rows_hint ?? 'filas excluidas. Descarga el Excel, corrígelas y vuelve a cargarlas.'}</p>
              <button type="button" onClick={handleDownloadErrors} disabled={loadingExport}
                className="flex items-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition disabled:opacity-50 shrink-0 ml-3">
                {loadingExport ? (t.generating ?? 'Generando…') : (t.download_errors ?? 'Descargar errores')}
              </button>
            </div>
          )}
        </>
      )}

      {/* PASO 4 — Resultado */}
      {step === 4 && importResult && (
        <div className="flex flex-col items-center justify-center py-10 gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t.import_completed ?? 'Importación completada'}</h4>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-center min-w-[90px]">
              <div className="text-xl font-bold text-green-600">{importResult.registrados ?? 0}</div>
              <div className="text-[11px] text-green-500 mt-0.5">{t.registered ?? 'Registrados'}</div>
            </div>
            {(importResult.actualizados ?? 0) > 0 && (
              <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-3 text-center min-w-[90px]">
                <div className="text-xl font-bold text-cyan-600">{importResult.actualizados}</div>
                <div className="text-[11px] text-cyan-500 mt-0.5">{t.updated ?? 'Actualizados'}</div>
              </div>
            )}
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-center min-w-[90px]">
              <div className="text-xl font-bold text-red-500">{importResult.errores ?? 0}</div>
              <div className="text-[11px] text-red-400 mt-0.5">{t.observed ?? 'Observados'}</div>
            </div>
          </div>

          {importResult.detalleErrores?.length > 0 && (
            <div className="w-full max-w-md rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {importResult.detalleErrores.map((e, i) => <li key={i} className="text-xs text-red-600 dark:text-red-400">· {e}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={resetAll}
              className="h-9 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 transition">
              {t.new_import ?? 'Nueva Importación'}
            </button>
            <button type="button" onClick={onClose}
              className="h-9 rounded-lg border border-gray-300 dark:border-gray-600 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {t.close ?? 'Cerrar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Repuestos importados en lote directamente al proveedor (genartprv / RepuestoProveedor).
export default function SparesLot() {
  const { proveedor } = useSupplier();
  const t = useTranslation();

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [term,    setTerm]    = useState('');
  const [estado,  setEstado]  = useState('AC');
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const params = { page, term };
      if (estado !== 'ALL') params.codEstado = estado;
      const rs = await axiosClient.get(`proveedores/${proveedor.codPrv}/repuestos-prv`, { params });
      setRows(rs.data?.data ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [page, term, estado]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {t.spares_lot ?? 'Repuestos Lote'} <span className="font-normal text-gray-400">({total})</span>
        </h2>

        <div className="flex flex-wrap items-end gap-3">
          {!showAdd && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
                <Select isClearable={false} options={ESTADO_OPTIONS(t)}
                  value={ESTADO_OPTIONS(t).find(o => o.value === estado) ?? null}
                  onChange={opt => { setPage(1); setEstado(opt.value); }}
                  menuPortalTarget={portalTarget}
                  styles={{ control: (b) => ({ ...b, minWidth: '130px', width: '130px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                />
              </div>
              <SearchFilter t={t} value={term}
                onSearch={(v) => { setPage(1); setTerm(v); }}
                onClear={() => { setPage(1); setTerm(''); }}
                placeholder={t.nro_part_ph ?? 'Nro. Parte...'} className="w-56" />
            </>
          )}
          <button type="button" onClick={() => setShowAdd(v => !v)}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition
              ${showAdd ? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'bg-primary text-white hover:bg-primary/90'}`}>
            {showAdd ? <IconX className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
            {showAdd ? (t.btn_cancel ?? 'Cancelar') : (t.bulk_add ?? 'Agregar en lote')}
          </button>
        </div>
      </div>

      {showAdd ? (
        <BulkAddPanel
          codPrv={proveedor.codPrv}
          onClose={() => setShowAdd(false)}
          onImported={() => { setPage(1); fetchRows(); }}
        />
      ) : (
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            {t.no_records ?? 'Sin registros'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                    <th className={thClass}>{t.description ?? 'Descripción'}</th>
                    <th className={thClass}>{t.status}</th>
                    <th className={thClass}>{t.registered_on ?? 'Registrado'}</th>
                    <th className={thClass}>{t.modified_on ?? 'Modificado'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((r) => (
                    <tr key={r.codRegistro} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className={`${tdClass} font-medium text-gray-800 dark:text-gray-100`}>{r.nroParte}</td>
                      <td className={tdClass}>
                        <span className="block truncate max-w-[260px]" title={r.desRepuesto}>{r.desRepuesto}</span>
                      </td>
                      <td className={tdClass}><EstadoBadge codEstado={r.codEstado} t={t} /></td>
                      <td className={tdClass}>
                        <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                          <div>{r.usuarioRegistra || '—'}</div>
                          <div className="text-gray-400">{r.fecRegistra}</div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                          <div>{r.usuarioModifica || '—'}</div>
                          <div className="text-gray-400">{r.fecModifica}</div>
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
          </>
        )}
      </div>
      )}
    </div>
  );
}
