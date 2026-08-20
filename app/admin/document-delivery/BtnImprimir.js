'use client';

import React, { useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import IconPrinter from '@/components/icon/icon-printer';
import Modal from '@/components/modal';
import { downloadLabel, downloadPackingList, downloadDeliveryReceipt, downloadInvoice } from '@/app/lib/embalajeReports';

// NAFTA/TAB sin confirmar todavía — ajustar cuando se defina el contrato real.
const URL_NAFTA = 'entregadocumentos/imprimir-nafta';
const URL_TAB   = 'entregadocumentos/imprimir-tab';

const downloadReport = async (url, row, filename) => {
  const res = await axiosClient.post(url, { numEmbalaje: row.NumEmbalaje }, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  link.classList.add('no-load');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const BtnImprimir = ({ t, row, className = "", onOpenDispatch }) => {

  const [show_modal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Sin Núm. Despacho todavía no hay reportes que imprimir — primero hay que
  // completar los datos de despacho.
  const handleClick = () => {
    if (!row.NumDespacho) {
      onOpenDispatch?.(row);
      return;
    }
    setShowModal(true);
  };

  const handleDownload = async (url, filename) => {
    setDownloading(true);
    try {
      await downloadReport(url, row, filename);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir reporte:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDeliveryReceipt = async () => {
    setDownloading(true);
    try {
      await downloadDeliveryReceipt(row.NumEmbalaje);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir recibo de entrega:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await downloadInvoice(row.NumEmbalaje, row.NumDespacho);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir invoice:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadLabel = async () => {
    setDownloading(true);
    try {
      await downloadLabel(row.NumEmbalaje);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir etiqueta:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPackingList = async () => {
    setDownloading(true);
    try {
      await downloadPackingList(row.NumEmbalaje, row.NumDespacho);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir lista de empaque:', error);
    } finally {
      setDownloading(false);
    }
  };

  const reportButtonClass = "h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition";

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
          <div className="grid grid-cols-2 gap-3">
            <button disabled={downloading} onClick={handleDownloadLabel} className={reportButtonClass}>
              {t.label_print}
            </button>
            <button disabled={downloading} onClick={handleDownloadInvoice} className={reportButtonClass}>
              {t.invoice}
            </button>
            <button disabled={downloading} onClick={handleDownloadPackingList} className={reportButtonClass}>
              {t.packing_list}
            </button>
            <button disabled={downloading} onClick={handleDownloadDeliveryReceipt} className={reportButtonClass}>
              {t.delivery_receipt}
            </button>
            {/* NAFTA solo aplica a ciertos envíos (ej. destino US/México/Canadá) — condición
                sin confirmar todavía, se deja siempre deshabilitado hasta definirla. */}
            <button disabled className={reportButtonClass}>
              NAFTA
            </button>
            <button disabled={downloading} onClick={() => handleDownload(URL_TAB, `tab_${row.NumEmbalaje}.pdf`)} className={reportButtonClass}>
              TAB
            </button>
          </div>
        }
      />
    </>
  );
};

export default BtnImprimir;
