'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';
import { saveBlob } from '@/app/lib/embalajeReports';
import '@/utils/pdfWorker';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// GET envio/{numEntrega}/resumen-costos/pdf y /excel — el PDF se muestra con el
// mismo flujo que PdfViewer.js / PdfViewerPacking.js (blob → object URL → <Document>).
const URL_PDF   = (numEntrega) => `envio/${numEntrega}/resumen-costos/pdf`;
const URL_EXCEL = (numEntrega) => `envio/${numEntrega}/resumen-costos/excel`;
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function DeliveryCostSummary({ close, t, numEntrega }) {
  const [pdfBlobUrl,  setPdfBlobUrl]  = useState(null);
  const [numPages,    setNumPages]    = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [downloadingXls, setDownloadingXls] = useState(false);

  useEffect(() => {
    let objectUrl;
    const loadPdf = async () => {
      try {
        const res = await axiosClient.get(URL_PDF(numEntrega), { responseType: 'blob' });
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setPdfBlobUrl(objectUrl);
      } catch (error) {
        setUnavailable(true);
      }
    };
    loadPdf();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [numEntrega]);

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const downloadPdf = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `RESUMEN-COSTOS-${numEntrega}.pdf`;
    link.className = 'no-load';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadExcel = async () => {
    setDownloadingXls(true);
    try {
      const res = await axiosClient.get(URL_EXCEL(numEntrega), { responseType: 'blob' });
      saveBlob(res.data, `RESUMEN-COSTOS-${numEntrega}.xlsx`, XLSX_TYPE);
    } catch (error) {
      setUnavailable(true);
    } finally {
      setDownloadingXls(false);
    }
  };

  if (unavailable) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-gray-400 text-center">
          {t.cost_summary_report_unavailable ?? 'Este reporte todavía no está disponible.'}
        </p>
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {t.close ?? 'Cerrar'}
        </button>
      </div>
    );
  }

  if (!pdfBlobUrl) return <p className="p-4">{t.loading_pdf}...</p>;

  return (
    <div className="w-full h-[80vh] border shadow bg-white min-w-[300px] flex flex-col overflow-hidden">
      {/* Barra de controles */}
      <div className="sticky top-0 z-10 px-4 py-2.5 border-b bg-gray-50 flex items-center justify-end gap-2 shadow-sm shrink-0">
        <button
          onClick={downloadPdf}
          className="h-8 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          {t.download_pdf ?? 'Descargar PDF'}
        </button>
        <button
          onClick={downloadExcel}
          disabled={downloadingXls}
          className="h-8 px-4 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {downloadingXls && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {t.download_excel ?? 'Descargar Excel'}
        </button>
        <button onClick={close} className="h-8 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          {t.close ?? 'Cerrar'}
        </button>
      </div>

      {/* Visualizador PDF */}
      <div className="flex-1 overflow-auto items-center justify-center m-auto p-2 bg-white">
        <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
          {Array.from(new Array(numPages), (_, i) => (
            <Page key={`page_${i + 1}`} pageNumber={i + 1} width={800} />
          ))}
        </Document>
      </div>
    </div>
  );
}
