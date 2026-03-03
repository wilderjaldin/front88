'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";

const url_proforma = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/BorradorOrdenCompra';


export default function PdfProformaViewer({ order, token, selected }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const t = useTranslation();
  
  useEffect(() => {
    if (!token) return;
    let timeout;
    const loadPdf = async () => {
      try {
        // Espera a que el modal se muestre completamente

        let data_send = []
        selected.map((item, index) => {
          
          data_send.push(
            {
              NroOrden: item.NroOrden,
              CodItem: item.CodItem,
              CodRepuesto: item.CodRepuesto,
              Precio: item.CostoSistema,
              PrecioReal: item.CostoReal,
              ValToken: token
            }
          );
        })


        timeout = setTimeout(async () => {
          const res = await axios.post(
            url_proforma,
            data_send,
            {
              responseType: "arraybuffer"
            }
          );
          const blob = new Blob([res.data], { type: "application/pdf" });


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

  if (!pdfBlobUrl) return <p>{ t.loading_pdf }...</p>;

  return (
    <div className="overflow-auto w-full h-[80vh] border shadow bg-white min-w-[300px]">
      <div className="flex justify-end p-2">
        <a
          href={pdfBlobUrl}
          download={`proforma.pdf`}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          { t.download_pdf }
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