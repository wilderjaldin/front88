'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const URL_EXPORT_PDF = 'recepcion/formulario-recepcion/pdf';

export default function ExportListPdfViewer({ selected_orders = [] }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages,   setNumPages]   = useState(null);
  const t = useTranslation();

  useEffect(() => {
    let objectUrl;
    const loadPdf = async () => {
      try {
        const res = await axiosClient.post(
          URL_EXPORT_PDF,
          { numOrdenCompra: selected_orders.map(o => o.NumOrdenCompra) },
          { responseType: 'blob' }
        );
        const blob = new Blob([res.data], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } catch (error) {
        console.error('Error al cargar PDF:', error);
      }
    };

    loadPdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (!pdfBlobUrl) return <p className="py-16 text-center text-sm text-gray-400">{t.loading_pdf}...</p>;

  return (
    <div className="overflow-auto w-full h-[80vh] border shadow bg-white min-w-[300px]">
      <div className="flex justify-end p-2">
        <a
          href={pdfBlobUrl}
          download="recepcion.pdf"
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          {t.download_pdf}
        </a>
      </div>

      <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
        {Array.from(new Array(numPages), (_, i) => (
          <Page key={`page_${i + 1}`} pageNumber={i + 1} />
        ))}
      </Document>
    </div>
  );
}
