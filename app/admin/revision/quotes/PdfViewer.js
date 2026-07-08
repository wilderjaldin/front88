'use client';

import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import axiosClient from '@/app/lib/axiosClient';
import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";
import { Checkbox } from '@mantine/core';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const URL_PREVIEW = 'cotizacion/pdf/preview';

export default function PdfViewer({ order, onClose }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages,   setNumPages]   = useState(null);
  const [previewed,  setPreviewed]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [options, setOptions] = useState({
    ocultarTipo:       false,
    ocultarAplicacion: false,
    ocultarMarca:      false,
    ocultarTiempo:     false,
  });

  const t = useTranslation();

  useEffect(() => {
    if (!order?.NroOrden) return;
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const buildPayload = (opts) => ({
    nroCotizacion: order.NroOrden,
    visibilidad: {
      mostrarCodigo:        order.MostrarCodigo === 1,
      mostrarPeso:          order.MostrarPeso   === 1,
      mostrarTipoRepuesto:  !opts.ocultarTipo,
      mostrarAplicacion:    !opts.ocultarAplicacion,
      mostrarMarca:         !opts.ocultarMarca,
      mostrarTiempoEntrega: !opts.ocultarTiempo,
    },
  });

  const loadPdf = async () => {
    try {
      const res = await axiosClient.post(URL_PREVIEW, buildPayload(options), { responseType: 'blob' });
      setPdfBlobUrl(URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
    } catch (error) {
      console.error('Error al cargar PDF:', error);
    }
  };

  const refreshPreview = async () => {
    setRefreshing(true);
    try {
      const res = await axiosClient.post(URL_PREVIEW, buildPayload(options), { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(blobUrl);
      setPreviewed(true);
    } catch (error) {
      console.error('Error al actualizar vista previa:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfBlobUrl || !previewed) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${t.quote}-${order.NroOrden}.pdf`;
    link.className = 'no-load';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckboxChange = (field) => {
    setOptions(prev => ({ ...prev, [field]: !prev[field] }));
    setPreviewed(false);
  };

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);

  if (!pdfBlobUrl) return <p className="p-4">{t.loading_pdf}...</p>;

  return (
    <div className="w-full h-[80vh] border shadow bg-white min-w-[300px] flex flex-col overflow-hidden">
      {/* Barra de controles */}
      <div className="sticky top-0 z-10 px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 shrink-0">
            {t.hide?.toUpperCase?.() || 'Ocultar'}
          </span>
          {[
            ['ocultarTipo',       t.spare_part_type],
            ['ocultarAplicacion', t.application],
            ['ocultarMarca',      t.brand],
            ['ocultarTiempo',     t.delivery_time],
          ].map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <Checkbox size="xs" checked={options[key]} onChange={() => handleCheckboxChange(key)} />
              <span className="text-xs text-gray-500">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refreshPreview}
            disabled={refreshing}
            className="h-8 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            onClick={downloadPdf}
            disabled={!previewed}
            className="h-8 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.download_pdf}
          </button>
          {onClose && (
            <button onClick={onClose} className="h-8 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              {t.btn_close}
            </button>
          )}
        </div>
      </div>

      {/* Visualizador PDF */}
      <div className="flex-1 overflow-auto items-center justify-center m-auto p-2 bg-white">
        <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
          {Array.from(new Array(numPages), (_, i) => (
            <Page key={`page_${i + 1}`} pageNumber={i + 1} width={800} />
          ))}
        </Document>
      </div>
    </div>
  );
}
