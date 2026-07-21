'use client';

import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import '@/utils/pdfWorker';
import IconDownload from '@/components/icon/icon-download';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function ProformaViewer({ pdfUrl, fileName, t }) {
  const [numPages, setNumPages] = useState(null);

  const download = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.className = "no-load";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-[80vh] flex flex-col">
      <div className="flex items-center justify-end pb-3">
        <button type="button" onClick={download}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition">
          <IconDownload className="h-3.5 w-3.5" />
          {t.download_pdf ?? 'Descargar'}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-lg flex justify-center">
        <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          {Array.from(new Array(numPages ?? 0), (_, i) => (
            <Page key={`page_${i + 1}`} pageNumber={i + 1} width={760} />
          ))}
        </Document>
      </div>
    </div>
  );
}
