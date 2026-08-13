'use client';
import React, { useEffect, useState } from 'react';

import { useForm } from "react-hook-form"
import axios from 'axios'
import axiosClient from '@/app/lib/axiosClient';
import Select from 'react-select';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import BtnPrintPacking from "@/app/admin/packaging/BtnPrintPacking"
import { swalSuccess, swalError } from '@/app/lib/swal';

const URL_CONTROLS = 'embalaje/controles';
// Contrato legacy (ValToken) sin confirmar todavía para modernizar.
const url_save = process.env.NEXT_PUBLIC_API_URL + 'embalaje/GuardarEmbalaje';

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2 py-1.5";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '34px',
    height: '34px',
    fontSize: '0.75rem',
    borderColor: state.isFocused ? '#4361ee' : 'var(--select-border, #e0e6ed)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(67,97,238,0.12)' : 'none',
    '&:hover': { borderColor: '#4361ee' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
  indicatorsContainer: (base) => ({ ...base, height: '34px' }),
  menu: (base) => ({ ...base, fontSize: '0.75rem', zIndex: 30 }),
};

const Packaging = ({ token, t, packages, onRefresh, setPackagings }) => {

  const [current_row, setCurrentRow] = useState(1);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const [typesPackaging, setTypesPackaging] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  const [lengthUnits, setLengthUnits] = useState([]);

  const {
    register,
    reset,
    setValue,
    getValues,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm();

  useEffect(() => { getControls(); }, []);

  const getControls = async () => {
    try {
      const rs = await axiosClient.get(URL_CONTROLS);
      setTypesPackaging(rs.data?.unidades ?? []);
      setWeightUnits(rs.data?.unidadesPeso ?? []);
      setLengthUnits(rs.data?.unidadesLongitud ?? []);
    } catch (error) {

    }
  }

  const handleChange = (value, r) => {
    setValue(`packaging.${r.id}.type_packaging`, (value?.value) ?? null);
    clearErrors(`packaging.${r.id}.type_packaging`)
  }

  const handleWeightUnitChange = (value, r) => {
    setValue(`packaging.${r.id}.weight_unit`, (value?.value) ?? null);
  }

  const handleDimensionUnitChange = (value, r) => {
    setValue(`packaging.${r.id}.dimension_unit`, (value?.value) ?? null);
  }

  useEffect(() => {
    rows.map(r => {
      setValue(`packaging.${r.id}.amount`, getValues(`packaging.${r.id}.amount`) || 1);
      setValue(`packaging.${r.id}.long`, getValues(`packaging.${r.id}.long`) || "0.0");
      setValue(`packaging.${r.id}.width`, getValues(`packaging.${r.id}.width`) || "0.0");
      setValue(`packaging.${r.id}.weight`, getValues(`packaging.${r.id}.weight`) || "0.0");
      setValue(`packaging.${r.id}.height`, getValues(`packaging.${r.id}.height`) || "0.0");
      setValue(`packaging.${r.id}.type_packaging`, getValues(`packaging.${r.id}.type_packaging`) || null);
      setValue(`packaging.${r.id}.weight_unit`, getValues(`packaging.${r.id}.weight_unit`) || weightUnits[0]?.value || null);
      setValue(`packaging.${r.id}.dimension_unit`, getValues(`packaging.${r.id}.dimension_unit`) || lengthUnits[0]?.value || null);
    });
  }, [rows, weightUnits, lengthUnits]);

  useEffect(() => {
    if (rows.length === 0) {
      setRows([{ id: current_row }]);
      setCurrentRow(current_row + 1);
    }
  }, []);

  const addRow = () => {
    setRows([...rows, { id: (current_row) }]);
    setCurrentRow(current_row + 1);
  }

  const removeRow = (id) => {
    setRows(rows.filter((r) => id != r.id));
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      let dimensions = [];
      let isEmpty = false;
      rows.map(r => {
        if (getValues(`packaging.${r.id}.type_packaging`) == null) {
          isEmpty = true;
          setError(`packaging.${r.id}.type_packaging`, { type: 'custom', message: t.required_field });
        }
        dimensions.push(
          {
            TipEmbalaje: getValues(`packaging.${r.id}.type_packaging`),
            Cantidad: getValues(`packaging.${r.id}.amount`),
            Peso: getValues(`packaging.${r.id}.weight`),
            UniPeso: getValues(`packaging.${r.id}.weight_unit`),
            Largo: getValues(`packaging.${r.id}.long`),
            Ancho: getValues(`packaging.${r.id}.width`),
            Alto: getValues(`packaging.${r.id}.height`),
            UniLongitud: getValues(`packaging.${r.id}.dimension_unit`),
          })
      });

      if (isEmpty) {
        swalError(t.error, t.packaging_type_is_not_selected, t.close);
        return;
      }

      if (dimensions.length == 0) {
        swalError(t.error, t.packaging_dimensions_empty, t.close);
        return;
      }

      const items = packages.map(p => ({ ...p, ValToken: token }));
      let data_send = { Dimensiones: dimensions, Items: items };

      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == 'Ok') {
        swalSuccess(t.packaging_successfully_saved);
        setPackagings([]);
        setRows([{ id: 1 }]);
        setCurrentRow(2);
        reset();
        await onRefresh?.();
      } else {
        swalError(t.error, t.packaging_error_saved, t.close);
      }
    } catch (error) {
      swalError(t.error, t.packaging_error_saved, t.close);
    }
    setSaving(false);
  }

  return (
    <div>
      {/* Dimensiones del embalaje */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mb-4">
        <div className="overflow-x-auto">
          <table className="table-fixed">
            <thead>
              <tr>
                <th className={`${thClass} w-[180px]`}>{t.packaging_type}</th>
                <th className={`${thClass} w-16`}>{t.amount}</th>
                <th className={`${thClass} w-20 pl-4 bg-slate-100 dark:bg-slate-700/50`}>{t.weight ?? 'Peso'}</th>
                <th className={`${thClass} w-24 pr-4 bg-slate-100 dark:bg-slate-700/50`}>{t.unit ?? 'Unidad'}</th>
                <th className={`${thClass} w-16 bg-slate-200/60 dark:bg-slate-600/30`}>{t.long}</th>
                <th className={`${thClass} w-16 bg-slate-200/60 dark:bg-slate-600/30`}>{t.width}</th>
                <th className={`${thClass} w-16 bg-slate-200/60 dark:bg-slate-600/30`}>{t.height}</th>
                <th className={`${thClass} w-24 bg-slate-200/60 dark:bg-slate-600/30`}>{t.unit ?? 'Unidad'}</th>
                <th className="w-7 !px-0 p-0 text-center bg-primary">
                  <button
                    onClick={addRow}
                    type="button"
                    title={t.add ?? 'Agregar'}
                    className="flex w-full items-center justify-center gap-1 py-1.5 text-white text-[11px] font-semibold hover:bg-white/10 transition"
                  >
                    <IconPlus className="h-3 w-3" /> { t.add }
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="py-6 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : rows.map((r, index) => (
                <tr key={r.id}>
                  <td className="p-1">
                    <Select
                      isSearchable={false}
                      instanceId={`type-packaging-select-${r.id}`}
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                      options={typesPackaging}
                      {...register(`packaging.${r.id}.type_packaging`)}
                      onChange={(event) => handleChange(event, r)}
                      styles={selectStyles}
                      placeholder={t.select_option}
                      className={errors.packaging?.[r.id]?.type_packaging ? 'ring-1 ring-red-400 rounded-lg' : ''}
                    />
                  </td>
                  <td className="p-1">
                    <input type="text" autoComplete="off" {...register(`packaging.${r.id}.amount`)} className="form-input h-[34px] text-xs w-full" />
                  </td>
                  <td className="p-1.5 pl-4 bg-slate-50 dark:bg-slate-800/40">
                    <input type="text" autoComplete="off" {...register(`packaging.${r.id}.weight`)} className="form-input h-[34px] text-xs w-full" />
                  </td>
                  <td className="p-1.5 pr-4 bg-slate-50 dark:bg-slate-800/40">
                    <Select
                      isSearchable={false}
                      instanceId={`weight-unit-select-${r.id}`}
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                      options={weightUnits}
                      {...register(`packaging.${r.id}.weight_unit`)}
                      onChange={(event) => handleWeightUnitChange(event, r)}
                      styles={selectStyles}
                      placeholder={t.select_option}
                    />
                  </td>
                  <td className="p-1.5 bg-slate-100/70 dark:bg-slate-700/25">
                    <input type="text" autoComplete="off" {...register(`packaging.${r.id}.long`)} className="form-input h-[34px] text-xs w-full" />
                  </td>
                  <td className="p-1.5 bg-slate-100/70 dark:bg-slate-700/25">
                    <input type="text" autoComplete="off" {...register(`packaging.${r.id}.width`)} className="form-input h-[34px] text-xs w-full" />
                  </td>
                  <td className="p-1.5 bg-slate-100/70 dark:bg-slate-700/25">
                    <input type="text" autoComplete="off" {...register(`packaging.${r.id}.height`)} className="form-input h-[34px] text-xs w-full" />
                  </td>
                  <td className="p-1.5 bg-slate-100/70 dark:bg-slate-700/25">
                    <Select
                      isSearchable={false}
                      instanceId={`dimension-unit-select-${r.id}`}
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                      options={lengthUnits}
                      {...register(`packaging.${r.id}.dimension_unit`)}
                      onChange={(event) => handleDimensionUnitChange(event, r)}
                      styles={selectStyles}
                      placeholder={t.select_option}
                    />
                  </td>
                  <td className="p-0.5 text-center">
                    {index > 0 && (
                      <button type="button" onClick={() => removeRow(r.id)} title={t.remove ?? 'Quitar'} className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition">
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones + items */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          disabled={packages.length === 0 || saving}
          onClick={handleSave}
          type="button"
          className="btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {saving ? (t.saving ?? 'Guardando...') : t.save_packaging}
        </button>
        <BtnPrintPacking
          disabled={packages.length === 0}
          packages={packages}
          t={t}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 text-sm font-semibold bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>{t.nro_order}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.qty}</th>
                <th className={thClass}>Origen</th>
                <th className={thClass}>{t.h_code}</th>
                <th className={thClass}>Material</th>
                <th className={thClass}>{t.presentation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {packages.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : packages.map((o, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdClass}>{o.NroOrden}</td>
                  <td className={tdClass}>{o.NomCliente}</td>
                  <td className={tdClass}>{o.NroParteCliente}</td>
                  <td className={tdClass}>{o.Descripcion}</td>
                  <td className={`${tdClass} text-center`}>{o.CantRecibida}</td>
                  <td className={tdClass}>{o.Origen}</td>
                  <td className={tdClass}>{o.HCode}</td>
                  <td className={tdClass}>{o.Material}</td>
                  <td className={tdClass}>{o.Presentacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Packaging;
