'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const url_proforma = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirListaEmpaque';

export default function PdfViewerDelivery({ order, token, onLoaded }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const t = useTranslation();

  useEffect(() => {
    if (!order?.NroEntrega || !token) return;
    let timeout;
    
    const loadPdf = async () => {
      try {
        // Espera a que el modal se muestre completamente
        timeout = setTimeout(async () => {
          const res = await axios.post(
            url_proforma,
            { NroEntrega: order.NroEntrega, ValToken: token },
            { responseType: 'blob' }
          );
          const blob = new Blob([res.data], { type: 'application/pdf' });
          const objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
          onLoaded?.(objectUrl);
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
  }, [order, token]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="inline-grid justify-center overflow-auto w-full border shadow bg-white min-w-[300px]">
      <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
        {Array.from(new Array(numPages), (_, i) => (
          <Page key={`page_${i + 1}`} pageNumber={i + 1} />
        ))}
      </Document>
    </div>
  );
}