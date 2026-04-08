'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const url_proforma = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirListaEmpaque';
const url_invoice = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirEntrega';


export default function PdfViewerDelivery({ order, token, onClose }) {
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
  }, [order, token]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleExportInvoice = async () => {
    try {
      // Espera a que el modal se muestre completamente
      timeout = setTimeout(async () => {
        const res = await axios.post(
          url_invoice,
          { NroEntrega: order.NroEntrega, ValToken: token },
          { responseType: 'blob' }
        );
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Crear un link oculto y simular click
        let filename = `invoice_${order.NroEntrega}.pdf`;
        const link = document.createElement("a");
        link.href = url;
        link.className = "no-load";
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();

        // Limpiar
        link.remove();
        window.URL.revokeObjectURL(url);

      }, 100); // Espera 100ms
    } catch (error) {
      console.error('Error al cargar PDF:', error);
    }
  }



  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="inline-grid justify-center overflow-auto w-full h-[80vh] border shadow bg-white min-w-[300px]">
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        <button
          onClick={() => handleExportInvoice()}
          className="btn btn-primary rounded hover:bg-blue-700"
        >
          { t.export_invoice }
        </button>
        <a
          href={pdfBlobUrl}
          download={`lista_empaque_${order.NroEntrega}.pdf`}
          className="btn btn-primary rounded hover:bg-blue-700"
        >
          { t.export_packing_list }
        </a>
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