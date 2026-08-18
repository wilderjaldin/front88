'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import { useForm } from "react-hook-form"
import ContactSupplierForm from '@/app/admin/register/suppliers/[id]/[tab]/tabs/ContactSupplierForm';
import IconPaperclip from '@/components/icon/icon-paperclip';
import IconFile from '@/components/icon/icon-file';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const URL_DATA_EMAIL = 'ordenescompra/datos-mail-proveedor';
const URL_SEND_EMAIL = 'ordenescompra/enviar-mail-proveedor';

// Imagen, PDF, Excel, Word.
const ATTACH_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.xls', '.xlsx', '.doc', '.docx'];
const ATTACH_ACCEPT = 'image/*,.pdf,.xls,.xlsx,.doc,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactKey = (c) => c.codRegistro ?? c.email1 ?? '';

const toFormContact = (c) => ({
  codRegistro: c.codRegistro,
  nomContacto: c.nomContacto,
  nomCargo:    c.nomCargo ?? '',
  correos:     [c.email1, c.email2].filter(Boolean).join(';'),
  telefonos:   '',
});

const MailForm = ({ close, t, order, order_id }) => {
  const [contacts,         setContacts]         = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [editingContact,   setEditingContact]   = useState(undefined);
  const [loadingTemplate,  setLoadingTemplate]  = useState(true);
  const [para,              setPara]            = useState('');
  const [paraError,         setParaError]       = useState('');
  const [fromEmail,         setFromEmail]       = useState('');
  const [sending,           setSending]         = useState(false);
  const [attachments,       setAttachments]     = useState([]);
  const [resizeImg,         setResizeImg]       = useState(null);
  const [handleRect,        setHandleRect]      = useState(null);

  const quillRef       = useRef(null);
  const rawTemplate    = useRef('');
  const fileInputRef   = useRef(null);
  const dragState      = useRef(null);
  const selectedImgRef = useRef(null);
  // Imágenes pegadas e insertadas inline (dataURI -> cid) — se reemplazan en el HTML
  // recién al enviar, para no romper la vista previa mientras se edita.
  const pastedImages = useRef([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    register('message', { required: { value: true, message: t.required_field } });
    getData();
  }, []);

  useEffect(() => {
    const emails = selectedContacts.flatMap(c => [c.email1, c.email2].filter(Boolean));
    setPara(emails.join('; '));
  }, [selectedContacts]);

  // Ctrl+V de una imagen: se ve inline en el editor (vista previa), pero al enviar se
  // reemplaza por cid: en el HTML — los clientes de correo (Gmail incluido) eliminan
  // las <img src="data:..."> al renderizar, solo aceptan imágenes vía adjunto+cid.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;

      const handleEditorPaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const imageItems = Array.from(items).filter(item => item.type.indexOf('image') !== -1);
        if (imageItems.length === 0) return; // deja que Quill maneje el paste normal (texto/html)

        // Captura antes de que el propio listener de paste de Quill (bubble) reciba el
        // evento — si no, Quill también intenta procesar la imagen.
        e.preventDefault();
        e.stopPropagation();

        imageItems.forEach((item, i) => {
          const blob = item.getAsFile();
          if (!blob) return;
          const ext = (blob.type.split('/')[1] || 'png').split('+')[0];
          const cid = `imagen-${Date.now()}-${i}`;
          const file = new File([blob], `${cid}.${ext}`, { type: blob.type });
          const reader = new FileReader();
          reader.onload = () => {
            const dataUri = String(reader.result);
            const range = editor.getSelection(true);
            const index = range?.index ?? editor.getLength();
            editor.insertEmbed(index, 'image', dataUri, 'user');
            editor.setSelection(index + 1);
            setValue('message', editor.root.innerHTML, { shouldValidate: true });
            pastedImages.current.push({ dataUri, cid });
            setAttachments(prev => [...prev, { file, cid }]);
          };
          reader.readAsDataURL(blob);
        });
      };

      editor.root.addEventListener('paste', handleEditorPaste, true);
      editor.root.__handlePaste = handleEditorPaste;
    }, 300);

    return () => {
      clearTimeout(timeout);
      const editor = quillRef.current?.getEditor?.();
      if (editor?.root?.__handlePaste) {
        editor.root.removeEventListener('paste', editor.root.__handlePaste, true);
      }
    };
  }, [loadingTemplate]);

  // Click en una imagen del cuerpo la selecciona y muestra la manija de resize.
  // Se pega/inserta siempre a su tamaño original — esto solo permite achicarla/agrandarla
  // manualmente después, sin tocar el archivo adjunto real.
  // Usa un ref (no el state) para el nodo seleccionado: este listener se registra una
  // sola vez, así que leer el state acá adentro siempre daría el valor viejo.
  const deselectImage = () => {
    if (selectedImgRef.current) selectedImgRef.current.style.outline = '';
    selectedImgRef.current = null;
    setResizeImg(null);
    setHandleRect(null);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;

      const handleClick = (e) => {
        if (e.target.tagName === 'IMG') {
          if (selectedImgRef.current && selectedImgRef.current !== e.target) {
            selectedImgRef.current.style.outline = '';
          }
          e.target.style.outline = '2px solid #4361ee';
          selectedImgRef.current = e.target;
          const rect = e.target.getBoundingClientRect();
          setResizeImg(e.target);
          setHandleRect({ top: rect.bottom, left: rect.right });
        } else {
          deselectImage();
        }
      };

      editor.root.addEventListener('click', handleClick);
      editor.root.__handleImgClick = handleClick;
    }, 300);

    return () => {
      clearTimeout(timeout);
      const editor = quillRef.current?.getEditor?.();
      if (editor?.root?.__handleImgClick) {
        editor.root.removeEventListener('click', editor.root.__handleImgClick);
      }
    };
  }, [loadingTemplate]);

  // Mantiene la manija pegada a la imagen si el modal hace scroll con una imagen seleccionada.
  useEffect(() => {
    if (!resizeImg) return;
    const reposition = () => {
      const rect = resizeImg.getBoundingClientRect();
      setHandleRect({ top: rect.bottom, left: rect.right });
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [resizeImg]);

  const startResize = (e) => {
    e.preventDefault();
    if (!resizeImg) return;
    dragState.current = { startX: e.clientX, startWidth: resizeImg.getBoundingClientRect().width };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  };

  const onDragMove = (e) => {
    if (!dragState.current || !resizeImg) return;
    const delta = e.clientX - dragState.current.startX;
    const newWidth = Math.max(40, Math.round(dragState.current.startWidth + delta));
    resizeImg.style.width = `${newWidth}px`;
    resizeImg.style.height = 'auto';
    const rect = resizeImg.getBoundingClientRect();
    setHandleRect({ top: rect.bottom, left: rect.right });
  };

  const onDragEnd = () => {
    if (resizeImg) {
      const finalWidth = Math.round(resizeImg.getBoundingClientRect().width);
      resizeImg.setAttribute('width', String(finalWidth));
      resizeImg.removeAttribute('height');
      const editor = quillRef.current?.getEditor?.();
      if (editor) setValue('message', editor.root.innerHTML, { shouldValidate: true });
    }
    dragState.current = null;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  };

  // Adjuntos reales (no inline) — imagen, PDF, Excel o Word — se envían junto al correo.
  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFilesSelected = (e) => {
    const selected = Array.from(e.target.files || []);
    const invalid = selected.filter(f => !ATTACH_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalid.length > 0) {
      swalError(t.error, `${t.invalid_file_type ?? 'Tipo de archivo no permitido'}: ${invalid.map(f => f.name).join(', ')}`);
    }
    const valid = selected.filter(f => !invalid.includes(f));
    if (valid.length > 0) setAttachments(prev => [...prev, ...valid.map(file => ({ file, cid: null }))]);
    e.target.value = '';
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const buildPayload = () => ({
    codPrv: order.CodPrv,
    numOrdenCompra: order_id,
  });

  const getData = async () => {
    setLoadingTemplate(true);
    try {
      const rs = await axiosClient.post(URL_DATA_EMAIL, buildPayload());
      setFromEmail(rs.data?.remitente ?? '');
      setValue('subject', rs.data?.asunto ?? '');
      const cuerpo = rs.data?.cuerpo ?? '';
      rawTemplate.current = cuerpo;
      setValue('message', cuerpo, { shouldValidate: false });
      setContacts(Array.isArray(rs.data?.contactosPrv) ? rs.data.contactosPrv : []);
    } catch (error) {
      swalError(t.error, t.message_sent_error ?? 'No se pudo cargar la información del correo.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const refreshContacts = async () => {
    try {
      const rs = await axiosClient.post(URL_DATA_EMAIL, buildPayload());
      setContacts(Array.isArray(rs.data?.contactosPrv) ? rs.data.contactosPrv : []);
    } catch (error) {}
  };

  const toggleContact = (contact) => {
    const key = contactKey(contact);
    setSelectedContacts(prev =>
      prev.some(s => contactKey(s) === key)
        ? prev.filter(s => contactKey(s) !== key)
        : [...prev, contact]
    );
  };

  const onSend = async (data) => {
    const emails = para.split(';').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0 || emails.some(e => !emailRegex.test(e))) {
      setParaError('Ingrese al menos un correo válido. Separe varios con ";"');
      return;
    }
    setParaError('');
    deselectImage(); // saca el resaltado de selección antes de leer el HTML
    setSending(true);
    try {
      const editor = quillRef.current?.getEditor?.();
      let bodyHtml = editor ? editor.root.innerHTML : rawTemplate.current || data.message;
      // Las imágenes pegadas viajan como data: mientras se edita, para poder
      // previsualizarlas — recién acá se cambian por la referencia cid: que
      // el backend debe resolver contra el adjunto homónimo marcado inline.
      pastedImages.current.forEach(({ dataUri, cid }) => {
        bodyHtml = bodyHtml.split(dataUri).join(`cid:${cid}`);
      });
      const adjuntos = await Promise.all(attachments.map(async ({ file, cid }) => ({
        nombreArchivo: file.name,
        tipoContenido: file.type,
        contenidoBase64: await fileToBase64(file),
        ...(cid ? { cid, inline: true } : {}),
      })));
      await axiosClient.post(URL_SEND_EMAIL, {
        numOrdenCompra: order_id,
        destinoMail: para,
        asuntoMail: data.subject,
        cuerpoMail: bodyHtml,
        ...(adjuntos.length > 0 ? { adjuntos } : {}),
      });
      close();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.message_sent_error ?? 'No se pudo enviar el correo.');
    } finally {
      setSending(false);
    }
  };

  const noSend = () => {
    close();
  };

  if (editingContact !== undefined) {
    return (
      <div>
        <ContactSupplierForm
          contacto={editingContact}
          proveedor={{ codPrv: Number(order.CodPrv) }}
          onCancel={() => setEditingContact(undefined)}
          onSaved={() => {
            setEditingContact(undefined);
            setSelectedContacts([]);
            refreshContacts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-4">

      {(sending || loadingTemplate) && (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/85 dark:bg-gray-900/85 flex flex-col gap-3 p-1 pointer-events-none">
          <div className="h-9 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
          <div className="h-24 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-4 rounded shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 h-7 rounded animate-pulse bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-4 rounded shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            <div className="w-44 h-4 rounded animate-pulse bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-4 rounded shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 h-7 rounded animate-pulse bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex-1 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* Tabla de contactos */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
        <table className="w-full">
          <thead style={{ backgroundColor: '#f1f5f9' }}>
            <tr>
              <th className="w-8 px-2 py-1.5" />
              <th className="px-2 py-1.5 text-left font-semibold">{t.name_contact ?? 'Contacto'}</th>
              <th className="px-2 py-1.5 text-left font-semibold">{t.position ?? 'Cargo'}</th>
              <th className="px-2 py-1.5 text-left font-semibold">{t.mail ?? 'Mail'} 1</th>
              <th className="px-2 py-1.5 text-left font-semibold">{t.mail ?? 'Mail'} 2</th>
              <th className="px-2 py-1.5 text-right">
                <button type="button" onClick={() => setEditingContact(null)}
                  style={{ backgroundColor: '#334155', color: '#fff' }}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold hover:opacity-80 transition">
                  + Añadir
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingTemplate ? (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-center text-[12px] text-slate-400">
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin align-middle mr-1.5" />
                  {t.loading ?? 'Cargando...'}
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-center text-[12px] text-slate-400">
                  Sin contactos registrados
                </td>
              </tr>
            ) : contacts.map((c, i) => (
              <tr key={contactKey(c) || i}
                className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                onClick={() => toggleContact(c)}>
                <td className="px-2 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                  <input type="checkbox"
                    checked={selectedContacts.some(s => contactKey(s) === contactKey(c))}
                    onChange={() => toggleContact(c)}
                    className="form-checkbox" />
                </td>
                <td className="px-2 py-1.5 font-medium">{c.nomContacto}</td>
                <td className="px-2 py-1.5 text-slate-500 text-[12px]">{c.nomCargo}</td>
                <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 text-[12px]">{c.email1}</td>
                <td className="px-2 py-1.5 text-slate-400 text-[12px]">{c.email2}</td>
                <td className="px-2 py-1.5 text-right" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => setEditingContact(toFormContact(c))}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition">
                    <IconPencil /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario */}
      <form className="space-y-3" onSubmit={handleSubmit(onSend)}>

        {/* Para / De / Asunto */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 divide-y divide-gray-200 dark:divide-gray-700">
          <div className="flex items-start gap-3 px-3 py-2">
            <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1.5">Para:</label>
            <div className="flex-1">
              <input type="text" value={para} onChange={e => { setPara(e.target.value); setParaError(''); }}
                className={`w-full h-7 rounded border px-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none ${paraError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent'}`} />
              {paraError && <p className="text-[11px] text-red-500 mt-0.5">{paraError}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">De:</label>
            <input type="text" readOnly value={fromEmail}
              className="flex-1 h-7 rounded border-0 bg-amber-50 dark:bg-amber-900/20 px-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none" />
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Asunto:</label>
            <input type="text" autoComplete="off"
              {...register('subject', { required: { value: true, message: t.required_field } })}
              className={`flex-1 h-7 rounded border px-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/40 ${errors.subject ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900'}`} />
          </div>
        </div>
        {errors.subject && <p className="text-[11px] text-red-500 mt-0.5 pl-16">{errors.subject.message}</p>}

        {/* Cuerpo */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Cuerpo:</label>
            <button
              type="button"
              onClick={handleAttachClick}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/5 transition"
            >
              <IconPaperclip className="h-3.5 w-3.5" />
              {t.attach_file ?? 'Adjuntar archivo'}
            </button>
            <input ref={fileInputRef} type="file" multiple accept={ATTACH_ACCEPT} className="hidden" onChange={handleFilesSelected} />
          </div>

          {/* Las imágenes pegadas (cid) ya se ven inline en el cuerpo — solo se listan
              acá los adjuntos "normales" elegidos con el botón. */}
          {attachments.some(a => !a.cid) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.filter(a => !a.cid).map((a, i) => (
                <span key={`${a.file.name}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 pl-2 pr-1 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <IconFile className="h-3 w-3 shrink-0" />
                  <span className="max-w-[160px] truncate">{a.file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter(x => x !== a))}
                    className="inline-flex items-center justify-center h-4 w-4 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className={`rounded-md overflow-hidden ${errors.message ? 'ring-1 ring-red-400' : ''}`}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={watch('message') || ''}
              onChange={(content) => setValue('message', content, { shouldValidate: true })}
              modules={{
                toolbar: [
                  [{ font: [] }, { size: [] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ color: [] }, { background: [] }],
                  [{ script: 'sub' }, { script: 'super' }],
                  [{ header: 1 }, { header: 2 }, 'blockquote', 'code-block'],
                  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                  [{ align: [] }],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
          </div>
          {errors.message && <span className="text-red-400 text-xs mt-1 block">{errors.message.message}</span>}

          {resizeImg && handleRect && (
            <div
              onMouseDown={startResize}
              title={t.resize_image ?? 'Arrastrar para cambiar el tamaño'}
              style={{ position: 'fixed', top: handleRect.top - 6, left: handleRect.left - 6 }}
              className="z-[10000] h-3 w-3 rounded-sm border-2 border-white bg-primary shadow cursor-nwse-resize"
            />
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={noSend}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150">
            {t.do_not_send}
          </button>
          <button type="submit" disabled={sending} className="btn btn-success inline-flex items-center gap-2 h-9">
            {sending ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            {sending ? (t.sending_message ?? 'Enviando...') : t.btn_send}
          </button>
        </div>

      </form>
    </div>
  );
};

export default MailForm;
