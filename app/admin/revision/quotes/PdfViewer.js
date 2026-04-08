'use client';

import { useEffect, useState, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';
import '@/utils/pdfWorker';
import { useTranslation } from "@/app/locales";
import { Checkbox } from '@mantine/core';

const url_proforma = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarProformaCot';
const url_proforma_data = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarProformaCotPdf';

export default function PdfViewer({ order, token, onClose }) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const [options, setOptions] = useState({
    ocultarTodo: false,
    ocultarPeso: false,
    ocultarTipo: false,
    ocultarAplicacion: false,
    ocultarMarca: false,
    ocultarTiempo: false,
  });

  const ocultarTodoRef = useRef(null);
  const t = useTranslation();

  // 🔹 Control de indeterminate
  useEffect(() => {
    const { ocultarTodo, ...rest } = options;
    const values = Object.values(rest);
    const allChecked = values.every(Boolean);
    const noneChecked = values.every(v => !v);

    if (ocultarTodoRef.current) {
      ocultarTodoRef.current.indeterminate = !allChecked && !noneChecked;
    }

    if (allChecked && !ocultarTodo) {
      setOptions(prev => ({ ...prev, ocultarTodo: true }));
    } else if (noneChecked && ocultarTodo) {
      setOptions(prev => ({ ...prev, ocultarTodo: false }));
    }

  }, [
    options.ocultarPeso,
    options.ocultarTipo,
    options.ocultarAplicacion,
    options.ocultarMarca,
    options.ocultarTiempo
  ]);

  // 🔹 Cargar PDF inicial
  useEffect(() => {
    if (!order?.NroOrden || !token) return;
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, token]);
  const reloadPdf = async () => {

    const ocultarPeso = document.getElementById('chkPeso')?.checked ?? options.ocultarPeso;
    const ocultarTipo = document.getElementById('chkTipo')?.checked ?? options.ocultarTipo;
    const ocultarAplicacion = document.getElementById('chkAplicacion')?.checked ?? options.ocultarAplicacion;
    const ocultarMarca = document.getElementById('chkMarca')?.checked ?? options.ocultarMarca;
    const ocultarTiempo = document.getElementById('chkTiempo')?.checked ?? options.ocultarTiempo;

    try {
      const res = await axios.post(
        url_proforma_data,
        {
          NroOrden: order.NroOrden,
          Peso: ocultarPeso ? 1 : 0,
          TipRep: ocultarTipo ? 1 : 0,
          Aplicacion: ocultarAplicacion ? 1 : 0,
          Marca: ocultarMarca ? 1 : 0,
          TiEntrega: ocultarTiempo ? 1 : 0,
          ValToken: token,
        },
        { responseType: 'blob' }
      );

      // Crear Blob y URL temporal
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      // Actualiza la vista del PDF
      setPdfBlobUrl(blobUrl);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      
      //Descarga automáticamente el PDF
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${t.quote}-${order.NroOrden}.pdf`;
      link.className = "no-load";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      

      // Limpieza del blob cuando termine

    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };
  const loadPdf = async () => {
    try {
      const res = await axios.post(
        url_proforma,
        {
          NroOrden: order.NroOrden,
          ValToken: token
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
    } catch (error) {
      console.error('Error al cargar PDF:', error);
    }
  };

  const handleCheckboxChange = (field) => {
    setOptions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);

  if (!pdfBlobUrl) return <p className="p-4">{t.loading_pdf}...</p>;

  return (
    <div className="w-full h-[80vh] border shadow bg-white min-w-[300px] flex flex-col overflow-hidden">
      {/* 🔹 Barra fija de controles */}
      <div
        className="sticky top-0 z-10 p-4 border-b bg-gray-50 flex flex-col gap-4 shadow-sm"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        {/* 🔸 Título principal */}
        <h3 className="text-center font-semibold text-gray-700 tracking-wide">
          {t.hide?.toUpperCase?.() || 'OCULTAR'}
        </h3>

        {/* 🔹 Cuadrícula ordenada */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide">{t.weight}</span>
            <Checkbox
              checked={options.ocultarPeso}
              onChange={() => handleCheckboxChange('ocultarPeso')}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide">{t.spare_part_type}</span>
            <Checkbox
              checked={options.ocultarTipo}
              onChange={() => handleCheckboxChange('ocultarTipo')}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide">{t.application}</span>
            <Checkbox
              checked={options.ocultarAplicacion}
              onChange={() => handleCheckboxChange('ocultarAplicacion')}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide">{t.brand}</span>
            <Checkbox
              checked={options.ocultarMarca}
              onChange={() => handleCheckboxChange('ocultarMarca')}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide">{t.delivery_time}</span>
            <Checkbox
              checked={options.ocultarTiempo}
              onChange={() => handleCheckboxChange('ocultarTiempo')}
            />
          </div>

          {(false) &&
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium uppercase text-gray-500 mb-1 tracking-wide font-medium">{t.all}</span>
              <Checkbox
                ref={ocultarTodoRef}
                checked={options.ocultarTodo}
                onChange={() => handleCheckboxChange('ocultarTodo')}
              />
            </div>
          }
        </div>

        {/* 🔹 Botones centrados */}
        <div className="flex justify-center mt-2 gap-3">
          <button
            onClick={reloadPdf}
            className="btn btn-primary rounded hover:bg-blue-700"
          >
            {t.download_pdf}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="btn btn-success rounded"
            >
              {t.btn_close}
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Visualizador PDF */}
      <div className="flex-1 overflow-auto items-center justify-center m-auto p-2 bg-white">
        {pdfBlobUrl && (
          <Document file={pdfBlobUrl} onLoadSuccess={onLoadSuccess}>
            {Array.from(new Array(numPages), (_, i) => (
              <Page
                key={`page_${i + 1}`}
                pageNumber={i + 1}
                width={800} // ajusta según tu diseño
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}