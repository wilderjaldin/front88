'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import IconPrinter from '@/components/icon/icon-printer';
import Modal from '@/components/modal';
const PdfViewerDelivery = dynamic(() => import('@/app/admin/queries/delivery-report/PdfViewerDelivery'), {
  ssr: false,
});

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// consulta/ImprimirListaEmpaque se llama dentro de PdfViewerDelivery (vista previa).
const url_invoice = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirEntrega';
// Endpoints sin confirmar todavía — ajustar cuando se defina el contrato real.
const url_label         = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirEtiqueta';
const url_delivery_receipt = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirReciboEntrega';

const downloadReport = async (url, order, token, filename) => {
  const res = await axios.post(
    url,
    { NroEntrega: order.NroEntrega, ValToken: token },
    { responseType: 'blob' }
  );
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const BtnImprimir = ({ token, t, order, className = "" }) => {

  const [show_modal, setShowModal] = useState(false);
  const [view, setView] = useState('select'); // 'select' | 'preview'
  const [downloading, setDownloading] = useState(false);

  const openSelector = () => {
    setView('select');
    setShowModal(true);
  };

  const handleDownload = async (url, filename) => {
    setDownloading(true);
    try {
      await downloadReport(url, order, token, filename);
      setShowModal(false);
    } catch (error) {
      console.error('Error al imprimir reporte:', error);
    } finally {
      setDownloading(false);
    }
  };

  const reportButtonClass = "h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition";

  return (
    <>
      <button onClick={openSelector} title={t.print ?? 'Imprimir'} className={className}>
        <IconPrinter />
      </button>

      <Modal
        size="w-full max-w-lg"
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={t.select_report}
        content={
          view === 'select' ? (
            <div className="grid grid-cols-2 gap-3">
              <button disabled={downloading} onClick={() => handleDownload(url_label, `etiqueta_${order.NroEntrega}.pdf`)} className={reportButtonClass}>
                {t.label_print}
              </button>
              <button disabled={downloading} onClick={() => handleDownload(url_invoice, `invoice_${order.NroEntrega}.pdf`)} className={reportButtonClass}>
                {t.invoice}
              </button>
              <button disabled={downloading} onClick={() => setView('preview')} className={reportButtonClass}>
                {t.packing_list}
              </button>
              <button disabled={downloading} onClick={() => handleDownload(url_delivery_receipt, `recibo_entrega_${order.NroEntrega}.pdf`)} className={reportButtonClass}>
                {t.delivery_receipt}
              </button>
            </div>
          ) : (
            <PdfViewerDelivery order={order} token={token} onClose={() => setShowModal(false)} />
          )
        }
      />
    </>
  );
};

export default BtnImprimir;
