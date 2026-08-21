'use client';

import React, { useState } from 'react';
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import Modal from '@/components/modal';
import { swalError } from '@/app/lib/swal';
import {
  downloadLabel, downloadPackingList, downloadDeliveryReceipt, downloadInvoice, downloadCombinedReports,
} from '@/app/lib/embalajeReports';

// "tipo" es el valor que espera el endpoint combinado (?tipos=...). NAFTA no está
// en esta lista: sin endpoint todavía, se muestra deshabilitado aparte.
const REPORT_TYPES = [
  { key: 'label',            tipo: 'etiqueta',        labelKey: 'label_print',      download: (row) => downloadLabel(row.NumEmbalaje) },
  { key: 'invoice',          tipo: 'invoice',          labelKey: 'invoice',          download: (row) => downloadInvoice(row.NumEmbalaje, row.NumDespacho) },
  { key: 'packing_list',     tipo: 'lista-empaque',    labelKey: 'packing_list',     download: (row) => downloadPackingList(row.NumEmbalaje, row.NumDespacho) },
  { key: 'delivery_receipt', tipo: 'recibo-entrega',   labelKey: 'delivery_receipt', download: (row) => downloadDeliveryReceipt(row.NumEmbalaje) },
];

const tabBtnClass = (active) =>
  `relative z-10 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
    active ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
  }`;

const reportButtonClass = "h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition";

const BtnImprimir = ({ t, row, className = "", onOpenDispatch }) => {

  const [show_modal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState('individual'); // 'individual' | 'custom' | 'all'
  const [selected, setSelected] = useState(() => new Set());

  // Sin Núm. Despacho todavía no hay reportes que imprimir — primero hay que
  // completar los datos de despacho.
  const handleClick = () => {
    if (!row.NumDespacho) {
      onOpenDispatch?.(row);
      return;
    }
    setMode('individual');
    setSelected(new Set());
    setShowModal(true);
  };

  const label = (rt) => rt.staticLabel ?? t[rt.labelKey];

  // "Uno por uno": el modal se queda abierto para poder bajar otro reporte
  // sin tener que volver a abrirlo.
  const runDownloads = async (keys) => {
    setDownloading(true);
    try {
      for (const key of keys) {
        const rt = REPORT_TYPES.find(r => r.key === key);
        if (rt) await rt.download(row);
      }
    } catch (error) {
      console.error('Error al imprimir reportes:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Personalizada/Todo: un solo PDF combinado (embalajes/{id}/reportes/pdf).
  const runCombinedDownload = async (keys) => {
    if (keys.length === 0) return;
    setDownloading(true);
    try {
      const tipos = keys.map(key => REPORT_TYPES.find(rt => rt.key === key)?.tipo).filter(Boolean);
      await downloadCombinedReports(row.NumEmbalaje, row.NumDespacho, tipos);
      setShowModal(false);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    } finally {
      setDownloading(false);
    }
  };

  const toggleSelected = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <>
      <button type="button" onClick={handleClick} title={t.print_documents} className={className}>
        <IconPrinter className="h-3.5 w-3.5" />
      </button>

      <Modal
        size="w-full max-w-lg"
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={t.select_report}
        content={
          <div className="space-y-4">
            {/* Modo: uno por uno / personalizada / todo */}
            <div className="relative inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 gap-1">
              <button type="button" onClick={() => setMode('individual')} className={tabBtnClass(mode === 'individual')}>
                {t.report_mode_single ?? 'Uno por uno'}
              </button>
              <button type="button" onClick={() => setMode('custom')} className={tabBtnClass(mode === 'custom')}>
                {t.report_mode_custom ?? 'Personalizada'}
              </button>
              <button type="button" onClick={() => setMode('all')} className={tabBtnClass(mode === 'all')}>
                {t.report_mode_all ?? 'Todo'}
              </button>
            </div>

            {/* ── Uno por uno: cada botón descarga ese reporte al toque ─────── */}
            {mode === 'individual' && (
              <div className="grid grid-cols-2 gap-3">
                {REPORT_TYPES.map(rt => (
                  <button
                    key={rt.key}
                    disabled={downloading}
                    onClick={() => runDownloads([rt.key])}
                    className={reportButtonClass}
                  >
                    {label(rt)}
                  </button>
                ))}
                {/* NAFTA solo aplica a ciertos envíos (ej. destino US/México/Canadá) —
                    condición sin confirmar todavía, se deja siempre deshabilitado. */}
                <button disabled className={reportButtonClass}>
                  NAFTA
                </button>
              </div>
            )}

            {/* ── Personalizada: elegir cuáles y descargarlos juntos ─────────── */}
            {mode === 'custom' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(rt => (
                    <label
                      key={rt.key}
                      className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:border-primary/60 transition select-none"
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-3.5 w-3.5"
                        checked={selected.has(rt.key)}
                        onChange={() => toggleSelected(rt.key)}
                      />
                      {label(rt)}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={downloading || selected.size === 0}
                  onClick={() => runCombinedDownload([...selected])}
                  className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  {t.download_selected ?? 'Descargar seleccionados'}{selected.size > 0 ? ` (${selected.size})` : ''}
                </button>
              </div>
            )}

            {/* ── Todo: los 4 reportes disponibles combinados en un PDF ──────── */}
            {mode === 'all' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.download_all_hint ?? 'Descarga los reportes disponibles: Etiqueta, Invoice, Lista Empaque y Recibo Entrega (NAFTA no está disponible).'}
                </p>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => runCombinedDownload(REPORT_TYPES.map(rt => rt.key))}
                  className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconDownload className="h-3.5 w-3.5" />
                  {t.download_all ?? 'Descargar todo'}
                </button>
              </div>
            )}
          </div>
        }
      />
    </>
  );
};

export default BtnImprimir;
