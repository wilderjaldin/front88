'use client';
import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import IconDownload from '../icon/icon-download';

// Versión de solo lectura de AttachQuoteForm — sin subir, editar ni eliminar,
// solo lista + descarga. Misma tabla/estilo, para usar en pantallas informativas.
const DEFAULTS = {
  list: 'cotizaciondetalle/verarchadj',
};

const ARCHIVOS_URL = process.env.NEXT_PUBLIC_ARCHIVOS_URL;

const AttachListView = ({ close, t, nro, urls = {} }) => {
  const urlList = urls.list ?? DEFAULTS.list;

  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get(`${urlList}/${nro}`)
      .then(rs => { if (Array.isArray(rs.data)) setFiles(rs.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nro]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">{t.no_files ?? 'No hay archivos adjuntos'}</p>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-left w-12"></th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left">{t.file_name}</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left">{t.description}</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap">{t.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {files.map((f, index) => (
                  <tr key={f.codRegistro ?? index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-2 py-1.5">
                      <a
                        href={`${ARCHIVOS_URL}/${nro}/${f.codArchivo}`}
                        download={f.nomArchivo}
                        title="Descargar"
                        className="inline-flex p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                      >
                        <IconDownload className="w-4 h-4 text-blue-500" />
                      </a>
                    </td>
                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300" title={f.nomArchivo}>{f.nomArchivo}</td>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">{f.desArchivo || '—'}</td>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{f.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center pt-1">
        <button type="button" onClick={close}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150">
          {t.close ?? 'Cerrar'}
        </button>
      </div>
    </div>
  );
};

export default AttachListView;
