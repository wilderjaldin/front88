'use client';
import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import { downloadBlob } from '@/app/lib/downloadBlob';

const URL_LABELS_DATA = 'recepcion/etiquetas';
const URL_GEN_LABELS_PDF = {
  pendientes: 'recepcion/etiquetas/pendientes/pdf',
  recibidas:  'recepcion/etiquetas/recibidas/pdf',
};

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-left whitespace-nowrap select-none";
const tdClass = "text-[11px] text-gray-700 dark:text-gray-300 px-2 py-1";

const LabelsSection = ({ t, title, rows, loading, selected, onToggleRow, onToggleAll, format, onFormatChange, values, onValueChange, onGenPdf, generating }) => {
  const allChecked = rows.length > 0 && selected.length === rows.length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h4>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-3.5 w-3.5" checked={allChecked} onChange={onToggleAll} />
            {t.all}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-3.5 w-3.5" checked={format === 'mediano'} onChange={() => onFormatChange(format === 'mediano' ? null : 'mediano')} />
            {t.medium_format}
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" className="form-checkbox h-3.5 w-3.5" checked={format === 'pequeno'} onChange={() => onFormatChange(format === 'pequeno' ? null : 'pequeno')} />
            {t.small_format}
          </label>
          <button
            type="button"
            onClick={onGenPdf}
            disabled={selected.length === 0 || generating}
            className="inline-flex items-center h-7 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary transition"
          >
            {generating ? (t.saving ?? 'Generando…') : t.gen_pdf}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-8`} />
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.nro_part_customer}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.ordered_amount}</th>
                <th className={`${thClass} text-center`}>{t.missing_amount}</th>
                <th className={`${thClass} text-center`}>{t.print}</th>
                <th className={`${thClass} text-center`}>{t.copies}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={8} className="py-6 text-center text-xs text-gray-400">{t.loading}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.codItem ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5" checked={selected.includes(i)} onChange={() => onToggleRow(i)} />
                  </td>
                  <td className={`${tdClass} text-primary`}>{r.nroParte}</td>
                  <td className={tdClass}>{r.nroParteCliente}</td>
                  <td className={tdClass}>{r.desRepuesto}</td>
                  <td className={`${tdClass} text-center`}>{r.canOrdenada}</td>
                  <td className={`${tdClass} text-center`}>{r.canFaltante}</td>
                  <td className={tdClass}>
                    <input
                      type="number" min={0}
                      value={values[i]?.imprimir ?? r.canImprimir ?? r.canFaltante ?? 0}
                      onChange={(e) => onValueChange(i, 'imprimir', e.target.value)}
                      className="h-7 w-16 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 text-center text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="number" min={1}
                      value={values[i]?.copias ?? r.numCopias ?? 1}
                      onChange={(e) => onValueChange(i, 'copias', e.target.value)}
                      className="h-7 w-14 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 text-center text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PrintLabelsModal = ({ t, selected_orders = [], close }) => {
  const [pendientes, setPendientes] = useState([]);
  const [recibidas,  setRecibidas]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [selPendientes, setSelPendientes] = useState([]);
  const [selRecibidas,  setSelRecibidas]  = useState([]);
  const [formatPendientes, setFormatPendientes] = useState('pequeno');
  const [formatRecibidas,  setFormatRecibidas]  = useState('pequeno');
  const [valuesPendientes, setValuesPendientes] = useState({});
  const [valuesRecibidas,  setValuesRecibidas]  = useState({});
  const [generatingPendientes, setGeneratingPendientes] = useState(false);
  const [generatingRecibidas,  setGeneratingRecibidas]  = useState(false);

  useEffect(() => { getData(); }, []);

  const getData = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.post(URL_LABELS_DATA, {
        numOrdenCompra: selected_orders.map(o => o.NumOrdenCompra),
      });
      setPendientes(Array.isArray(rs.data?.pendientes) ? rs.data.pendientes : []);
      setRecibidas(Array.isArray(rs.data?.recibidas) ? rs.data.recibidas : []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (setSel) => (i) =>
    setSel(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const toggleAll = (rows, sel, setSel) => () =>
    setSel(sel.length === rows.length ? [] : rows.map((_, i) => i));

  const setValue = (setValues) => (i, field, value) =>
    setValues(prev => ({ ...prev, [i]: { ...prev[i], [field]: value } }));

  const buildItems = (rows, selected, values) => selected.map(i => {
    const r = rows[i];
    return {
      numOrdenCompra: r.numOrdenCompra,
      nroCotizacion:  r.nroCotizacion,
      codItem:        r.codItem,
      nroParte:       r.nroParte,
      imprimir:       Number(values[i]?.imprimir ?? r.canImprimir ?? r.canFaltante ?? 0),
      copias:         Number(values[i]?.copias ?? r.numCopias ?? 1),
    };
  });

  const genPdf = async (section, rows, selected, values, format, setGenerating) => {
    if (selected.length === 0) return;
    setGenerating(true);
    try {
      const res = await axiosClient.post(
        URL_GEN_LABELS_PDF[section],
        { formatoMediano: format === 'mediano', items: buildItems(rows, selected, values) },
        { responseType: 'blob' }
      );
      downloadBlob(res.data, `etiquetas-${section}.pdf`);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <LabelsSection
        t={t}
        title={t.pending_receiving}
        rows={pendientes}
        loading={loading}
        selected={selPendientes}
        onToggleRow={toggleRow(setSelPendientes)}
        onToggleAll={toggleAll(pendientes, selPendientes, setSelPendientes)}
        format={formatPendientes}
        onFormatChange={setFormatPendientes}
        values={valuesPendientes}
        onValueChange={setValue(setValuesPendientes)}
        onGenPdf={() => genPdf('pendientes', pendientes, selPendientes, valuesPendientes, formatPendientes, setGeneratingPendientes)}
        generating={generatingPendientes}
      />

      <LabelsSection
        t={t}
        title={t.already_received}
        rows={recibidas}
        loading={loading}
        selected={selRecibidas}
        onToggleRow={toggleRow(setSelRecibidas)}
        onToggleAll={toggleAll(recibidas, selRecibidas, setSelRecibidas)}
        format={formatRecibidas}
        onFormatChange={setFormatRecibidas}
        values={valuesRecibidas}
        onValueChange={setValue(setValuesRecibidas)}
        onGenPdf={() => genPdf('recibidas', recibidas, selRecibidas, valuesRecibidas, formatRecibidas, setGeneratingRecibidas)}
        generating={generatingRecibidas}
      />

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
        >
          {t.btn_cancel}
        </button>
      </div>
    </div>
  );
};

export default PrintLabelsModal;
