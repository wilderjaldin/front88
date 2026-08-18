'use client';

import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalConfirm } from '@/app/lib/swal';
import IconDownload from '@/components/icon/icon-download';
import IconSave from '@/components/icon/icon-save';

import '@/utils/pdfWorker';

const URL_GENERATE = 'ordenescompra/generar-oc';
// Endpoint sin confirmar todavía — se ajusta cuando se defina el contrato real.
const URL_PREVIEW_EXCEL = 'ordenescompra/preview-oc-excel';

const btnBase = "h-8 inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

export default function PdfViewerPreviewOC({ t, pdfBlobUrl, payload, onClose, onGenerated, onOrderGenerated }) {
  const [numPages, setNumPages] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleGenerate = async () => {
    const result = await swalConfirm(
      t.question_generate_purchase_order ?? '¿Generar la Orden de Compra?',
      t.generate_purchase_order_hint ?? 'Esta acción crea la orden de compra definitiva.',
      { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#16a34a' }
    );
    if (!result.isConfirmed) return;

    setGenerating(true);
    try {
      const rs = await axiosClient.post(URL_GENERATE, payload);
      if (Array.isArray(rs.data?.asignados)) {
        onOrderGenerated?.(rs.data.asignados);
      }
      if (rs.data?.numOrdenCompra) {
        onGenerated?.(rs.data.numOrdenCompra);
      }
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? t.error, t.close ?? 'Cerrar');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await axiosClient.post(URL_PREVIEW_EXCEL, payload, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.className = 'no-load';
      link.setAttribute('download', 'preview-oc.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? t.error, t.close ?? 'Cerrar');
    } finally {
      setDownloadingExcel(false);
    }
  };

  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="flex flex-col h-[80vh] border shadow bg-white">
      {/* Barra de acciones — fija, no se mueve con el scroll del PDF */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-2 border-b border-gray-100 px-3 py-2.5 bg-white">
        <button
          type="button"
          onClick={onClose}
          disabled={generating}
          className={`${btnBase} border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t.back ?? 'Volver'}
        </button>

        <a
          href={pdfBlobUrl}
          download="preview-oc.pdf"
          className={`${btnBase} bg-primary text-white hover:bg-primary/90`}
        >
          <IconDownload className="h-3.5 w-3.5" />
          {t.download_pdf}
        </a>

        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={downloadingExcel}
          className={`${btnBase} border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30`}
        >
          <IconDownload className="h-3.5 w-3.5" />
          {downloadingExcel ? (t.downloading ?? 'Descargando…') : (t.download_excel ?? 'Descargar Excel')}
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className={`${btnBase} bg-green-600 hover:bg-green-700 text-white`}
        >
          <IconSave className="h-3.5 w-3.5" />
          {generating ? (t.saving ?? 'Generando…') : t.generate_purchase_order}
        </button>
      </div>

      {/* PDF — única zona con scroll */}
      <div className="flex-1 overflow-auto min-w-0">
        <div className="flex justify-center">
          <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
            {Array.from(new Array(numPages), (_, i) => (
              <Page key={`page_${i + 1}`} pageNumber={i + 1} width={760} />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
