'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import axiosClient from '@/app/lib/axiosClient';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useForm } from 'react-hook-form';
import { swalSuccess, swalError } from '@/app/lib/swal';
import Select from 'react-select';
import ContactSupplierForm from '@/app/admin/register/suppliers/[id]/[tab]/tabs/ContactSupplierForm';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const URL_DATA_EMAIL = 'repuestosporcotizar/datos-mail-proveedor';
const URL_CONTACTS   = (codPrv) => `repuestosporcotizar/contactos-proveedor/${codPrv}`;
const URL_SEND_EMAIL = 'repuestosporcotizar/enviar-mail-proveedor';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactKey = (c) => c.codRegistro ?? c.email1 ?? '';

const toFormContact = (c) => ({
  codRegistro: c.codRegistro,
  nomContacto: c.nomContacto,
  nomCargo:    c.nomCargo ?? '',
  correos:     [c.email1, c.email2].filter(Boolean).join(';'),
  telefonos:   '',
});

const MailToSupplierForm = ({ close, t, selected = [] }) => {
  const authUser  = useSelector(selectUser);
  const userEmail = authUser?.Email ?? authUser?.email ?? '';

  const [suppliers,        setSuppliers]        = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [contacts,         setContacts]         = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [editingContact,   setEditingContact]   = useState(undefined);
  const [loadingContacts,  setLoadingContacts]  = useState(false);
  const [para,             setPara]             = useState('');
  const [paraError,        setParaError]        = useState('');
  const [loading,          setLoading]          = useState(false);

  const quillRef    = useRef(null);
  const rawTemplate = useRef('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    register('message', { required: { value: true, message: t.required_field } });
    getData();
  }, []);

  useEffect(() => {
    const emails = selectedContacts.flatMap(c => [c.email1, c.email2].filter(Boolean));
    setPara(emails.join('; '));
  }, [selectedContacts]);

  const getData = async () => {
    try {
      const payload = selected.map(item => ({
        NroOrden:   item.nroCotizacion,
        NroParte:   item.nroParte,
        Cantidad:   item.cantidad,
        Aplicacion: item.nomMarca ?? '',
      }));
      const rs = await axiosClient.post(URL_DATA_EMAIL, payload);
      setSuppliers(rs.data.proveedores ?? []);
      setValue('subject', rs.data.template?.asunto ?? '');
      const cuerpo = rs.data.template?.cuerpo ?? '';
      rawTemplate.current = cuerpo;
      setValue('message', cuerpo, { shouldValidate: false });
    } catch {}
  };

  const refreshContacts = () => {
    if (!selectedSupplier) return;
    axiosClient.get(URL_CONTACTS(selectedSupplier.value))
      .then(rs => setContacts(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
  };

  const handleSelectSupplier = async (supplier) => {
    setSelectedSupplier(supplier);
    setSelectedContacts([]);
    setEditingContact(undefined);
    setPara('');
    setContacts([]);
    if (!supplier) return;
    setLoadingContacts(true);
    try {
      const rs = await axiosClient.get(URL_CONTACTS(supplier.value));
      setContacts(Array.isArray(rs.data) ? rs.data : []);
    } catch {} finally {
      setLoadingContacts(false);
    }
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
    setLoading(true);
    try {
      const editor   = quillRef.current?.getEditor?.();
      const bodyHtml = editor ? editor.root.innerHTML : rawTemplate.current || data.message;
      await axiosClient.post(URL_SEND_EMAIL, {
        asuntoMail:  data.subject,
        destinoMail: para,
        cuerpoMail:  bodyHtml,
      });
      close();
      swalSuccess(t.message_sent);
    } catch (err) {
      const status = err?.response?.status;
      const body   = err?.response?.data;
      if (status === 400) {
        swalError('Datos incompletos', body?.mensaje ?? 'Verifica los campos requeridos.');
      } else if (status === 500) {
        swalError(body?.mensaje ?? 'Error al enviar', body?.detalle ?? '');
      } else {
        swalError(t.error, t.message_sent_error ?? 'No se pudo enviar el correo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (editingContact !== undefined) {
    return (
      <div>
        <ContactSupplierForm
          contacto={editingContact}
          proveedor={{ codPrv: Number(selectedSupplier?.value) }}
          onCancel={() => setEditingContact(undefined)}
          onSaved={() => {
            setSelectedContacts([]);
            refreshContacts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-4">

      {loading && (
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

      {/* Select Proveedor */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
          Proveedor
        </label>
        <Select
          isClearable
          options={suppliers}
          value={selectedSupplier}
          onChange={handleSelectSupplier}
          placeholder="Seleccionar proveedor..."
          filterOption={(option, inputValue) =>
            inputValue.length < 2
              ? false
              : option.label.toLowerCase().includes(inputValue.toLowerCase())
          }
          noOptionsMessage={({ inputValue }) =>
            inputValue.length < 2 ? 'Ingrese al menos 2 caracteres' : 'Sin resultados'
          }
        />
      </div>

      {/* Tabla de contactos — solo visible cuando hay proveedor seleccionado */}
      {selectedSupplier && (
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
              {loadingContacts ? (
                <tr>
                  <td colSpan={6} className="px-2 py-3 text-center text-[12px] text-slate-400">
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin align-middle mr-1.5" />
                    Cargando...
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
      )}

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
            <input type="text" readOnly value={userEmail}
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
                  ['link', 'image', 'video'],
                  ['clean'],
                ],
              }}
            />
          </div>
          {errors.message && <span className="text-red-400 text-xs mt-1 block">{errors.message.message}</span>}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={close}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150">
            {t.btn_cancel}
          </button>
          <button type="submit" disabled={loading} className="btn btn-success inline-flex items-center gap-2 h-9">
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            {loading ? 'Enviando...' : t.btn_send}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MailToSupplierForm;
