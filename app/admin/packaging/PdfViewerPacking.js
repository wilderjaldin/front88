'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const URL_PRINT = 'embalaje/imprimir-embalaje';

export default function PdfViewerPacking({ onClose, packages = [] }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const t = useTranslation();

  useEffect(() => {
    if (packages.length == 0) return;
    let timeout;
    let objectUrl;
    const loadPdf = async () => {
      try {
        // Espera a que el modal se muestre completamente
        timeout = setTimeout(async () => {
          // El backend espera valores numéricos únicos, no una lista repetida
          // por item — se deduplican antes de armar el string.
          const strNroOrden = [...new Set(packages.map(p => p.NroOrden))];
          const strNroOrdenCompra = [...new Set(packages.map(p => p.NroOrdenCompra))];
          const strNroRecepcion = [...new Set(packages.map(p => p.NroRecepcion))];
          const res = await axiosClient.post(
            URL_PRINT,
            {
              strNroOrden: strNroOrden.join(','),
              strNroOrdenCompra: strNroOrdenCompra.join(','),
              strNroRecepcion: strNroRecepcion.join(','),
            },
            { responseType: 'blob' }
          );
          const blob = new Blob([res.data], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
        }, 100); // Espera 100ms
      } catch (error) {
        console.error('Error al cargar PDF:', error);
      }
    };

    loadPdf();

    return () => {
      clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [packages]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="overflow-auto w-full h-[80vh] border shadow bg-white min-w-[300px]">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={pdfBlobUrl}
          download={`embalaje.pdf`}
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
