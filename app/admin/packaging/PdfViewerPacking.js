'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const url_proforma = process.env.NEXT_PUBLIC_API_URL + 'embalaje/ImprimirPacking';


export default function PdfViewerPacking({ token, onClose, packages = [] }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const t = useTranslation();

  useEffect(() => {
    if (packages.length == 0 || !token) return;
    let timeout;
    const loadPdf = async () => {
      try {
        // Espera a que el modal se muestre completamente
        timeout = setTimeout(async () => {
          let strNroOrden = [];
          let strNroOrdenCompra = [];
          let strNroRecepcion = [];
          packages.map(p => {
            strNroOrden.push(p.NroOrden);
            strNroOrdenCompra.push(p.NroOrdenCompra);
            strNroRecepcion.push(p.NroRecepcion);
          })
          const res = await axios.post(
            url_proforma,
            {
              strNroOrden: strNroOrden.join(','),
              strNroOrdenCompra: strNroOrdenCompra.join(','),
              strNroRecepcion: strNroRecepcion.join(','),
              ValToken: token
            },
            { responseType: 'blob' }
          );
          const blob = new Blob([res.data], { type: 'application/pdf' });
          setPdfBlobUrl(URL.createObjectURL(blob));
        }, 100); // Espera 100ms
      } catch (error) {
        console.error('Error al cargar PDF:', error);
      }
    };

    loadPdf();

    return () => {
      clearTimeout(timeout);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [packages, token]);

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