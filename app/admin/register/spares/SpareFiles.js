'use client';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconTrash from '@/components/icon/icon-trash';

const MAX_IMAGES = 5;
const MAX_DOCS   = 5;
const IMG_TYPES  = ['image/jpeg', 'image/png', 'image/webp'];
const DOC_TYPES  = ['application/pdf'];

const URL_SUGGESTED  = 'repuestos/archivos-sugeridos';

// Tanto en alta (mode="new") como en edición (mode="edit"), los archivos elegidos
// acá (subidos o "sugeridos" de otro repuesto) NO se mandan al backend al
// elegirlos — quedan en memoria (preview local con URL.createObjectURL, o la url
// del archivo sugerido) y recién viajan cuando el padre arma el POST/PUT único
// con TODO el form (datos + nota + archivos). En edición, los archivos YA
// existentes sí se traen al abrir el form (fetchImagenes/fetchDocumentos contra
// repuestos/{id}/imagenes|documentos) para poder listarlos/borrarlos.
const SpareFiles = forwardRef(function SpareFiles({
  mode        = 'edit',
  codRepuesto = null,
  readOnly    = false,
  panelOpen   = true,
  onFlagsChange,
  // Función que el padre pasa para leer, al momento del click, los valores actuales
  // del form (nroParte / codMarca / codPrv) — se usan para buscar archivos ya
  // subidos a OTROS repuestos que se puedan reutilizar en vez de volver a subirlos.
  getSuggestParams,
}, ref) {
  const [imagenes,   setImagenes]   = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [uploading,  setUploading]  = useState(null); // { done, total } | null
  const [dragOver,   setDragOver]   = useState(false);
  const [imgActiva,  setImgActiva]  = useState(null);

  const [suggestOpen,    setSuggestOpen]    = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResults, setSuggestResults] = useState([]);

  const refInput = useRef(null);
  const isNew = mode === 'new';

  const baseImg = (id) => `repuestos/${id}/imagenes`;
  const baseDoc = (id) => `repuestos/${id}/documentos`;

  useEffect(() => {
    if (!isNew && codRepuesto) {
      fetchImagenes();
      fetchDocumentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, codRepuesto]);

  const fetchImagenes = async () => {
    try {
      const rs = await axiosClient.get(baseImg(codRepuesto));
      setImagenes(normalizeImagenes(rs.data ?? []));
    } catch {}
  };

  const fetchDocumentos = async () => {
    try {
      const rs = await axiosClient.get(baseDoc(codRepuesto));
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

  // ── Subida unificada: se detecta el tipo de archivo automáticamente ────────
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    let curImagenes   = imagenes;
    let curDocumentos = documentos;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploading({ done: i, total: files.length });

      if (IMG_TYPES.includes(file.type)) {
        if (curImagenes.length >= MAX_IMAGES) {
          Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_IMAGES} imágenes`, icon: 'warning', confirmButtonColor: '#f59e0b' });
          continue;
        }
        // Solo queda en memoria con preview local — se sube recién al guardar,
        // junto con el resto del form, en un solo POST/PUT (crear o editar).
        curImagenes = [...curImagenes, {
          codImagen: null, nombre: file.name, urlImagen: URL.createObjectURL(file),
          esPrincipal: curImagenes.length === 0, orden: curImagenes.length + 1,
          queued: true, file,
        }];
        setImagenes(curImagenes);
      } else if (DOC_TYPES.includes(file.type)) {
        if (curDocumentos.length >= MAX_DOCS) {
          Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_DOCS} documentos`, icon: 'warning', confirmButtonColor: '#f59e0b' });
          continue;
        }
        curDocumentos = [...curDocumentos, {
          codDocumento: null, nombre: file.name.replace(/\.pdf$/i, ''), archivo: null, urlDocumento: '', fecRegistra: null,
          queued: true, file,
        }];
        setDocumentos(curDocumentos);
      } else {
        Swal.fire({ title: 'Formato no admitido', text: `"${file.name}" — solo JPG, PNG, WEBP o PDF`, icon: 'warning', confirmButtonColor: '#dc2626' });
      }
    }

    notifyFlags(curImagenes, curDocumentos);
    setUploading(null);
  };

  // ── Archivos sugeridos: reutilizar un archivo ya subido a OTRO repuesto ────
  const handleBuscarSugeridos = async () => {
    const p = getSuggestParams?.() ?? {};
    const query = {};
    if (p.nroParte)  query.nroParte      = p.nroParte;
    if (p.codMarca)  query.codMarca      = p.codMarca;
    if (p.codPrv)    query.codProveedor  = p.codPrv;

    if (!query.nroParte && !query.codMarca && !query.codProveedor) {
      Swal.fire({
        title: 'Faltan datos', icon: 'info', confirmButtonColor: '#4361ee',
        text: 'Completá Nro. Parte, Marca o Proveedor en el formulario para buscar archivos sugeridos.',
      });
      return;
    }

    setSuggestOpen(true);
    setSuggestLoading(true);
    try {
      const rs = await axiosClient.get(URL_SUGGESTED, { params: query });
      setSuggestResults(rs.data ?? []);
    } catch {
      setSuggestResults([]);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleUsarSugerido = (item) => {
    const isImg = item.tipoArchivo === 'IMG';
    if (isImg && imagenes.length >= MAX_IMAGES) {
      Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_IMAGES} imágenes`, icon: 'warning', confirmButtonColor: '#f59e0b' });
      return;
    }
    if (!isImg && documentos.length >= MAX_DOCS) {
      Swal.fire({ title: 'Límite alcanzado', text: `Máximo ${MAX_DOCS} documentos`, icon: 'warning', confirmButtonColor: '#f59e0b' });
      return;
    }

    // Queda como referencia en memoria y se asigna server-side recién cuando se
    // guarde el form (junto con todo lo demás, en el mismo POST/PUT).
    if (isImg) {
      const nuevas = [...imagenes, {
        codImagen: null, nombre: item.nombre, urlImagen: item.url,
        esPrincipal: imagenes.length === 0, orden: imagenes.length + 1,
        assignCodArchivo: item.codArchivo,
      }];
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } else {
      const nuevos = [...documentos, {
        codDocumento: null, nombre: item.nombre, archivo: null, urlDocumento: item.url, fecRegistra: null,
        assignCodArchivo: item.codArchivo,
      }];
      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
    }
    setSuggestResults((prev) => prev.filter((r) => r.codArchivo !== item.codArchivo));
  };

  // ── Llamado por el formulario padre al armar el POST/PUT único (alta o edición) ──
  // El padre arma un solo FormData con TODO (datos + nota + archivos) y lo manda
  // en un único request a repuestos/registrar (alta) o repuestos/editar (edición).
  useImperativeHandle(ref, () => ({
    hasQueuedFiles: () => imagenes.some(i => i.queued || i.assignCodArchivo) || documentos.some(d => d.queued || d.assignCodArchivo),
    getQueuedFiles: () => ({
      // Archivos nuevos (bytes propios, hay que subirlos).
      imagenes: imagenes.filter(i => i.queued).map(i => i.file),
      documentos: documentos.filter(d => d.queued).map(d => ({ file: d.file, nombre: d.nombre })),
      // Archivos sugeridos elegidos de OTRO repuesto (ya existen en el servidor,
      // solo hay que asignarlos por codArchivo — no se vuelven a subir).
      imagenesAsignadas: imagenes.filter(i => i.assignCodArchivo).map(i => i.assignCodArchivo),
      documentosAsignados: documentos.filter(d => d.assignCodArchivo).map(d => d.assignCodArchivo),
    }),
    openSuggested: () => handleBuscarSugeridos(),
  }), [imagenes, documentos, handleBuscarSugeridos]);

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnly) return;
    handleFiles(e.dataTransfer.files);
  };

  // ── Pegar desde el portapapeles (Ctrl+V) ────────────────────────────────
  // El componente ahora queda montado aunque el panel esté colapsado (para no
  // perder los archivos ya elegidos), así que acá SÍ hace falta chequear
  // panelOpen — si no, pegar una imagen en cualquier otro campo del form la
  // metería igual en una lista que ni se está viendo.
  useEffect(() => {
    if (readOnly || !panelOpen) return;
    const onPaste = (e) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageFiles = items
        .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
        .map(item => item.getAsFile())
        .filter(Boolean);
      if (imageFiles.length === 0) return;
      e.preventDefault();
      handleFiles(imageFiles);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, panelOpen, imagenes, documentos]);

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const handleEliminarImagen = async (img) => {
    if (img.queued || img.assignCodArchivo) {
      // Todavía no se subió/asignó a ningún lado — se saca de memoria nomás.
      if (img.queued) URL.revokeObjectURL(img.urlImagen);
      const nuevas = imagenes.filter(i => i !== img);
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar imagen?',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      await axiosClient.delete(`${baseImg(codRepuesto)}/${img.codImagen}`);
      const nuevas = imagenes.filter(i => i.codImagen !== img.codImagen);
      if (img.esPrincipal && nuevas.length > 0) nuevas[0].esPrincipal = true;
      setImagenes(nuevas);
      notifyFlags(nuevas, documentos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  const handleEliminarDocumento = async (doc) => {
    if (doc.queued || doc.assignCodArchivo) {
      const nuevos = documentos.filter(d => d !== doc);
      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar documento?', text: `"${doc.nombre}"`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      await axiosClient.delete(`${baseDoc(codRepuesto)}/${doc.codDocumento}`);
      const nuevos = documentos.filter(d => d.codDocumento !== doc.codDocumento);
      setDocumentos(nuevos);
      notifyFlags(imagenes, nuevos);
    } catch (err) {
      Swal.fire({ title: 'Error', text: err?.response?.data?.message || 'Error al eliminar', icon: 'error', confirmButtonColor: '#dc2626' });
    }
  };

  const atLimit = imagenes.length >= MAX_IMAGES && documentos.length >= MAX_DOCS;
  const totalFiles = imagenes.length + documentos.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <input
        ref={refInput}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      {/* ── Archivos sugeridos: reutilizar uno ya subido a otro repuesto (mismo
          Nro. Parte, o misma Marca+Proveedor) en vez de duplicarlo — el botón que
          dispara la búsqueda vive en page.js, a la altura del header "Archivos
          (opcional)"; acá solo se muestran los resultados una vez abiertos. ──── */}
      {suggestOpen && (
        <div className="mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Archivos sugeridos
            </span>
            <button type="button" onClick={() => setSuggestOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {suggestLoading ? (
            <p className="text-xs text-gray-400 py-3 text-center">Buscando…</p>
          ) : suggestResults.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">No se encontraron archivos sugeridos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestResults.map((item) => (
                <button
                  key={item.codArchivo}
                  type="button"
                  onClick={() => handleUsarSugerido(item)}
                  title={`Usado en el repuesto #${item.codRepuestoOrigen} — click para usar acá`}
                  className="group flex flex-col items-center gap-1 w-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 p-1 hover:border-primary transition"
                >
                  {item.tipoArchivo === 'IMG' ? (
                    <img src={item.url} alt={item.nombre} className="w-14 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded">
                      <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center group-hover:text-primary">
                    {item.nombre}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Zona de arrastrar y soltar (vacío: caja grande) / fila compacta (con archivos) ── */}
      {totalFiles === 0 ? (
        !readOnly && !atLimit && (
          <div
            onClick={() => refInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            title="También podés pegar una imagen (Ctrl+V)"
            className={`flex items-center gap-3 rounded-lg border-2 border-dashed
              py-3 px-4 cursor-pointer transition
              ${dragOver
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75v12" />
            </svg>
            <div className="text-left">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {uploading
                  ? `Subiendo ${uploading.done + 1} de ${uploading.total}…`
                  : 'Arrastra tus archivos aquí o haz clic para elegir'}
              </p>
              <p className="text-xs text-gray-400">
                Imágenes o PDF · máx. {MAX_IMAGES} c/u
              </p>
            </div>
          </div>
        )
      ) : (
        // Con archivos ya elegidos: una sola fila compacta — la miniatura "+" cumple
        // el mismo rol que la caja grande (click o drag&drop siguen agregando archivos).
        <div
          onDragOver={(e) => { if (!readOnly && !atLimit) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-wrap gap-2 rounded-lg p-1.5 -m-1.5 transition ${dragOver ? 'bg-primary/5 ring-2 ring-primary/40' : ''}`}
        >
          {!readOnly && !atLimit && (
            <button
              type="button"
              onClick={() => refInput.current?.click()}
              title={uploading ? `Subiendo ${uploading.done + 1} de ${uploading.total}…` : 'Agregar archivo'}
              className="flex w-16 h-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed
                border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              {uploading ? (
                <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          )}
          {imagenes.map((img, idx) => (
            <div
              key={img.codImagen ?? img.nombre ?? `img-${idx}`}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0"
            >
              <img
                src={img.urlImagen}
                alt={`img-${idx + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => !img.pending && setImgActiva(img.urlImagen)}
              />
              {img.pending && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                </div>
              )}
              {img.esPrincipal && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
              {!readOnly && !img.pending && (
                <button
                  type="button"
                  onClick={() => handleEliminarImagen(img)}
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                >
                  <IconTrash className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {documentos.map((doc, idx) => {
            const Tag = (doc.pending || doc.queued) ? 'div' : 'a';
            return (
              <Tag
                key={doc.codDocumento ?? doc.archivo ?? `doc-${idx}`}
                {...(!doc.pending && !doc.queued && { href: doc.urlDocumento, target: '_blank', rel: 'noreferrer' })}
                title={doc.nombre}
                className="group relative flex items-center gap-2 h-16 max-w-[11rem] px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="h-8 w-8 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 relative">
                  <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  {doc.pending && (
                    <span className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center rounded-md">
                      <span className="h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{doc.nombre}</span>
                {!readOnly && !doc.pending && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleEliminarDocumento(doc); }}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  >
                    <IconTrash className="h-3 w-3" />
                  </button>
                )}
              </Tag>
            );
          })}
        </div>
      )}

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
    </div>
  );
});

export default SpareFiles;
