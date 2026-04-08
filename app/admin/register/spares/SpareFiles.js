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

// ─────────────────────────────────────────────────────────────────────────────
// Props:
//   mode         — 'edit' | 'new'
//                  'edit' → usa endpoints /repuestos/{codRepuesto}/imagenes|documentos
//                  'new'  → usa endpoints /repuestos/temp/{tempToken}/imagenes|documentos
//   codRepuesto  — int  (requerido en mode='edit')
//   tempToken    — string uuid (requerido en mode='new', generado en el form padre)
//   readOnly     — bool
//   onFlagsChange — fn({ tieneImagen, tieneDocumento })
// ─────────────────────────────────────────────────────────────────────────────
export default function SpareFiles({
  mode         = 'edit',
  codRepuesto  = null,
  tempToken    = null,
  readOnly     = false,
  onFlagsChange,
}) {
  const [imagenes,   setImagenes]   = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loadingImg, setLoadingImg] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [imgActiva,  setImgActiva]  = useState(null);

  const refInputImg = useRef(null);
  const refInputDoc = useRef(null);

  // ── Rutas base según modo ─────────────────────────────────────────────────
  const baseImg = mode === 'new'
    ? `repuestos/temp/${tempToken}/imagenes`
    : `repuestos/${codRepuesto}/imagenes`;

  const baseDoc = mode === 'new'
    ? `repuestos/temp/${tempToken}/documentos`
    : `repuestos/${codRepuesto}/documentos`;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'edit' && codRepuesto) {
      fetchImagenes();
      fetchDocumentos();
    }
    // En modo 'new' se empieza vacío — no hay nada en el servidor todavía
    // (el tempToken acaba de generarse)
  }, [mode, codRepuesto]);

  const fetchImagenes = async () => {
    try {
      const rs = await axiosClient.get(baseImg);
      setImagenes(normalizeImagenes(rs.data ?? []));
    } catch (err) {
      console.error('Error cargando imágenes', err);
    }
  };

  const fetchDocumentos = async () => {
    try {
      const rs = await axiosClient.get(baseDoc);
      setDocumentos(rs.data ?? []);
    } catch (err) {
      console.error('Error cargando documentos', err);
    }
  };

  // Normalizar respuesta: edit y new tienen estructura ligeramente distinta
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
      codDocumento:    d.codDocumento    ?? null,
      nombre:          d.nombre          ?? d.nombreDocumento ?? '',
      archivo:         d.archivo         ?? null,
      urlDocumento:    d.urlDocumento    ?? d.url ?? '',
      fecRegistra:     d.fecRegistra     ?? d.fecSubida ?? null,
    }));

  // ── Notificar al padre ────────────────────────────────────────────────────
  const notifyFlags = (imgs, docs) => {
    onFlagsChange?.({
      tieneImagen:    imgs.length > 0,
      tieneDocumento: docs.length > 0,
    });
  };

  // ── Subir imagen ──────────────────────────────────────────────────────────
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
      const rs   = await axiosClient.post(baseImg, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const nuevas = normalizeImagenes([...imagenes, rs.data]);
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al subir imagen', icon: 'error', confirmButtonColor: '#dc2626' });
    } finally {
      setLoadingImg(false);
    }
  };

  // ── Eliminar imagen ───────────────────────────────────────────────────────
  const handleEliminarImagen = async (img) => {
    const { isConfirmed } = await Swal.fire({
      title:              '¿Eliminar imagen?',
      text:               img.esPrincipal ? 'Es la imagen principal. La siguiente pasará a serlo.' : 'Esta acción no se puede deshacer.',
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor:  '#6b7280',
      confirmButtonText:  'Sí, eliminar',
      cancelButtonText:   'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      // Identificador según modo
      const identificador = mode === 'new' ? img.nombre : img.codImagen;
      const rs = await axiosClient.delete(`${baseImg}/${identificador}`);

      // En modo new el backend devuelve la lista actualizada directamente
      let nuevas;
      if (mode === 'new') {
        nuevas = normalizeImagenes(rs.data ?? []);
      } else {
        nuevas = imagenes.filter(i => i.codImagen !== img.codImagen);
        if (img.esPrincipal && nuevas.length > 0) nuevas[0].esPrincipal = true;
      }

      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar imagen', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  // ── Subir documento ───────────────────────────────────────────────────────
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
      title:             'Nombre del documento',
      input:             'text',
      inputPlaceholder:  'Ej: Manual de instalación',
      inputValue:        file.name.replace('.pdf', ''),
      showCancelButton:  true,
      confirmButtonColor: '#15803d',
      cancelButtonColor:  '#6b7280',
      confirmButtonText: 'Subir',
      cancelButtonText:  'Cancelar',
      inputValidator:    (v) => !v?.trim() ? 'Ingresa un nombre' : null,
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

  // ── Eliminar documento ────────────────────────────────────────────────────
  const handleEliminarDocumento = async (doc) => {
    const { isConfirmed } = await Swal.fire({
      title:              '¿Eliminar documento?',
      text:               `"${doc.nombre}" será eliminado permanentemente.`,
      icon:               'warning',
      showCancelButton:   true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor:  '#6b7280',
      confirmButtonText:  'Sí, eliminar',
      cancelButtonText:   'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      const identificador = mode === 'new' ? doc.archivo : doc.codDocumento;
      const rs = await axiosClient.delete(`${baseDoc}/${identificador}`);

      let nuevos;
      if (mode === 'new') {
        nuevos = normalizeDocs(rs.data ?? []);
      } else {
        nuevos = documentos.filter(d => d.codDocumento !== doc.codDocumento);
      }

      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar documento', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  const fmtDate = (val) => val
    ? new Date(val).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── IMÁGENES ──────────────────────────────────────────────────────── */}
      <div className="panel">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Imágenes
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{imagenes.length} / {MAX_IMAGES}</p>
          </div>
          {!readOnly && imagenes.length < MAX_IMAGES && (
            <>
              <input ref={refInputImg} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleSubirImagen} />
              <button
                type="button"
                disabled={loadingImg}
                onClick={() => refInputImg.current?.click()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm
                font-medium hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconPlus className="h-4 w-4" />
                {loadingImg ? 'Subiendo...' : 'Agregar imagen'}
              </button>
            </>
          )}
        </div>

        {imagenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">{mode === 'new' ? 'Puedes subir imágenes antes de guardar' : 'Sin imágenes'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {imagenes.map((img, idx) => (
              <div key={img.codImagen ?? img.nombre ?? idx}
                className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-800">
                <img
                  src={img.urlImagen}
                  alt={`Imagen ${img.orden}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setImgActiva(img.urlImagen)}
                />
                {img.esPrincipal && (
                  <span className="absolute top-2 left-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                    Principal
                  </span>
                )}
                {mode === 'new' && (
                  <span className="absolute top-2 right-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                    Temp
                  </span>
                )}
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => handleEliminarImagen(img)}
                      className="h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DOCUMENTOS ────────────────────────────────────────────────────── */}
      <div className="panel">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Documentos
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{documentos.length} / {MAX_DOCS}</p>
          </div>
          {!readOnly && documentos.length < MAX_DOCS && (
            <>
              <input ref={refInputDoc} type="file" accept=".pdf" className="hidden" onChange={handleSubirDocumento} />
              <button
                type="button"
                disabled={loadingDoc}
                onClick={() => refInputDoc.current?.click()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm
                font-medium hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconPlus className="h-4 w-4" />
                {loadingDoc ? 'Subiendo...' : 'Agregar PDF'}
              </button>
            </>
          )}
        </div>

        {documentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <svg className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">{mode === 'new' ? 'Puedes subir documentos antes de guardar' : 'Sin documentos'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc, idx) => (
              <div key={doc.codDocumento ?? doc.archivo ?? idx}
                className="flex items-center gap-4 p-3 rounded-xl border border-gray-200
                dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {doc.nombre}
                    </p>
                    {mode === 'new' && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">Temp</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{fmtDate(doc.fecRegistra)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={doc.urlDocumento} target="_blank" rel="noreferrer"
                    className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center
                    hover:bg-primary hover:text-white transition text-gray-500 dark:text-gray-300" title="Ver PDF">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  {!readOnly && (
                    <button type="button" onClick={() => handleEliminarDocumento(doc)}
                      className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center
                      hover:bg-red-600 hover:text-white transition text-gray-500 dark:text-gray-300" title="Eliminar">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────────── */}
      {imgActiva && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImgActiva(null)}>
          <img src={imgActiva} alt="Vista previa"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setImgActiva(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white
            flex items-center justify-center hover:bg-white/20 transition">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}