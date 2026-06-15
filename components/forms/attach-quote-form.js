'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axiosClient from '@/app/lib/axiosClient'
import IconTrashLines from '../icon/icon-trash-lines';
import IconSave from "../icon/icon-save"
import IconDownload from "../icon/icon-download"
import IconFile from "../icon/icon-file"
import IconBackSpace from "../icon/icon-backspace"

const URL_UPLOAD_FILE          = 'cotizaciondetalle/guaarchadj';
const URL_LIST_FILES           = 'cotizaciondetalle/verarchadj';
const URL_DELETE_FILE          = 'cotizaciondetalle/eliarchadj';
const URL_UPDATE_DESCRIPTION   = 'cotizaciondetalle/modarchadj';

const ARCHIVOS_URL = process.env.NEXT_PUBLIC_ARCHIVOS_URL;

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_QUESTION = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title, msg = '') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    ${msg ? `<p style="color:#94a3b8;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.08em">${msg}</p>` : ''}
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true,
  confirmButtonText: confirmText,
  confirmButtonColor: '#ef4444',
});

const swalConfirm = (title, msg = '', { confirmText = 'Sí', cancelText = 'Cancelar', confirmColor = '#dc2626' } = {}) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_QUESTION}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 ${msg ? '10px' : '0'};line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showCancelButton: true,
  confirmButtonText: confirmText,
  cancelButtonText: cancelText,
  confirmButtonColor: confirmColor,
  reverseButtons: true,
});

const FILE_TYPES = ['.jpeg', '.jpg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];


const AttachQuoteForm = ({ close, t, order }) => {

  const [files, setFiles] = useState([]);
  const [filename, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { register, setValue, getValues, handleSubmit } = useForm();

  useEffect(() => {
    getListFiles();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setValue('attach', [file], { shouldValidate: true });
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = (e) => {
    e?.preventDefault();
    setFileName("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('attach', []);
    const input = document.getElementById('file_attach');
    if (input) input.value = "";
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], "captura.png", { type: blob.type });
            const dt = new DataTransfer();
            dt.items.add(file);
            const fileInput = document.getElementById("file_attach");
            fileInput.files = dt.files;
            handleFileChange({ target: { files: dt.files } });
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const dropped = e.dataTransfer.files;
    if (dropped?.length > 0) {
      const fileInput = document.getElementById('file_attach');
      const dt = new DataTransfer();
      dt.items.add(dropped[0]);
      fileInput.files = dt.files;
      handleFileChange({ target: { files: dt.files } });
    }
  }, [handleFileChange]);

  const getListFiles = async () => {
    try {
      const rs = await axiosClient.get(`${URL_LIST_FILES}/${order.NroOrden}`);
      if (Array.isArray(rs.data)) setFiles(rs.data);
    } catch (_) {}
  };

  const onUpdaload = async (data) => {
    if (!data.attach?.[0]) { swalError(t.error, t.file_empty_error, t.close); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('NroCotizacion', order.NroOrden);
      formData.append('Descripcion', data.descripcion || '');
      formData.append('Archivo', data.attach[0]);

      const rs = await axiosClient.post(URL_UPLOAD_FILE, formData, {
        headers: { 'Content-Type': undefined },
      });

      if (Array.isArray(rs.data)) {
        setFiles(rs.data);
        handleRemoveFile();
        setValue('descripcion', '');
        swalSuccess(t.file_upload_success);
      }
    } catch (_) {}
    finally { setUploading(false); }
  };

  const updateDescriptionFile = async (file) => {
    try {
      const description = getValues(`description.${file.codRegistro}`);
      const rs = await axiosClient.put(URL_UPDATE_DESCRIPTION, {
        CodRegistro: file.codRegistro, Descripcion: description, NroCotizacion: order.NroOrden
      });
      if (Array.isArray(rs.data)) {
        setFiles(rs.data);
        swalSuccess(t.save_description_file_success);
      }
    } catch (_) {}
  };


  const deleteFile = async (file) => {
    swalConfirm(t.question_delete_file, file.nomArchivo, {
      confirmText: t.yes_delete, cancelText: t.btn_cancel
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.delete(URL_DELETE_FILE, {
          data: { CodRegistro: file.codRegistro, NroCotizacion: order.NroOrden }
        });
        if (Array.isArray(rs.data)) {
          setFiles(rs.data);
          swalSuccess(t.delete_file_success);
        } else {
          swalError(t.delete_file_error);
        }
      } catch (_) {
        swalError(t.delete_file_error_server);
      }
    });
  };

  return (
    <div className="space-y-5">

      <form onSubmit={handleSubmit(onUpdaload)}>

        {/* Drop zone */}
        <label
          htmlFor="file_attach"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden select-none
            ${isDragging
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
                ? 'border-slate-300 bg-slate-50'
                : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
            }
            ${previewUrl ? 'h-52' : 'h-36'}
          `}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain p-2" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <span className="text-white text-xs font-medium truncate block">{filename}</span>
              </div>
            </>
          ) : selectedFile ? (
            <div className="flex flex-col items-center gap-2 px-6 py-4">
              <IconFile className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 text-center truncate max-w-xs">{filename}</p>
              <span className="text-xs bg-slate-200 text-slate-600 rounded px-2 py-0.5 font-mono uppercase">
                {filename.split('.').pop()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-6 text-center">
              <svg className="w-8 h-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-slate-500">
                Arrastra o <span className="text-blue-500 font-semibold">selecciona un archivo</span>
              </p>
              <p className="text-xs text-slate-400">También puedes pegar con Ctrl+V</p>
            </div>
          )}

          {/* X para quitar el archivo */}
          {selectedFile && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition shadow z-10"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          <input
            {...register('attach', { required: false })}
            type="file"
            accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
            id="file_attach"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Tipos aceptados */}
        <div className="flex flex-wrap gap-1 mt-2">
          {(() => {
            const activeExt = filename ? '.' + filename.split('.').pop().toLowerCase() : null;
            return FILE_TYPES.map(ext => (
              <span key={ext} className={`text-xs rounded px-1.5 py-0.5 font-mono transition-all duration-150 ${
                activeExt === ext
                  ? 'bg-primary text-white font-semibold'
                  : activeExt
                    ? 'bg-gray-100 text-gray-300'
                    : 'bg-gray-100 text-gray-500'
              }`}>{ext}</span>
            ));
          })()}
        </div>

        {/* Descripción (opcional) */}
        <div className="mt-3">
          <input
            type="text"
            {...register('descripcion')}
            placeholder={t.description + ' (opcional)'}
            maxLength={100}
            className="form-input w-full h-9 text-sm"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 mb-4 mt-4 pb-4 border-b border-gray-100">
          <button
            onClick={() => close()}
            type="button"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            {t.btn_cancel}
          </button>
          <button type="submit" disabled={uploading} className="btn btn-success inline-flex items-center gap-2 h-9">
            {uploading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {uploading ? 'Subiendo...' : t.btn_upload}
          </button>
        </div>
      </form>

      {/* Tabla de archivos adjuntos */}
      {files.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-2 py-2 text-left w-16"></th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-3 py-2 text-left">{t.file_name}</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-3 py-2 text-left">{t.description}</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-3 py-2 text-left whitespace-nowrap">{t.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((f, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => deleteFile(f)} title={t.delete} type="button"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition">
                          <IconTrashLines className="w-4 h-4 text-red-500" />
                        </button>
                        <a
                          href={`${ARCHIVOS_URL}/${order.NroOrden}/${f.codArchivo}`}
                          download={f.nomArchivo}
                          title="Descargar"
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition"
                        >
                          <IconDownload className="w-4 h-4 text-blue-500" />
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-gray-700" title={f.nomArchivo}>
                        {f.nomArchivo}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            defaultValue={f.desArchivo}
                            {...register(`description.${f.codRegistro}`)}
                            maxLength={100}
                            className="form-input h-8 text-sm pr-7 w-full rounded-r-none"
                          />
                          <button
                            type="button"
                            onClick={() => setValue(`description.${f.codRegistro}`, '')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            <IconBackSpace className="w-4 h-4" />
                          </button>
                        </div>
                        <button onClick={() => updateDescriptionFile(f)} type="button"
                          className="h-8 px-2 border border-l-0 border-primary rounded-r-md hover:bg-primary/10 transition shrink-0">
                          <IconSave className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap text-xs">{f.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttachQuoteForm;
