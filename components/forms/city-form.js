'use client';
// components/forms/city-form.js
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';

// ── Endpoint ───────────────────────────────────────────────────────────────────
const URL_ADD_CIUDAD = '/ciudades/add';

// ── Props ──────────────────────────────────────────────────────────────────────
// pais      → { value: 'AT', label: 'AUSTRIA' } — país ya seleccionado en el form padre
// onCancel  → cierra el modal sin guardar
// onSaved   → ({ newCity, ciudades }) callback tras guardar
//             newCity  = { value, label } de la ciudad recién agregada
//             ciudades = lista actualizada de ciudades del país
const CityForm = ({ pais = null, onCancel, onSaved }) => {
  const t = useTranslation();

  const [nomCiudad,  setNomCiudad]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');

    const nombre = nomCiudad.trim();

    if (!nombre) {
      setError(t.required_field);
      return;
    }

    if (!pais?.value) {
      setError('No hay un país seleccionado.');
      return;
    }

    setSubmitting(true);
    try {
      // Espera: { codPais, nomCiudad }
      // Responde 200: { message, ciudades }   → lista actualizada del país
      // Responde 400: { message }             → duplicado u otro error de negocio
      const res = await axiosClient.post(URL_ADD_CIUDAD, {
        codPais:   pais.value,
        nomCiudad: nombre.toUpperCase(),
      });

      // Controller retorna: { ciudad: { codCiudad, nomCiudad }, ciudades }
      // ciudades = lista actualizada [{ value, label }] del país
      const { ciudad, ciudades } = res.data;

      Swal.fire({
        title: t.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        text: t.city_success_save,
        confirmButtonText: t.close,
      }).then(() => {
        onSaved?.({
          // value = codCiudad generado por el backend, label = nomCiudad normalizado
          newCity:  { value: ciudad.codCiudad, label: ciudad.nomCiudad },
          ciudades: ciudades ?? [],
        });
      });

    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message ?? err?.response?.data?.mensaje;

      if (status === 400 && msg) {
        // Error de negocio (duplicado, validación) → mostrar inline
        setError(msg);
      } else {
        Swal.fire({
          title: t.error,
          text: t.city_error_server,
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

      {/* ── País fijo (solo informativo, no editable) ──────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.country}
        </label>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-gray-50 dark:bg-gray-800
                        border border-gray-200 dark:border-gray-700">
          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {pais?.label ?? '—'}
          </span>
          <span className="text-xs text-gray-400 font-mono ml-auto">
            {pais?.value ?? ''}
          </span>
        </div>
      </div>

      {/* ── Nombre de la ciudad ────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.city_name}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          value={nomCiudad}
          onChange={e => { setNomCiudad(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={t.enter_city_name}
          className={`form-input w-full ${error ? 'error' : ''}`}
        />
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>

      {/* ── Preview ────────────────────────────────────────────────────── */}
      {nomCiudad.trim() && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-green-50 dark:bg-green-900/20
                        border border-green-200 dark:border-green-800">
          <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm text-green-800 dark:text-green-300 font-medium">
            {nomCiudad.trim().toUpperCase()}
          </span>
          <span className="text-xs text-green-600 dark:text-green-500 ml-auto">
            {pais?.label}
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

export default CityForm;