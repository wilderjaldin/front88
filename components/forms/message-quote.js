'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import dynamic from 'next/dynamic';
import axiosClient from '@/app/lib/axiosClient'
import Swal from 'sweetalert2'
import { formatEmailBody } from "@/app/lib/formatEmail";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const URL_MAIL_DATA  = 'cotizaciondetalle/datos-mail';
const URL_SEND_EMAIL = 'cotizaciondetalle/enviar-mail';

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#ef4444',
});

const MessageQuoteForm = ({ close, token, t, order }) => {

  const [sending, setSending] = useState(false);
  const [details_message, setDetailsMessage] = useState({});

  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    register('message', { required: { value: true, message: t.required_field } });
    getMailData();
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

  const getMailData = async () => {
    try {
      const rs = await axiosClient.get(`${URL_MAIL_DATA}/${order.NroOrden}`);
      setDetailsMessage(rs.data);
    } catch (_) {}
  };

  const onSave = async (data) => {
    setSending(true);
    try {
      Swal.fire({
        html: t.sending_message,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const rs = await axiosClient.post(URL_SEND_EMAIL, {
        NroCotizacion: order.NroOrden,
        AsuntoMail: data.subject,
        DestinoMail: data.to,
        CuerpoMail: formatEmailBody(data.message, "html"),
      });

      Swal.close();

      if (rs.data.estado == 'Ok') {
        close();
        swalSuccess(t.message_sent);
      } else if (rs.data.estado == 'Error') {
        close();
        swalError(rs.data.mensaje);
      }
    } catch (_) {
      Swal.close();
      swalError(t.error, t.message_sent_error, t.close);
    } finally {
      setSending(false);
    }
  };

  const labelClass = "w-16 shrink-0 text-sm font-medium text-gray-600 text-right";
  const errorClass = "text-red-400 text-xs mt-0.5 block pl-[4.5rem]";

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSave)}>

      {/* Para */}
      <div className="flex items-center gap-3">
        <label className={labelClass}>{t.to_email}</label>
        <input
          type="text"
          autoComplete="off"
          placeholder={t.enter_to}
          {...register("to", { required: { value: true, message: t.required_field } })}
          className={`form-input h-9 text-sm flex-1 ${errors.to ? 'border-red-400' : ''}`}
        />
      </div>
      {errors.to && <span className={errorClass}>{errors.to.message}</span>}

      {/* De */}
      <div className="flex items-center gap-3">
        <label className={labelClass}>{t.from_email}</label>
        <input
          type="text"
          autoComplete="off"
          placeholder={t.enter_from}
          {...register("from", { required: { value: true, message: t.required_field } })}
          className={`form-input h-9 text-sm flex-1 ${errors.from ? 'border-red-400' : ''}`}
        />
      </div>
      {errors.from && <span className={errorClass}>{errors.from.message}</span>}

      {/* Asunto */}
      <div className="flex items-center gap-3">
        <label className={labelClass}>{t.subject}</label>
        <input
          type="text"
          autoComplete="off"
          placeholder={t.enter_subject}
          {...register("subject", { required: { value: true, message: t.required_field } })}
          className={`form-input h-9 text-sm flex-1 ${errors.subject ? 'border-red-400' : ''}`}
        />
      </div>
      {errors.subject && <span className={errorClass}>{errors.subject.message}</span>}

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
                ['link', 'image', 'video'],
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
  );
};

export default MessageQuoteForm;
