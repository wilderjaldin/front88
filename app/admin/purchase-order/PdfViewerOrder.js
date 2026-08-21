'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import IconDownload from '@/components/icon/icon-download';
import IconMail from '@/components/icon/icon-mail';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const URL_PREVIEW_EXCEL = 'ordenescompra/preview-oc-excel';

const btnBase = "h-8 inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

export default function PdfViewerOrder({ order, token, payload, onClose, onSendMessage }) {
  const [pdfBlobUrl,   setPdfBlobUrl]   = useState(null);
  const [pdfFilename,  setPdfFilename]  = useState('orden-compra.pdf');
  const [numPages,     setNumPages]     = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const t = useTranslation();

  const nro = order?.nroOrdenCompra ?? order?.NroOrdenCompra ?? order?.NroOrden;

  useEffect(() => {
    if (!nro) return;
    let timeout;
    const loadPdf = async () => {
      try {
        timeout = setTimeout(async () => {
          const res = await axiosClient.get(`ordenescompra/${nro}/pdf`, { responseType: 'blob' });
          const disposition = res.headers['content-disposition'] ?? '';
          const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/i);
          setPdfFilename(match ? match[1].trim() : `OC${nro}.pdf`);
          const blob = new Blob([res.data], { type: 'application/pdf' });
          setPdfBlobUrl(URL.createObjectURL(blob));
        }, 100);
      } catch (error) {
        console.error('Error al cargar PDF:', error);
      }
    };

    loadPdf();

    return () => {
      clearTimeout(timeout);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [order, token]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Mismo endpoint que la Vista Previa OC (ordenescompra/{nro}/excel no existe en
  // el backend) — reutiliza el payload con el que se generó la orden.
  const handleDownloadExcel = async () => {
    if (!payload) return;
    setDownloadingExcel(true);
    try {
      const res = await axiosClient.post(URL_PREVIEW_EXCEL, payload, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.className = 'no-load';
      link.setAttribute('download', `OC${nro}.xlsx`);
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
        <a
          href={pdfBlobUrl}
          download={pdfFilename}
          className={`${btnBase} bg-primary text-white hover:bg-primary/90`}
        >
          <IconDownload className="h-3.5 w-3.5" />
          { t.download_pdf }
        </a>

        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={downloadingExcel || !payload}
          className={`${btnBase} border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30`}
        >
          <IconDownload className="h-3.5 w-3.5" />
          {downloadingExcel ? (t.downloading ?? 'Descargando…') : (t.download_excel ?? 'Descargar Excel')}
        </button>

        {onSendMessage && (
          <button
            type="button"
            onClick={onSendMessage}
            className={`${btnBase} bg-sky-600 hover:bg-sky-700 text-white`}
          >
            <IconMail className="h-3.5 w-3.5" />
            {t.mail_supplier_title ?? 'Mail a Proveedor'}
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${btnBase} border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800`}
          >
            { t.btn_close }
          </button>
        )}
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
