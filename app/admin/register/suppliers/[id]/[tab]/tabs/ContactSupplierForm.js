'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconPlus from '@/components/icon/icon-plus';

const URL_SAVE = (codPrv) => `/proveedores/${codPrv}/contactos/guardar`;

// ── Validaciones ──────────────────────────────────────────────────────────────
const LETTERS_BASE = '[a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑàèìòùÀÈÌÒÙçÇ]';
const LETTERS_ONLY = new RegExp(`^${LETTERS_BASE}+([ '-]${LETTERS_BASE}+)*$`);
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX  = /^[0-9\s+\-().]+$/;

const sanitize      = (v) => (v ?? '').replace(/\s+/g, ' ').trim();
const sanitizeName  = (v) => {
  let s = (v ?? '')
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑàèìòùÀÈÌÒÙçÇ\s'-]/g, '')
    .replace(/[ '-]{2,}/g, ' ')
    .replace(/^[ '-]+/, '')
    .replace(/[ '-]+$/, '');
  return s.replace(/\s+/g, ' ').trim();
};
const sanitizePhone = (v) => (v ?? '').replace(/[^0-9\s+\-().]/g, '').trim();

const RULES = {
  nomContacto: {
    required:  'El nombre del contacto es obligatorio',
    minLength: { value: 3,  message: 'El nombre debe tener mínimo 3 caracteres' },
    maxLength: { value: 80, message: 'El nombre no puede superar 80 caracteres' },
    validate: {
      noOnlySpaces: (v) => sanitize(v).length > 0 || 'El nombre no puede estar vacío',
      lettersOnly:  (v) => LETTERS_ONLY.test(sanitize(v)) || "Solo letras, espacios, guion simple o apóstrofe simple",
    },
  },
  nomCargo: {
    maxLength: { value: 80, message: 'El cargo no puede superar 80 caracteres' },
    validate: {
      minLen:      (v) => !v || sanitize(v).length === 0 || sanitize(v).length >= 3 || 'Mínimo 3 caracteres',
      lettersOnly: (v) => !v || sanitize(v).length === 0 || LETTERS_ONLY.test(sanitize(v)) || 'Solo letras y caracteres básicos',
    },
  },
  email: {
    maxLength: { value: 45, message: 'Máximo 45 caracteres' },
    validate: {
      format: (v) => !v || sanitize(v).length === 0 || EMAIL_REGEX.test(sanitize(v)) || 'Formato inválido. Ej: nombre@dominio.com',
    },
  },
  phone: {
    maxLength: { value: 45, message: 'Máximo 45 caracteres' },
    validate: {
      validChars: (v) => !v || sanitize(v).length === 0 || PHONE_REGEX.test(v.trim()) || 'Solo dígitos y + - ( ) .',
      minDigits:  (v) => !v || sanitize(v).length === 0 || v.replace(/\D/g, '').length >= 4 || 'Mínimo 4 dígitos',
    },
  },
};

// ── Error inline ──────────────────────────────────────────────────────────────
const FieldError = ({ error }) =>
  error ? <span className="text-red-400 text-xs mt-1 block leading-tight">{error.message}</span> : null;

// ── Grupo expandible ──────────────────────────────────────────────────────────
const ExpandableGroup = ({ label, fields, register, rules, errors, visible, onExpand }) => {
  const visibleFields = fields.slice(0, visible);
  const hasMore = visible < fields.length;
  return (
    <div className="space-y-2">
      {visibleFields.map((field, idx) => {
        const isLast = idx === visibleFields.length - 1;
        return (
          <div key={field.name}>
            <div className="flex items-center gap-2">
              <label className="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2">
                {label} {fields.length > 1 ? idx + 1 : ''}
              </label>
              <input
                type="text"
                autoComplete="off"
                spellCheck="false"
                {...register(field.name, rules)}
                placeholder={field.placeholder}
                className={`form-input flex-1 ${errors[field.name] ? 'error' : ''}`}
              />
              {isLast && hasMore ? (
                <button
                  type="button"
                  onClick={onExpand}
                  title={`Agregar otro ${label.toLowerCase()}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                             border border-gray-300 dark:border-gray-600 text-gray-400
                             hover:border-primary hover:text-primary transition-colors"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="w-9 shrink-0" />
              )}
            </div>
            {errors[field.name] && (
              <div className="flex">
                <div className="w-36 shrink-0" />
                <FieldError error={errors[field.name]} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ContactForm({ contacto = null, proveedor, onCancel, onSaved }) {
  const t      = useTranslation();
  const isEdit = !!contacto?.codRegistro;

  const [emailsVisible, setEmailsVisible] = useState(1);
  const [phonesVisible, setPhonesVisible] = useState(1);

  const {
    register, reset, handleSubmit, setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { nomContacto: '', nomCargo: '', email_1: '', email_2: '', phone_1: '', phone_2: '', phone_3: '', blnFijar: false },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!contacto) {
      reset({ nomContacto: '', nomCargo: '', email_1: '', email_2: '', phone_1: '', phone_2: '', phone_3: '', blnFijar: false });
      setEmailsVisible(1);
      setPhonesVisible(1);
      return;
    }
    const emails = (contacto.correos   ?? '').split(';').map(s => s.trim()).filter(Boolean);
    const phones = (contacto.telefonos ?? '').split(';').map(s => s.trim()).filter(Boolean);
    reset({
      nomContacto: contacto.nomContacto ?? '',
      nomCargo:    contacto.nomCargo    ?? '',
      email_1: emails[0] ?? '',
      email_2: emails[1] ?? '',
      phone_1: phones[0] ?? '',
      phone_2: phones[1] ?? '',
      phone_3: phones[2] ?? '',
      blnFijar: contacto.blnFijar ?? false,
    });
    setEmailsVisible(emails.length >= 2 ? 2 : 1);
    setPhonesVisible(Math.max(1, phones.length));
  }, [contacto]);

  const onSubmit = async (data) => {
    const payload = {
      codRegistro:  contacto?.codRegistro ?? 0,
      codPrv:       proveedor.codPrv,
      nomContacto:  sanitizeName(data.nomContacto),
      nomCargo:     sanitizeName(data.nomCargo ?? ''),
      email1:       sanitize(data.email_1 ?? '').toLowerCase(),
      email2:       sanitize(data.email_2 ?? '').toLowerCase(),
      numTelefono1: sanitizePhone(data.phone_1 ?? ''),
      numTelefono2: sanitizePhone(data.phone_2 ?? ''),
      numTelefono3: sanitizePhone(data.phone_3 ?? ''),
      blnFijar:     data.blnFijar ?? false,
    };

    if (!payload.nomContacto) {
      setError('nomContacto', { type: 'manual', message: 'El nombre del contacto es obligatorio' });
      return;
    }

    try {
      const res = await axiosClient.post(URL_SAVE(proveedor.codPrv), payload);
      Swal.fire({
        title: t.success, icon: 'success',
        confirmButtonColor: '#15803d',
        text: isEdit ? t.contact_update_save : t.contact_success_save,
        confirmButtonText: t.close,
      }).then(() => { onSaved?.(res.data ?? []); onCancel(); });
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (err?.response?.status === 400 && apiErrors) {
        const MAP = { NomContacto: 'nomContacto', NomCargo: 'nomCargo', Email1: 'email_1', Email2: 'email_2', NumTelefono1: 'phone_1', NumTelefono2: 'phone_2', NumTelefono3: 'phone_3' };
        Object.entries(apiErrors).forEach(([apiField, messages]) => {
          const formField = MAP[apiField];
          if (formField) {
            setError(formField, { type: 'server', message: Array.isArray(messages) ? messages[0] : messages });
            if (formField === 'email_2') setEmailsVisible(2);
            if (formField === 'phone_2') setPhonesVisible(v => Math.max(v, 2));
            if (formField === 'phone_3') setPhonesVisible(3);
          }
        });
        return;
      }
      Swal.fire({ title: t.error, text: t.contact_error_server, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
    }
  };

  const emailFields = [
    { name: 'email_1', placeholder: 'correo@ejemplo.com' },
    { name: 'email_2', placeholder: 'correo@ejemplo.com' },
  ];
  const phoneFields = [
    { name: 'phone_1', placeholder: '' },
    { name: 'phone_2', placeholder: '' },
    { name: 'phone_3', placeholder: '' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-1" noValidate>

      {/* Nombre */}
      <div className="flex items-start gap-2">
        <label className="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.contact_name}
        </label>
        <div className="flex-1">
          <input
            type="text" autoComplete="off" spellCheck="false"
            {...register('nomContacto', RULES.nomContacto)}
            placeholder="Ej: María García"
            className={`form-input w-full ${errors.nomContacto ? 'error' : ''}`}
          />
          <FieldError error={errors.nomContacto} />
        </div>
        <div className="w-9 shrink-0" />
      </div>

      {/* Cargo */}
      <div>
        <div className="flex items-center gap-2">
          <label className="w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2">
            {t.position}
          </label>
          <input
            type="text" autoComplete="off" spellCheck="false"
            {...register('nomCargo', RULES.nomCargo)}
            placeholder="Ej: Gerente Comercial"
            className={`form-input flex-1 ${errors.nomCargo ? 'error' : ''}`}
          />
          <div className="w-9 shrink-0" />
        </div>
        {errors.nomCargo && (
          <div className="flex"><div className="w-36 shrink-0" /><FieldError error={errors.nomCargo} /></div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

      {/* Correos */}
      <ExpandableGroup
        label="Correo electrónico"
        fields={emailFields}
        register={register}
        rules={RULES.email}
        errors={errors}
        visible={emailsVisible}
        onExpand={() => setEmailsVisible(v => Math.min(v + 1, emailFields.length))}
      />

      {/* Teléfonos */}
      <ExpandableGroup
        label="Teléfono"
        fields={phoneFields}
        register={register}
        rules={RULES.phone}
        errors={errors}
        visible={phonesVisible}
        onExpand={() => setPhonesVisible(v => Math.min(v + 1, phoneFields.length))}
      />

      {/* Fijar predeterminado */}
      <div className="flex items-center gap-2 pl-[152px]">
        <input type="checkbox" id="blnFijar" {...register('blnFijar')} className="form-checkbox" />
        <label htmlFor="blnFijar" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
          {t.set_default}
        </label>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 mt-2">
        <button type="button" onClick={onCancel} className="btn btn-outline-danger">
          {t.btn_cancel}
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? 'Guardando...' : isEdit ? t.btn_update_contact : t.btn_register_contact}
        </button>
      </div>

    </form>
  );
}
