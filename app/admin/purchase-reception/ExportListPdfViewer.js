'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const URL_EXPORT_PDF = 'recepcion/formulario-recepcion/pdf';

export default function ExportListPdfViewer({ selected_orders = [], onLoaded }) {
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
        onLoaded?.(objectUrl);
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
    <div className="border shadow bg-white">
      <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
        {Array.from(new Array(numPages), (_, i) => (
          <Page key={`page_${i + 1}`} pageNumber={i + 1} />
        ))}
      </Document>
    </div>
  );
}
