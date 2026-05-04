'use client';
import { useEffect, useRef, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';
import IconTrash from '@/components/icon/icon-trash';

const MAX_IMAGES = 5;
const MAX_DOCS   = 5;
const IMG_TYPES  = ['image/jpeg', 'image/png', 'image/webp'];
const DOC_TYPES  = ['application/pdf'];

export default function SpareFiles({
  mode        = 'edit',
  codRepuesto = null,
  tempToken   = null,
  readOnly    = false,
  onFlagsChange,
}) {
  const [imagenes,   setImagenes]   = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loadingImg, setLoadingImg] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [imgActiva,  setImgActiva]  = useState(null);

  const refInputImg = useRef(null);
  const refInputDoc = useRef(null);

  const baseImg = mode === 'new'
    ? `repuestos/temp/${tempToken}/imagenes`
    : `repuestos/${codRepuesto}/imagenes`;

  const baseDoc = mode === 'new'
    ? `repuestos/temp/${tempToken}/documentos`
    : `repuestos/${codRepuesto}/documentos`;

  useEffect(() => {
    if (mode === 'edit' && codRepuesto) {
      fetchImagenes();
      fetchDocumentos();
    }
  }, [mode, codRepuesto]);

  const fetchImagenes = async () => {
    try {
      const rs = await axiosClient.get(baseImg);
      setImagenes(normalizeImagenes(rs.data ?? []));
    } catch {}
  };

  const fetchDocumentos = async () => {
    try {
      const rs = await axiosClient.get(baseDoc);
      setDocumentos(normalizeDocs(rs.data ?? []));
    } catch {}
  };

  const normalizeImagenes = (arr) =>
    arr.map((i, idx) => ({
      codImagen:   i.codImagen  ?? null,
      nombre:      i.nombre     ?? null,
      urlImagen:   i.urlImagen,
      esPrincipal: i.esPrincipal ?? idx === 0,
      orden:       i.orden ?? idx + 1,
    }));

  const normalizeDocs = (arr) =>
    arr.map(d => ({
      codDocumento: d.codDocumento ?? null,
      nombre:       d.nombre ?? d.nombreDocumento ?? '',
      archivo:      d.archivo ?? null,
      urlDocumento: d.urlDocumento ?? d.url ?? '',
      fecRegistra:  d.fecRegistra ?? d.fecSubida ?? null,
    }));

  const notifyFlags = (imgs, docs) =>
    onFlagsChange?.({ tieneImagen: imgs.length > 0, tieneDocumento: docs.length > 0 });

  // ── Imagen: subir ─────────────────────────────────────────────────────────
  const handleSubirImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!IMG_TYPES.includes(file.type)) {
      Swal.fire({ title: 'Formato inválido', text: 'Solo JPG, PNG o WEBP', icon: 'warning', confirmButtonColor: '#dc2626' });
      return;
    }
    if (imagenes.length >= MAX_IMAGES) {
      Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_IMAGES} imágenes`, icon: 'warning', confirmButtonColor: '#f59e0b' });
      return;
    }
    const form = new FormData();
    form.append('archivo', file);
    setLoadingImg(true);
    try {
      const rs     = await axiosClient.post(baseImg, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const nuevas = normalizeImagenes([...imagenes, rs.data]);
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al subir imagen', icon: 'error', confirmButtonColor: '#dc2626' });
    } finally {
      setLoadingImg(false);
    }
  };

  // ── Imagen: eliminar ──────────────────────────────────────────────────────
  const handleEliminarImagen = async (img) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar imagen?',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      const id = mode === 'new' ? img.nombre : img.codImagen;
      const rs = await axiosClient.delete(`${baseImg}/${id}`);
      const nuevas = mode === 'new'
        ? normalizeImagenes(rs.data ?? [])
        : imagenes.filter(i => i.codImagen !== img.codImagen);
      if (mode === 'edit' && img.esPrincipal && nuevas.length > 0) nuevas[0].esPrincipal = true;
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  // ── Documento: subir ──────────────────────────────────────────────────────
  const handleSubirDocumento = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!DOC_TYPES.includes(file.type)) {
      Swal.fire({ title: 'Formato inválido', text: 'Solo archivos PDF', icon: 'warning', confirmButtonColor: '#dc2626' });
      return;
    }
    if (documentos.length >= MAX_DOCS) {
      Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_DOCS} documentos`, icon: 'warning', confirmButtonColor: '#f59e0b' });
      return;
    }
    const { value: nombreDoc, isConfirmed } = await Swal.fire({
      title: 'Nombre del documento', input: 'text',
      inputPlaceholder: 'Ej: Manual de instalación',
      inputValue: file.name.replace('.pdf', ''),
      showCancelButton: true,
      confirmButtonColor: '#15803d', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Subir', cancelButtonText: 'Cancelar',
      inputValidator: (v) => !v?.trim() ? 'Ingresa un nombre' : null,
    });
    if (!isConfirmed) return;

    const form = new FormData();
    form.append('archivo', file);
    form.append('nombreDocumento', nombreDoc.trim());
    setLoadingDoc(true);
    try {
      const rs     = await axiosClient.post(baseDoc, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const nuevos = normalizeDocs([...documentos, rs.data]);
      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al subir documento', icon: 'error', confirmButtonColor: '#dc2626' });
    } finally {
      setLoadingDoc(false);
    }
  };

  // ── Documento: eliminar ───────────────────────────────────────────────────
  const handleEliminarDocumento = async (doc) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar documento?', text: `"${doc.nombre}"`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      const id = mode === 'new' ? doc.archivo : doc.codDocumento;
      const rs = await axiosClient.delete(`${baseDoc}/${id}`);
      const nuevos = mode === 'new'
        ? normalizeDocs(rs.data ?? [])
        : documentos.filter(d => d.codDocumento !== doc.codDocumento);
      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  const fmtDate = (val) => val
    ? new Date(val).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <input ref={refInputImg} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleSubirImagen} />
      <input ref={refInputDoc} type="file" accept=".pdf" className="hidden" onChange={handleSubirDocumento} />

      <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">

        {/* ── Imágenes ──────────────────────────────────────────────────── */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Imágenes
              </span>
              <span className="text-xs text-gray-400">{imagenes.length}/{MAX_IMAGES}</span>
            </div>
            {!readOnly && imagenes.length < MAX_IMAGES && (
              <button
                type="button"
                disabled={loadingImg}
                onClick={() => refInputImg.current?.click()}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium
                  bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                  hover:bg-primary/10 hover:text-primary transition
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlus className="h-3.5 w-3.5" />
                {loadingImg ? 'Subiendo…' : 'Agregar'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {imagenes.map((img, idx) => (
              <div
                key={img.codImagen ?? img.nombre ?? idx}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0"
              >
                <img
                  src={img.urlImagen}
                  alt={`img-${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setImgActiva(img.urlImagen)}
                />
                {img.esPrincipal && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
                )}
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleEliminarImagen(img)}
                      className="h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {imagenes.length === 0 && (
              <p className="text-xs text-gray-400 py-2">Sin imágenes</p>
            )}
          </div>
        </div>

        {/* ── Documentos ────────────────────────────────────────────────── */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documentos PDF
              </span>
              <span className="text-xs text-gray-400">{documentos.length}/{MAX_DOCS}</span>
            </div>
            {!readOnly && documentos.length < MAX_DOCS && (
              <button
                type="button"
                disabled={loadingDoc}
                onClick={() => refInputDoc.current?.click()}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium
                  bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                  hover:bg-primary/10 hover:text-primary transition
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlus className="h-3.5 w-3.5" />
                {loadingDoc ? 'Subiendo…' : 'Agregar'}
              </button>
            )}
          </div>

          {documentos.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">Sin documentos</p>
          ) : (
            <div className="space-y-1">
              {documentos.map((doc, idx) => (
                <div
                  key={doc.codDocumento ?? doc.archivo ?? idx}
                  className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="h-7 w-7 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {doc.nombre}
                  </span>

                  {doc.fecRegistra && (
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                      {fmtDate(doc.fecRegistra)}
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <a
                      href={doc.urlDocumento}
                      target="_blank"
                      rel="noreferrer"
                      className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 transition"
                      title="Ver PDF"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleEliminarDocumento(doc)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                        title="Eliminar"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {imgActiva && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImgActiva(null)}
        >
          <img
            src={imgActiva}
            alt="Vista previa"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setImgActiva(null)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
