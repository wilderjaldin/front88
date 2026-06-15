'use client';
import React, { useState } from 'react';
import Select from 'react-select';
import IconSave from '@/components/icon/icon-save';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';

const URL_UPDATE_PART = 'cotizaciondetalle/actrepporcotizar';

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NotFoundPartForm = ({ close, nroParte, codRegistro, brands, onSaved, t }) => {
  const [brand,      setBrand]      = useState(null);
  const [otherBrand, setOtherBrand] = useState('');
  const [isOther,    setIsOther]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async () => {
    const nomMarca  = isOther ? ''                  : (brand?.label ?? '');
    const nomOtros  = isOther ? otherBrand.trim()   : '';

    if (!nomMarca && !nomOtros) {
      setError(t?.required_field ?? 'Campo requerido');
      return;
    }

    setSaving(true);
    try {
      await axiosClient.put(URL_UPDATE_PART, {
        CodRegistro: codRegistro,
        NomMarca:    nomMarca,
        NomOtros:    nomOtros,
      });
      Swal.fire({
        html: `<div style="padding:12px 0 6px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
          <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t?.part_updated ?? 'Datos actualizados'}</h2>
        </div>`,
        position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true,
      });
      onSaved?.();
    } catch {
      setError(t?.error ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleOther = () => {
    setIsOther(prev => !prev);
    setBrand(null);
    setOtherBrand('');
    setError('');
  };

  const labelClass = "text-sm font-medium text-gray-700";
  const hintClass  = "text-xs text-gray-400 mt-0.5";

  return (
    <div className="space-y-4">

      {/* Código / Nro. Parte */}
      <div className="space-y-1">
        <label className={labelClass}>{t?.part_number ?? 'Código/Nro. Parte'}</label>
        <input
          type="text"
          value={nroParte ?? ''}
          readOnly
          className="form-input h-9 text-sm w-full bg-gray-50 cursor-default"
        />
      </div>

      {/* Fabricante */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className={labelClass}>
            {t?.manufacturer_question ?? 'A que Fabricante corresponde el Código/Número de Parte que ingresó'}
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none ml-3 shrink-0">
            <input
              type="checkbox"
              checked={isOther}
              onChange={toggleOther}
              className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
            />
            <span className="text-xs text-gray-500">Otro</span>
          </label>
        </div>

        {!isOther && (
          <>
            <p className={hintClass}>Caterpillar, Komatsu, John Deere, Case, etc.</p>
            <Select
              options={brands}
              value={brand}
              onChange={val => { setBrand(val); setError(''); }}
              placeholder={t?.select_option ?? 'Selecciona una opción'}
              menuPosition="fixed"
              menuShouldScrollIntoView={false}
              classNamePrefix="react-select"
              filterOption={(option, inputValue) =>
                inputValue.length >= 2 &&
                option.label.toLowerCase().includes(inputValue.toLowerCase())
              }
              noOptionsMessage={({ inputValue }) =>
                inputValue.length < 2
                  ? (t?.type_to_search ?? 'Escribe al menos 2 caracteres')
                  : (t?.no_options ?? 'Sin opciones')
              }
            />
          </>
        )}

        {isOther && (
          <input
            type="text"
            value={otherBrand}
            onChange={e => { setOtherBrand(e.target.value); setError(''); }}
            autoComplete="off"
            placeholder={t?.enter_brand ?? 'Nombre del fabricante'}
            className={`form-input h-9 text-sm w-full ${error ? 'border-red-400' : ''}`}
          />
        )}

        {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={close}
          disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-150"
        >
          {t?.btn_cancel ?? 'Cancelar'}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-success inline-flex items-center gap-2 h-9"
        >
          {saving
            ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <IconSave className="h-4 w-4" />
          }
          {t?.btn_save ?? 'Guardar'}
        </button>
      </div>

    </div>
  );
};

export default NotFoundPartForm;
