"use client";
import { useRef, useState, useMemo } from "react";
import Swal from "sweetalert2";
import axiosClient from "@/app/lib/axiosClient";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

// ── Proveedores disponibles ───────────────────────────────────────────────
const SUPPLIERS = [
  { id: 4,   label: "K TRACTOR" },
  { id: 3,   label: "MAXIFORCE" },
  { id: 120, label: "HR CONSTRUCTION PARTS" },
  { id: 7,   label: "HERCULES" },
];

const URL_VALIDATE      = "repuestos/importar-proveedor/validar";
const URL_IMPORT        = "repuestos/importar-proveedor/registrar";
const URL_EXPORT_ERRORS = "repuestos/importar-proveedor/exportar-errores";

// ── Utilidades ────────────────────────────────────────────────────────────

function detectDuplicates(rows) {
  const seen = new Map();
  rows.forEach((row, idx) => {
    const key = `${row.nroParte}||${row.peso}||${row.costo}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(idx);
  });
  const dupes = new Set();
  seen.forEach((indices) => {
    if (indices.length > 1) indices.forEach((i) => dupes.add(i));
  });
  return dupes;
}

function buildWarningsMap(warnings) {
  const map = new Map();
  warnings.forEach((w) => {
    const m = w.match(/^Fila (\d+):/);
    if (m) {
      const rowIdx = parseInt(m[1], 10) - 2;
      const msg    = w.replace(/^Fila \d+:\s*/, "");
      const prev   = map.get(rowIdx);
      map.set(rowIdx, prev ? `${prev} / ${msg}` : msg);
    }
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SparesSupplierImportPage() {
  useDynamicTitle("Importar | Repuestos por Proveedor");

  const fileInputRef = useRef(null);

  const [supplierId,       setSupplierId]       = useState(null);
  const [file,             setFile]             = useState(null);
  const [dragging,         setDragging]         = useState(false);
  const [step,             setStep]             = useState(1);
  const [preview,          setPreview]          = useState({ columns: [], rows: [], rawRows: [], total: 0, warnings: [] });
  const [importResult,     setImportResult]     = useState(null);
  const [loadingValidate,  setLoadingValidate]  = useState(false);
  const [loadingImport,    setLoadingImport]    = useState(false);
  const [loadingExport,    setLoadingExport]    = useState(false);
  const [errorRowsForExport, setErrorRowsForExport] = useState([]);

  const selectedSupplier = SUPPLIERS.find((s) => s.id === supplierId);

  const duplicateSet = useMemo(() => detectDuplicates(preview.rows), [preview.rows]);
  const warningsMap  = useMemo(() => buildWarningsMap(preview.warnings ?? []), [preview.warnings]);

  const enrichedRows = useMemo(() => {
    return preview.rows.map((row, idx) => {
      const parts = [];
      if (duplicateSet.has(idx)) parts.push("Duplicado");
      const warn = warningsMap.get(idx);
      if (warn) parts.push(warn);
      return {
        row,
        rawRow:      preview.rawRows?.[idx] ?? {},
        obs:         parts.join(" / "),
        isDuplicate: duplicateSet.has(idx),
        hasError:    parts.length > 0,
      };
    });
  }, [preview.rows, preview.rawRows, duplicateSet, warningsMap]);

  const resetAll = () => {
    setSupplierId(null);
    setFile(null);
    setPreview({ columns: [], rows: [], rawRows: [], total: 0, warnings: [] });
    setImportResult(null);
    setErrorRowsForExport([]);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileSelected = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      Swal.fire({ icon: "warning", title: "Formato inválido", text: "Solo se aceptan archivos .xlsx o .xls", confirmButtonColor: "#4361ee" });
      return;
    }
    setFile(f);
    if (step > 1) setStep(1);
  };

  const handleFileInput = (e) => onFileSelected(e.target.files?.[0]);
  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); onFileSelected(e.dataTransfer.files?.[0]); };
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleValidate = async () => {
    if (!supplierId) { Swal.fire({ icon: "warning", title: "Selecciona un proveedor", confirmButtonColor: "#4361ee" }); return; }
    if (!file)       { Swal.fire({ icon: "warning", title: "Selecciona un archivo",   confirmButtonColor: "#4361ee" }); return; }

    setLoadingValidate(true);
    Swal.fire({ title: "Procesando archivo...", text: "El servidor está leyendo y validando el Excel.",
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

    try {
      const form = new FormData();
      form.append("archivo",      file);
      form.append("codProveedor", supplierId);
      const rs = await axiosClient.post(URL_VALIDATE, form, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.close();
      setPreview(rs.data);
      setStep(2);
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;

      // Cerrar el Swal de loading ANTES de abrir el de error
      // (finally lo cerraría después, tapando el mensaje)
      Swal.close();

      if (status === 400 && message) {
        Swal.fire({
          icon: "warning",
          title: "Archivo no válido",
          text: message,
          confirmButtonColor: "#4361ee",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al procesar",
          text: message ?? "No se pudo leer el archivo. Verifica el formato.",
          confirmButtonColor: "#4361ee",
        });
      }
    } finally { setLoadingValidate(false); }
  };

  const handleGoToClean = () => {
    setErrorRowsForExport(enrichedRows.filter((r) => r.hasError));
    setStep(3);
  };

  const handleDownloadErrors = async () => {
    if (!errorRowsForExport.length) return;
    setLoadingExport(true);

    // El nombre lo genera el servidor: ktractor_errores_{codUsuario}_{horaBase36}.xlsx
    // NO se construye nombre local ni se envía nombreArchivo en el payload.
    const payload = {
      rows: errorRowsForExport.map(({ rawRow, obs }) => ({ rawData: rawRow, observacion: obs })),
    };

    try {
      const rs = await axiosClient.post(
        `${URL_EXPORT_ERRORS}?codProveedor=${supplierId}`, payload,
        { responseType: "blob", headers: { "Content-Type": "application/json" } }
      );

      // El nombre viene del servidor vía Content-Disposition.
      // Requiere .WithExposedHeaders("Content-Disposition") en la config CORS del backend.
      const disposition = rs.headers?.["content-disposition"] ?? "";
      const matchStar   = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
      const matchPlain  = disposition.match(/filename=["']?([^"';\s]+)["']?/i);
      const fileName    = matchStar
        ? decodeURIComponent(matchStar[1].trim())
        : matchPlain
          ? decodeURIComponent(matchPlain[1].trim())
          : `errores_importacion.xlsx`;

      const url = window.URL.createObjectURL(new Blob([rs.data]));
      const a   = document.createElement("a");
      a.href      = url;
      a.download  = fileName;
      a.className = "no-load";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Error al generar el archivo",
        text: "No se pudo generar el Excel de errores.", confirmButtonColor: "#4361ee" });
    } finally { setLoadingExport(false); }
  };

  const handleImport = async () => {
    const cleanCount = enrichedRows.filter((r) => !r.hasError).length;
    const confirm = await Swal.fire({
      title: "¿Confirmar importación?",
      html: `Se registrarán <strong>${cleanCount}</strong> repuestos del proveedor <strong>${selectedSupplier?.label}</strong>.`,
      icon: "question", showCancelButton: true, confirmButtonColor: "#4361ee",
      confirmButtonText: "Sí, importar", cancelButtonText: "Cancelar", reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setLoadingImport(true);
    Swal.fire({ title: "Importando...", allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });

    try {
      const form = new FormData();
      form.append("archivo",      file);
      form.append("codProveedor", supplierId);
      const rs = await axiosClient.post(URL_IMPORT, form, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.close();
      setImportResult(rs.data);
      setStep(4);
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Error al importar",
        text: err?.response?.data?.message ?? "No se pudo completar la importación.",
        confirmButtonColor: "#4361ee" });
    } finally { setLoadingImport(false); }
  };

  const STEPS = [
    { n: 1, label: "Configurar"    },
    { n: 2, label: "Previsualizar" },
    { n: 3, label: "Limpieza"      },
    { n: 4, label: "Resultado"     },
  ];

  const cleanCount = enrichedRows.filter((r) => !r.hasError).length;

  return (
    <div>

      {/* BREADCRUMB */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Importar Repuestos por Proveedor
        </li>
      </ul>

      {/* TÍTULO */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Importar Repuestos por Proveedor</h1>
        <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
      </div>

      {/* STEPPER */}
      <div className="flex items-center mb-8 select-none flex-wrap gap-y-2">
        {STEPS.map(({ n, label }, idx) => (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors
                ${step >= n ? "bg-primary text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                {step > n
                  ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  : n}
              </div>
              <span className={`text-sm font-medium ${step >= n ? "text-primary" : "text-gray-400"}`}>{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-4 h-px w-12 transition-colors ${step > n ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PASO 1 — Configurar                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">1. Selecciona el proveedor</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Cada proveedor tiene una estructura de Excel diferente. El servidor aplicará la lógica correspondiente.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SUPPLIERS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSupplierId(s.id)}
                  className={`flex flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition
                    ${supplierId === s.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/40 text-gray-700 dark:text-gray-300"}`}>
                  <span className="text-[10px] font-bold tracking-widest text-gray-400">#{s.id}</span>
                  <span className="text-sm font-semibold mt-0.5">{s.label}</span>
                </button>
              ))}
            </div>
            {supplierId && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2 text-xs text-primary">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proveedor seleccionado: <strong>{selectedSupplier?.label}</strong>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">2. Carga el archivo Excel</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Arrastra el .xlsx del proveedor o haz clic para seleccionarlo.</p>
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors min-h-[160px]
                ${dragging ? "border-primary bg-primary/5"
                  : file ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
              {file ? (
                <>
                  <svg className="mb-3 h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar</p>
                </>
              ) : (
                <>
                  <svg className="mb-3 h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Arrastra aquí o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-400 mt-1">.xlsx · .xls</p>
                </>
              )}
            </div>
            <button type="button" onClick={handleValidate} disabled={!file || !supplierId || loadingValidate}
              className="mt-5 w-full h-10 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed">
              Procesar y previsualizar
            </button>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PASO 2 — Previsualizar                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedSupplier?.label}</span>
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">{preview.total} registros totales</span>
              {enrichedRows.filter((r) => r.hasError).length > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                  {enrichedRows.filter((r) => r.hasError).length} con observaciones
                </span>
              )}
              {duplicateSet.size > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {duplicateSet.size} duplicados
                </span>
              )}
              <span className="text-xs text-gray-400">{file?.name}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Volver
              </button>
              <button type="button" onClick={handleGoToClean}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Continuar a Limpieza
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded bg-gray-200 dark:bg-gray-600" /> Duplicado (Nro Parte + Peso + Costo)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Fila con advertencia</span>
          </div>

          <PreviewTable
            columns={preview.columns}
            enrichedRows={enrichedRows}
            total={preview.total}
            previewCount={preview.rows.length}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PASO 3 — Limpieza                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedSupplier?.label}</span>
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                {cleanCount} listos para importar
              </span>
              {errorRowsForExport.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                  {errorRowsForExport.length} excluidos
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                Volver
              </button>
              <button type="button" onClick={handleImport} disabled={loadingImport || cleanCount === 0}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                Importar {cleanCount} registros
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Filas limpias — se importarán</p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500">{cleanCount} filas sin observaciones serán enviadas a la base de datos.</p>
            </div>

            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Filas excluidas — con observaciones</p>
                </div>
                {errorRowsForExport.length > 0 && (
                  <DownloadButton onClick={handleDownloadErrors} loading={loadingExport} />
                )}
              </div>
              <p className="text-xs text-red-600 dark:text-red-500">
                {errorRowsForExport.length} filas excluidas. Descarga el Excel, corrígelas y vuelve a cargarlas.
              </p>
            </div>
          </div>

          {/* Tabla filas limpias */}
          {cleanCount > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Vista previa — filas que se importarán</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <th className="w-10 px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      {preview.columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedRows.filter((r) => !r.hasError).map(({ row }, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-primary/5 ${idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"}`}>
                        <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                        {preview.columns.map((col) => (
                          <td key={col.key} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <CellValue colKey={col.key} value={row[col.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla filas excluidas */}
          {errorRowsForExport.length > 0 && (
            <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 flex items-center justify-between">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Filas excluidas (con observaciones)</p>
                <span className="text-xs text-red-500">{errorRowsForExport.length} filas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-red-50/50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-800">
                      <th className="w-10 px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      {preview.columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-500 uppercase tracking-wider whitespace-nowrap">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorRowsForExport.map(({ row, obs }, idx) => (
                      <tr key={idx} className="border-b border-red-50 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50">
                        <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                        {preview.columns.map((col) => (
                          <td key={col.key} className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <CellValue colKey={col.key} value={row[col.key]} dimmed />
                          </td>
                        ))}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">{obs}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PASO 4 — Resultado                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && importResult && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Importación completada</h2>
            <p className="text-sm text-gray-500">{selectedSupplier?.label} · {file?.name}</p>
          </div>

          {/* ── Cards Excel (izquierda) + separador + Cards BD (derecha) ── */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl">

            {/* Grupo Excel */}
            <ResultCard value={preview.total}               label="Total en Excel"   color="blue"  />
            <ResultCard value={preview.totalValidos  ?? 0}  label="Filas válidas"    color="green" />
            <ResultCard value={importResult.errores  ?? 0}  label="Filas observadas" color="red"   />

            {/* Separador */}
            <div className="hidden sm:flex flex-col items-center self-stretch justify-center px-3">
              <div className="w-px h-full min-h-[72px] bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Grupo BD */}
            <ResultCard value={importResult.registrados  ?? 0} label="Registrados"  color="green" />
            <ResultCard value={importResult.actualizados ?? 0} label="Actualizados" color="cyan"  />

          </div>

          {importResult.detalleErrores?.length > 0 && (
            <div className="w-full max-w-2xl rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Detalle de errores en importación</p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {importResult.detalleErrores.map((e, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">· {e}</li>
                ))}
              </ul>
            </div>
          )}

          {errorRowsForExport.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <DownloadButton onClick={handleDownloadErrors} loading={loadingExport} count={errorRowsForExport.length} />
              <p className="text-xs text-gray-400">En formato original del proveedor · corrígelas y vuelve a cargarlas</p>
            </div>
          )}

          <button type="button" onClick={resetAll}
            className="h-10 rounded-lg bg-primary px-8 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition">
            Nueva Importación
          </button>

        </div>
      )}

    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────

function PreviewTable({ columns, enrichedRows, total, previewCount }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="w-10 px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-amber-500 uppercase tracking-wider whitespace-nowrap">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {enrichedRows.map(({ row, obs, isDuplicate, hasError }, idx) => (
              <tr key={idx} className={`border-b border-gray-100 dark:border-gray-800 transition-colors
                ${isDuplicate ? "bg-gray-100 dark:bg-gray-700/60 opacity-70"
                  : hasError ? "bg-amber-50/40 dark:bg-amber-900/10"
                  : idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"
                } hover:bg-primary/5`}>
                <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-2.5 whitespace-nowrap ${isDuplicate ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                    <CellValue colKey={col.key} value={row[col.key]} dimmed={isDuplicate} />
                  </td>
                ))}
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {obs ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                      ${isDuplicate ? "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}>
                      {obs}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {previewCount < total && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 text-center">
          Mostrando {previewCount} de {total} registros. Todos serán procesados al importar.
        </div>
      )}
    </div>
  );
}

function DownloadButton({ onClick, loading, count }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="flex items-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700
        px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400
        hover:bg-red-200 dark:hover:bg-red-900/60 transition disabled:opacity-50 disabled:cursor-not-allowed">
      {loading
        ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
      }
      {loading ? "Generando..." : count ? `Descargar ${count} filas excluidas (.xlsx)` : "Descargar .xlsx"}
    </button>
  );
}

/**
 * Renderiza el valor de una celda con estilo semántico según su key.
 * Las keys son las mismas que devuelve el backend (independientes por proveedor).
 */
function CellValue({ colKey, value, dimmed = false }) {
  if (value === null || value === undefined || value === "")
    return <span className="text-gray-300 dark:text-gray-600">—</span>;

  const muted = dimmed ? "opacity-60" : "";

  // Columnas monetarias
  if (["costo", "precio", "netPrice", "listPrice", "tuPrecio"].includes(colKey)) {
    const n = parseFloat(value);
    return <span className={`${muted} font-medium tabular-nums`}>{isNaN(n) ? value : `$${n.toFixed(2)}`}</span>;
  }

  // Peso en libras
  if (colKey === "peso" || colKey === "pesoLb") {
    const n = parseFloat(value);
    return <span className={`${muted} tabular-nums text-blue-600 dark:text-blue-400`}>{isNaN(n) ? "—" : `${n} lb`}</span>;
  }

  // Columnas de stock / cantidades
  if (["stock", "canStock", "pedSinFecha", "cantidad", "enAlmacen"].includes(colKey)) {
    const n = parseInt(value);
    return (
      <span className={`${muted} inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
        ${n > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
        {isNaN(n) ? value : n}
      </span>
    );
  }

  // Tipo de repuesto
  if (colKey === "tipoRepuesto") {
    return (
      <span className={`${muted} inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
        bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`}>
        {String(value)}
      </span>
    );
  }

  // Aplicación (marca del equipo)
  if (colKey === "aplicacion") {
    return (
      <span className={`${muted} inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
        bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>
        {String(value)}
      </span>
    );
  }

  // Nro Parte — monospace para facilitar lectura
  if (colKey === "nroParte") {
    return <span className={`${muted} font-mono text-xs`}>{String(value)}</span>;
  }

  return <span className={muted}>{String(value)}</span>;
}

function ResultCard({ value, label, color }) {
  const styles = {
    blue:  "border-blue-200  dark:border-blue-800  bg-blue-50  dark:bg-blue-900/20  text-blue-600  dark:text-blue-400",
    green: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    red:   "border-red-200   dark:border-red-800   bg-red-50   dark:bg-red-900/20   text-red-600   dark:text-red-400",
    amber: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    cyan:  "border-cyan-200  dark:border-cyan-800  bg-cyan-50  dark:bg-cyan-900/20  text-cyan-600  dark:text-cyan-400",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${styles[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}