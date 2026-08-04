'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconSave from '@/components/icon/icon-save';
import Modal from '@/components/modal';
import PrintLabelsModal from '@/app/admin/purchase-reception/print-labels-modal';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axios from 'axios'

const url_verify = process.env.NEXT_PUBLIC_API_URL + 'recepcion/ValidarDatosRecepcion';
const URL_SAVE_ITEMS = 'recepcion/guardar-items';

const PAGE_SIZE = 20;

const thClass = "text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-left select-none";
const tdClass = "text-[11px] text-gray-700 dark:text-gray-300 px-2 py-0.5";
const cellTdClass = "p-0 border-r border-b border-gray-100 dark:border-gray-700";
const cellInputClass = "h-6 w-full px-1.5 bg-transparent text-[11px] border-0 rounded-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50";
const cellInputBorderedClass = "h-6 w-full px-1.5 bg-white dark:bg-gray-900 text-[11px] border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary/50";

// Columnas editables, en orden — define tanto el input como la navegación tipo Excel.
const ITEM_COLUMNS = [
  { key: 'amount',       type: 'number', widthPx: 80,  align: 'text-center' },
  { key: 'origen',       type: 'text',   widthPx: 90 },
  { key: 'code',         type: 'text',   widthPx: 90 },
  { key: 'material',     type: 'text',   widthPx: 90 },
  { key: 'presentacion', type: 'text',   widthPx: 100 },
  { key: 'note',         type: 'text',   widthPx: 140 },
];

const Receptions = ({ token, t, data, setReceptions, selected_orders, onRefresh }) => {

  const [page,   setPage]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeText, setBarcodeText] = useState('');

  const {
    register,
    getValues,
    setValue,
  } = useForm()

  useEffect(() => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CanRecibida || '');
      setValue(`orders_${o.id}_origen`, o.Origen);
      setValue(`orders_${o.id}_code`, o.HCode);
      setValue(`orders_${o.id}_material`, o.Material);
      setValue(`orders_${o.id}_presentacion`, o.Presentacion);
      setValue(`orders_${o.id}_note`, o.NotaItem);
    });
  }, [data]);

  useEffect(() => { setPage(1); }, [data]);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData    = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Navegación tipo Excel entre celdas editables de la tabla.
  const cellRefs = useRef({});
  const focusCell = (row, col) => {
    const el = cellRefs.current[`${row}_${col}`];
    if (el) { el.focus(); el.select?.(); }
  };
  const handleCellKeyDown = (e, row, col) => {
    const lastRow = pageData.length - 1;
    const lastCol = ITEM_COLUMNS.length - 1;
    const isNumber = e.target.type === 'number';
    const atStart  = isNumber || e.target.selectionStart === 0;
    const atEnd    = isNumber || e.target.selectionStart === e.target.value.length;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (row < lastRow) focusCell(row + 1, col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) focusCell(row - 1, col);
    } else if (e.key === 'ArrowRight' && atEnd) {
      e.preventDefault();
      if (col < lastCol) focusCell(row, col + 1);
    } else if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      if (col > 0) focusCell(row, col - 1);
    }
  };

  // Combina el registro de react-hook-form con la ref propia usada para la navegación.
  const registerCell = (name, row, col) => {
    const field = register(name);
    return {
      ...field,
      ref: (el) => {
        field.ref(el);
        cellRefs.current[`${row}_${col}`] = el;
      },
      onKeyDown: (e) => handleCellKeyDown(e, row, col),
    };
  };

  const handleReceiveAll = () => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CantFaltante);
    })
  }

  const handleSaveChanges = async () => {
    if (data.length > 0) {
      const is_valid = await verify(data);
      if (is_valid) {
        saveDataReception();
      } else {
        Swal.fire({
          title: t.error,
          text: t.attached_tems_does_not_match_the_orders,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    }
  }

  const verify = async (data) => {
    try {
      let NumOrdenCompra = [];

      selected_orders.map(o => {
        NumOrdenCompra.push(`${o.NumOrdenCompra}`);
      });
      let CadNroOrdenCompra = NumOrdenCompra.join(",");

      let data_send = {
        CadNroOrdenCompra: CadNroOrdenCompra,
        CantItems: data.length,
        ValToken: token
      }

      const rs = await axios.post(url_verify, data_send);
      if (rs.data.estado == 'Ok') {
        return true;
      } else {
        return false;
      }
    } catch (error) {

      return false;
    }
  }

  // Payload de recepcion/guardar-items — compartido entre "Guardar Recepción" y "Guardar Nota".
  const buildItems = () => data.map((o) => ({
    NumOrdenCompra: o.NumOrdenCompra,
    nroCotizacion: o.NroOrden,
    CodItem: o.CodItem,
    CodRepuesto: o.CodRepuesto,
    // NroParte/NroParteCompra en el payload corresponden a los campos crudos del backend
    // (nroParte/nroParteCompra), invertidos respecto a como se mapean en pantalla.
    NroParte: o.NroParteCliente,
    NroParteCompra: o.NroParte,
    CanRecibida: getValues(`orders_${o.id}_amount`) || 0,
    DesRepuesto: o.Descripcion,
    Nota: getValues(`orders_${o.id}_note`),
    Presentacion: getValues(`orders_${o.id}_presentacion`),
    Material: getValues(`orders_${o.id}_material`),
    Origen: getValues(`orders_${o.id}_origen`),
    HCode: getValues(`orders_${o.id}_code`),
  }));

  const saveDataReception = async () => {
    setSaving(true);
    try {
      const different = data.some(o => {
        const amount = getValues(`orders_${o.id}_amount`);
        return amount < 1 || amount > o.CantFaltante;
      });

      if (different) {
        Swal.fire({
          icon: "error",
          title: t.save_puschase_receipt_amount_error
        });
        setSaving(false);
        return;
      }

      await axiosClient.post(URL_SAVE_ITEMS, { items: buildItems() });

      swalSuccess(t.save_puschase_receipt_success);
      setReceptions([]);
      onRefresh?.();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_puschase_receipt_error, t.close);
    }
    setSaving(false);
  }

  // Guarda solo Origen/H Code/Material/Presentación/Nota, sin exigir Cant. Recibida válida
  // (a diferencia de "Guardar Recepción", no cierra la recepción ni limpia la lista).
  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await axiosClient.post(URL_SAVE_ITEMS, { items: buildItems() });
      swalSuccess(t.save_puschase_receipt_success);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_puschase_receipt_error, t.close);
    }
    setSavingNote(false);
  }

  const handleBarcodeAccept = () => {
    const codes = barcodeText.split('\n').map(s => s.trim()).filter(Boolean);
    setShowBarcodeModal(false);
    setBarcodeText('');
    if (codes.length === 0) return;

    const counts = {};
    codes.forEach(c => { counts[c] = (counts[c] ?? 0) + 1; });

    let matched = 0;
    data.forEach((o) => {
      const code = counts[o.NroParte] != null ? o.NroParte : (counts[o.NroParteCliente] != null ? o.NroParteCliente : null);
      if (!code) return;
      const current = Number(getValues(`orders_${o.id}_amount`)) || 0;
      const next = Math.min(current + counts[code], o.CantFaltante);
      setValue(`orders_${o.id}_amount`, next);
      matched++;
    });

    if (matched > 0) {
      swalSuccess(t.save_puschase_receipt_success);
    } else {
      swalError(t.error, t.no_matches, t.close);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t.purchase_reception}
          <span className="ml-2 text-sm font-normal text-gray-400">({data.length})</span>
        </h2>
        <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.export_list}
        </button>

        <button
          type="button"
          onClick={() => setShowLabelsModal(true)}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.print_labels}
        </button>

        <button
          type="button"
          onClick={() => setShowBarcodeModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {t.barcode}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleReceiveAll}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.receive_all}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleSaveNote}
          disabled={data.length === 0 || savingNote}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {savingNote ? (t.saving ?? 'Guardando…') : t.save_note}
        </button>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={data.length === 0 || saving}
          className="btn btn-success inline-flex items-center gap-2 h-9 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {saving ? (t.saving ?? 'Guardando…') : t.save_reception}
        </button>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} text-center`} style={{ width: 64 }}>{t.nro_purchase_order}</th>
                <th className={`${thClass} text-center`} style={{ width: 64 }}>{t.nro_order}</th>
                <th className={thClass} style={{ width: 240 }}>{t.customer}</th>
                <th className={thClass} style={{ width: 100 }}>{t.nro_part}</th>
                <th className={thClass} style={{ width: 100 }}>{t.nro_part_customer}</th>
                <th className={thClass} style={{ width: 180 }}>{t.description}</th>
                <th className={`${thClass} text-center`} style={{ width: 56 }}>{t.missing_amount}</th>
                <th className={`${thClass} text-center`} style={{ width: 80 }}>{t.amount_received}</th>
                <th className={thClass} style={{ width: 90 }}>Origen</th>
                <th className={thClass} style={{ width: 90 }}>{t.h_code}</th>
                <th className={thClass} style={{ width: 90 }}>Material</th>
                <th className={thClass} style={{ width: 100 }}>{t.presentation}</th>
                <th className={thClass}>{t.note}</th>
              </tr>
            </thead>

            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, rowIndex) => {
                const index = o.id ?? data.indexOf(o);
                return (
                <tr key={index}>
                  <td className={`${tdClass} text-center font-medium border-b border-gray-100 dark:border-gray-700`}>{o.NumOrdenCompra}</td>
                  <td className={`${tdClass} text-center border-b border-gray-100 dark:border-gray-700`}>{o.NroOrden}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.NomCliente}</td>
                  <td className={`${tdClass} text-primary border-b border-gray-100 dark:border-gray-700`}>{o.NroParte}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.NroParteCliente}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.Descripcion}</td>
                  <td className={`${tdClass} text-center border-b border-gray-100 dark:border-gray-700`}>{o.CantFaltante}</td>
                  <td className={cellTdClass}>
                    <input
                      step="any" type="number"
                      {...registerCell(`orders_${index}_amount`, rowIndex, 0)}
                      className={`${cellInputBorderedClass} text-center`}
                    />
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_origen`, rowIndex, 1)} className={cellInputClass} />
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_code`, rowIndex, 2)} className={cellInputClass} />
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_material`, rowIndex, 3)} className={cellInputClass} />
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_presentacion`, rowIndex, 4)} className={cellInputClass} />
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_note`, rowIndex, 5)} className={cellInputClass} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}

      {/* Modal Exportar Lista */}
      <Modal showModal={showExportModal} closeModal={() => setShowExportModal(false)} title={t.export_list} size="w-full max-w-3xl">
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm text-gray-400">{t.pending_backend_integration}</p>
        </div>
      </Modal>

      {/* Modal Imprimir Etiquetas */}
      <Modal showModal={showLabelsModal} closeModal={() => setShowLabelsModal(false)} title={t.print_labels} size="w-full max-w-4xl">
        {showLabelsModal && (
          <PrintLabelsModal t={t} selected_orders={selected_orders} close={() => setShowLabelsModal(false)} />
        )}
      </Modal>

      {/* Modal Código de Barra */}
      <Modal showModal={showBarcodeModal} closeModal={() => setShowBarcodeModal(false)} title={t.read_barcode} size="w-full max-w-lg">
        <div className="space-y-3">
          <textarea
            autoFocus
            rows={10}
            value={barcodeText}
            onChange={(e) => setBarcodeText(e.target.value)}
            placeholder={t.read_barcode}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleBarcodeAccept}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
            >
              {t.accept}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Receptions;
