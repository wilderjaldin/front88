'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

export default function PdfViewerOrder({ order, token, onClose }) {
  const [pdfBlobUrl,   setPdfBlobUrl]   = useState(null);
  const [pdfFilename,  setPdfFilename]  = useState('orden-compra.pdf');
  const [numPages,     setNumPages]     = useState(null);
  const t = useTranslation();

  useEffect(() => {
    const nro = order?.nroOrdenCompra ?? order?.NroOrdenCompra ?? order?.NroOrden;
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

  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="overflow-auto w-full h-[80vh] border shadow bg-white min-w-[300px]">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={pdfBlobUrl}
          download={pdfFilename}
          className="btn btn-primary rounded hover:bg-blue-700"
        >
          { t.download_pdf }
        </a>
        {(onClose) &&
          <button
            onClick={onClose} // 👈 dispara cierre + updateList
            className="btn btn-success rounded"
          >
            { t.btn_close }
          </button>
        }
      </div>

      {pdfBlobUrl && (

        <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
          {Array.from(new Array(numPages), (_, i) => (
            <Page key={`page_${i + 1}`} pageNumber={i + 1} />
          ))}
        </Document>
      )}
    </div>
  );
}