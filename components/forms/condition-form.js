'use client';
// components/forms/condition-form.js
import React, { useState } from 'react';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';

// ── Endpoint ───────────────────────────────────────────────────────────────────
const URL_ADD_CONDICION = '/clientes/condiciones/add';

// ── Props ──────────────────────────────────────────────────────────────────────
// onCancel   → cierra el modal sin guardar
// onSaved    → ({ newCondicion, condicionOptions }) callback tras guardar
//              newCondicion    = { value, label } de la condición recién creada
//              condicionOptions = lista actualizada [{ value, label }]
const ConditionForm = ({ onCancel, onSaved }) => {
  const t = useTranslation();

  const [desCondicion, setDesCondicion] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');

    const nombre = desCondicion.trim().toUpperCase();

    if (!nombre) {
      setError(t.required_field);
      return;
    }

    setSubmitting(true);
    try {
      // Espera:   { desCondicion }
      // Responde 200: { condicion: { value, label }, condicionOptions: [...] }
      // Responde 400: { message } — duplicado u error de negocio
      const res = await axiosClient.post(URL_ADD_CONDICION, {
        desCondicion: nombre,
      });

      const { condicion, condicionOptions } = res.data;

      Swal.fire({
        title: t.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        text: t.terms_of_payment_save,
        confirmButtonText: t.close,
      }).then(() => {
        onSaved?.({
          newCondicion:    condicion,
          condicionOptions: condicionOptions ?? [],
        });
      });

    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message ?? err?.response?.data?.mensaje;

      if (status === 400 && msg) {
        setError(msg);
      } else {
        Swal.fire({
          title: t.error,
          text: t.terms_of_payment_save_error_server,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Nombre de la condición ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.terms_of_payment}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          value={desCondicion}
          onChange={e => {
            setDesCondicion(e.target.value.toUpperCase());
            setError('');
          }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Ej: CRÉDITO A 30 DÍAS"
          className={`form-input w-full ${error ? 'error' : ''}`}
        />
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>

      {/* ── Preview ────────────────────────────────────────────────────── */}
      {desCondicion.trim() && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-green-50 dark:bg-green-900/20
                        border border-green-200 dark:border-green-800">
          <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm text-green-800 dark:text-green-300 font-medium">
            {desCondicion.trim()}
          </span>
        </div>
      )}

      {/* ── Botones ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.btn_cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Guardando...
            </span>
          ) : t.btn_add}
        </button>
      </div>
    </div>
  );
};

export default ConditionForm;