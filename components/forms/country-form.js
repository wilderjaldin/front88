'use client';
// components/forms/country-form.js
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';

// ── Endpoints ──────────────────────────────────────────────────────────────────
const URL_PAISES_MUNDO = '/clientes/paises-mundo';
const URL_ADD_PAIS     = '/paises/add';

// ── Props ──────────────────────────────────────────────────────────────────────
// existingCountries → [{ value, label }] países ya registrados (validación local)
// onCancel          → cierra el modal sin guardar
// onSaved           → ({ newCountry, paisesMundo }) callback tras guardar
//                     newCountry   = { value, label } del país recién agregado
//                     paisesMundo  = lista mundial actualizada que devuelve la API
const CountryForm = ({ existingCountries = [], onCancel, onSaved }) => {
  const t = useTranslation();

  const [worldCountries, setWorldCountries] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selected,       setSelected]       = useState(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  // ── Cargar lista mundial de países ────────────────────────────────────────
  useEffect(() => {
    axiosClient.get(URL_PAISES_MUNDO)
      .then(res => setWorldCountries(res.data ?? []))
      .catch(() => setWorldCountries([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');

    if (!selected) {
      setError(t.required_select);
      return;
    }

    // Validación local (evita round-trip innecesario si el padre ya tiene el país)
    const alreadyExists = existingCountries.some(
      c => c.value?.toUpperCase() === selected.value?.toUpperCase()
    );
    if (alreadyExists) {
      setError(t.country_error_exist);
      return;
    }

    setSubmitting(true);
    try {
      // Controller espera: { CodPais, NomPais }
      // Responde 200: { message, ciudadesImportadas, paisesMundo }
      // Responde 400: { message } — duplicado u otro error de negocio
      const res = await axiosClient.post(URL_ADD_PAIS, {
        codPais: selected.value,
        nomPais: selected.label,
      });

      const { ciudadesImportadas, paises } = res.data;

      // Mensaje dinámico según ciudades importadas
      const detalleCiudades = ciudadesImportadas > 0
        ? `Se importaron <strong>${ciudadesImportadas}</strong> ciudad${ciudadesImportadas !== 1 ? 'es' : ''} automáticamente.`
        : 'No se encontraron ciudades para importar.';

      Swal.fire({
        title: t.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        html: `<p>${t.country_success_save}</p><p class="text-sm text-gray-500 mt-1">${detalleCiudades}</p>`,
        confirmButtonText: t.close,
      }).then(() => {
        // `paises` = lista actualizada de países permitidos del usuario (mismo formato
        // que el select principal). El padre la usa para refrescar su estado directamente.
        onSaved?.({
          newCountry: { value: selected.value.toUpperCase(), label: selected.label },
          paises:     paises ?? [],
        });
      });

    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message ?? err?.response?.data?.mensaje;

      if (status === 400 && msg) {
        // Error de negocio del backend (duplicado, validación) → mostrar inline
        setError(msg);
      } else {
        Swal.fire({
          title: t.error,
          text: t.country_error_server,
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

      {/* ── Selector de país ───────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.select_country}
          <span className="text-red-500 ml-0.5">*</span>
        </label>

        <Select
          options={worldCountries}
          value={selected}
          onChange={(val) => {
            setSelected(val);
            setError('');
          }}
          isLoading={loading}
          isClearable
          isSearchable
          menuPosition="fixed"
          menuShouldScrollIntoView={false}
          placeholder={loading ? 'Cargando países...' : t.select_option}
          instanceId="country-form-select"
          classNamePrefix="select"
          className={error ? 'react-select-error' : ''}
          noOptionsMessage={() => 'Sin resultados'}
          loadingMessage={() => 'Cargando...'}
        />

        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>

      {/* ── Preview del país seleccionado ──────────────────────────────── */}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm text-green-800 dark:text-green-300 font-medium">
            {selected.label}
          </span>
          <span className="text-xs text-green-600 dark:text-green-500 font-mono ml-auto">
            {selected.value}
          </span>
        </div>
      )}

      {/* ── Aviso informativo ──────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        Al agregar un país se importarán automáticamente sus ciudades.
      </p>

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
          disabled={submitting || loading}
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

export default CountryForm;