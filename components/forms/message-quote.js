'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import dynamic from 'next/dynamic';
import axiosClient from '@/app/lib/axiosClient'
import { formatEmailBody } from "@/app/lib/formatEmail";
import { swalSuccess, swalError, swalMailNotSent } from '@/app/lib/swal';
import ComponentContactForm from '@/components/forms/contact-form';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const URL_MAIL_DATA  = 'cotizaciondetalle/datos-mail';
const URL_SEND_EMAIL = 'cotizaciondetalle/enviar-mail';
const URL_CONTACTS   = (codCliente) => `repuestosporcotizar/contactos-cliente/${codCliente}`;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactKey = (c) => c.codRegistro ?? c.email1 ?? '';

const toFormContact = (c) => ({
  codRegistro: c.codRegistro,
  nomContacto: c.nomContacto,
  nomCargo:    c.nomCargo ?? '',
  correos:     [c.email1, c.email2].filter(Boolean).join(';'),
  telefonos:   '',
});

const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const MessageQuoteForm = ({ close, token, t, order, customer }) => {

  const [sending, setSending] = useState(false);
  const [details_message, setDetailsMessage] = useState({});

  const [contacts,         setContacts]         = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [editingContact,   setEditingContact]   = useState(undefined);
  const [para,              setPara]             = useState('');
  const [paraError,         setParaError]        = useState('');

  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    register('message', { required: { value: true, message: t.required_field } });
    getMailData();
    loadContacts();
  }, []);

  useEffect(() => {
    setValue('from', details_message.de);
    setValue('subject', details_message.asunto);
    if (details_message.cuerpo) {
      const isHtml = /<[a-z][\s\S]*>/i.test(details_message.cuerpo);
      const html = isHtml
        ? details_message.cuerpo
        : details_message.cuerpo
            .split('\n')
            .map(line => `<p>${line.trim() === '' ? '<br>' : line}</p>`)
            .join('');
      setValue('message', html);
    }
  }, [details_message]);

  useEffect(() => {
    const emails = selectedContacts.flatMap(c => [c.email1, c.email2].filter(Boolean));
    setPara(emails.join('; '));
  }, [selectedContacts]);

  const getMailData = async () => {
    try {
      const rs = await axiosClient.get(`${URL_MAIL_DATA}/${order.NroOrden}`);
      setDetailsMessage(rs.data);
    } catch (_) {}
  };

  const loadContacts = () => {
    if (!customer?.CodCliente) return;
    axiosClient.get(URL_CONTACTS(customer.CodCliente))
      .then(rs => setContacts(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
  };

  const toggleContact = (contact) => {
    const key = contactKey(contact);
    setSelectedContacts(prev =>
      prev.some(s => contactKey(s) === key)
        ? prev.filter(s => contactKey(s) !== key)
        : [...prev, contact]
    );
  };

  const onSave = async (data) => {
    const emails = para.split(';').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0 || emails.some(e => !emailRegex.test(e))) {
      setParaError('Ingrese al menos un correo válido. Separe varios con ";"');
      return;
    }
    setParaError('');
    setSending(true);
    try {
      const rs = await axiosClient.post(URL_SEND_EMAIL, {
        NroCotizacion: order.NroOrden,
        AsuntoMail:    data.subject,
        DestinoMail:   para,
        CuerpoMail:    formatEmailBody(data.message, "html"),
      });
      close();
      // La cotización se registró; si el correo no salió, avisar en vez del "éxito".
      if (rs.data?.correoEnviado === false) {
        swalMailNotSent(t);
      } else {
        swalSuccess(rs.data?.mensaje ?? t.message_sent);
      }
    } catch (error) {
      const status = error?.response?.status;
      const body   = error?.response?.data;
      if (status === 422) {
        swalError('Configuración incompleta', 'El usuario no tiene correo electrónico o contraseña configurados.');
      } else if (status === 400) {
        swalError('Datos incompletos', body?.mensaje ?? 'Verifica los campos requeridos.');
      } else if (status === 500) {
        swalError(body?.mensaje ?? 'Error al enviar', body?.detalle ?? '');
      } else {
        swalError(t.error, t.message_sent_error ?? 'No se pudo enviar el correo.');
      }
    } finally {
      setSending(false);
    }
  };

  if (editingContact !== undefined) {
    return (
      <div>
        <ComponentContactForm
          contact={editingContact}
          isNew={editingContact === null}
          cliente={{ codCliente: customer?.CodCliente }}
          onCancel={() => setEditingContact(undefined)}
          onSaved={() => {
            setEditingContact(undefined);
            setSelectedContacts([]);
            loadContacts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-4">

      {sending && (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/85 dark:bg-gray-900/85 flex flex-col gap-3 p-1 pointer-events-none">
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
              <th className="px-2 py-1.5 text-left font-semibold">Contacto</th>
              <th className="px-2 py-1.5 text-left font-semibold">Cargo</th>
              <th className="px-2 py-1.5 text-left font-semibold">Mail 1</th>
              <th className="px-2 py-1.5 text-left font-semibold">Mail 2</th>
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
            {contacts.map((c, i) => (
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
                <td className="px-2 py-1.5 text-slate-600 text-[12px]">{c.email1}</td>
                <td className="px-2 py-1.5 text-slate-400 text-[12px]">{c.email2}</td>
                <td className="px-2 py-1.5 text-right">
                  <button type="button" onClick={() => setEditingContact(toFormContact(c))}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition">
                    <IconPencil /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-center text-[12px] text-slate-400">
                  Sin contactos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(onSave)}>

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
            <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{details_message.de ?? '—'}</span>
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
          <div className={`rounded-md overflow-hidden ${errors.message ? 'ring-1 ring-red-400' : ''}`}>
            <ReactQuill
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
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-150"
          >
            {t.btn_cancel}
          </button>
          <button
            type="submit"
            disabled={sending}
            className="btn btn-success inline-flex items-center gap-2 h-9"
          >
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
            {sending ? 'Enviando...' : t.btn_send}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageQuoteForm;
