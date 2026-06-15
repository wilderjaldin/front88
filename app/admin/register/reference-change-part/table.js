'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox } from '@mantine/core';
import { useForm, Controller } from "react-hook-form";
import AsyncSelect from 'react-select/async';
import IconSave from '@/components/icon/icon-save';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import { customFormat } from '@/app/lib/format';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const TableItems = ({
  NroParte = "",
  quote_id = 0,
  t,
  items,
  options = [],
  token,
  brands,
  updateItem,
  updateAllItems,
  deleteItem,
  validateItem,
}) => {

  const [selected_items,   setSelectedItems]   = useState([]);
  const [selected_options, setSelectedOptions] = useState([]);

  const dirtyRows   = useRef(new Set());
  const [, redraw]  = useState(0);

  const markDirty = (codRegistro) => {
    if (!dirtyRows.current.has(codRegistro)) {
      dirtyRows.current.add(codRegistro);
      redraw(n => n + 1);
    }
  };

  const clearDirty = (codRegistro) => {
    dirtyRows.current.delete(codRegistro);
    redraw(n => n + 1);
  };

  const { register, setValue, getValues, control } = useForm();

  const loadBrandOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(
      brands.filter(b => b.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX)
    );
  }, [brands]);

  useEffect(() => {
    items.forEach(record => {
      setValue(`orders.${record.codRegistro}.nro_part`,      record.nroParte);
      setValue(`orders.${record.codRegistro}.change`,        record.blnCambio         === true);
      setValue(`orders.${record.codRegistro}.reference`,     record.blnReferencia     === true);
      setValue(`orders.${record.codRegistro}.recent_change`, record.blnCambioMasReciente === true);

      const brandValue = brands.find(b => b.label === record.aplicacion)?.value ?? null;
      setValue(`orders.${record.codRegistro}.application`, brandValue);
    });
  }, [items]);

  const toggleAll = () => {
    setSelectedItems(selected_items.length === items.length ? [] : [...items]);
  };

  const toggleRow = (row) => {
    setSelectedItems(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);
  };

  const toggleAllOptions = () => {
    setSelectedOptions(selected_options.length === options.length ? [] : [...options]);
  };

  const toggleRowOption = (row) => {
    setSelectedOptions(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);
  };

  const handleUpdate = (record) => {
    updateItem(buildRowPayload(record.codRegistro), () => clearDirty(record.codRegistro));
  };

  const buildRowPayload = (codRegistro) => ({
    codRegistro,
    nroParte:            getValues(`orders.${codRegistro}.nro_part`),
    codMarca:            getValues(`orders.${codRegistro}.application`),
    blnCambio:           !!getValues(`orders.${codRegistro}.change`),
    blnReferencia:       !!getValues(`orders.${codRegistro}.reference`),
    blnCambioMasReciente: !!getValues(`orders.${codRegistro}.recent_change`),
  });

  const handleUpdateAll = () => {
    const registros = [...dirtyRows.current].map(buildRowPayload);
    updateAllItems(registros, () => {
      dirtyRows.current.clear();
      redraw(n => n + 1);
    });
  };

  const handleValidate = async () => {
    const data_send = [];

    selected_items.forEach(item => {
      const val    = getValues(`orders.${item.codRegistro}.application`);
      const select = brands.find(b => b.value == val);
      data_send.push({ NroOrden: quote_id, NroParte: item.nroParte, NomMarca: select?.label ?? "", ValToken: token });
    });

    selected_options.forEach(item => {
      data_send.push({ NroOrden: quote_id, NroParte: item.nroParte, NomMarca: item.marca, ValToken: token });
    });

    await validateItem(data_send);
    setSelectedItems([]);
    setSelectedOptions([]);
  };

  const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
  const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

  return (
    <div className="mt-8 space-y-6">

      {/* ── TABLA REFERENCIAS ───────────────────────────────────────────── */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Referencias cruzadas
            </p>
            <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
          </div>
          {dirtyRows.current.size >= 2 && (
            <button
              onClick={handleUpdateAll}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-green-600 px-3
                text-white text-xs font-medium shadow-sm hover:bg-green-700 transition"
            >
              <IconSave className="w-3.5 h-3.5" />
              Actualizar todo ({dirtyRows.current.size})
            </button>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-72">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={thClass}></th>
                <th className={thClass}>Code Dax</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.application}</th>
                <th className={`${thClass} text-center`}>{t.change}</th>
                <th className={`${thClass} text-center`}>{t.reference}</th>
                <th className={`${thClass} text-center`}>{t.most_recent_change ?? 'Más reciente'}</th>
                <th className={thClass}>{t.d_register}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={`transition ${
                    dirtyRows.current.has(item.codRegistro)
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100/60 dark:hover:bg-green-900/30'
                      : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <td className={tdClass}>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        size="xs"
                        checked={selected_items.includes(item)}
                        onChange={() => toggleRow(item)}
                      />
                      <button
                        disabled={!dirtyRows.current.has(item.codRegistro)}
                        className="p-1.5 rounded-lg transition
                          disabled:cursor-not-allowed
                          enabled:hover:bg-green-100 enabled:dark:hover:bg-green-900/40"
                        onClick={() => handleUpdate(item)}
                        title={t.btn_save}
                      >
                        <IconSave className={`w-3.5 h-3.5 transition-colors ${
                          dirtyRows.current.has(item.codRegistro)
                            ? 'text-green-600'
                            : 'text-gray-300 dark:text-gray-600'
                        }`} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        onClick={() => deleteItem({ CodRegistro: item.codRegistro })}
                        title={t.delete}
                      >
                        <IconTrashLines className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                  <td className={`${tdClass} font-mono`}>{item.codDax}</td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`orders.${item.codRegistro}.nro_part`, {
                        onChange: () => markDirty(item.codRegistro),
                      })}
                      className="h-8 w-44 rounded border border-gray-200 dark:border-gray-600
                        bg-white dark:bg-gray-900 px-2 text-xs
                        focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className={tdClass}>
                    <Controller
                      name={`orders.${item.codRegistro}.application`}
                      control={control}
                      render={({ field }) => (
                        <AsyncSelect
                          loadOptions={loadBrandOptions}
                          defaultOptions={false}
                          cacheOptions
                          isClearable
                          placeholder="—"
                          menuPosition="fixed"
                          menuShouldScrollIntoView={false}
                          noOptionsMessage={({ inputValue }) =>
                            (inputValue?.trim().length ?? 0) < ASYNC_MIN
                              ? `Ingresa ${ASYNC_MIN} caracteres`
                              : 'Sin resultados'
                          }
                          value={brands.find(o => o.value === field.value) || null}
                          onChange={opt => { field.onChange(opt?.value ?? null); markDirty(item.codRegistro); }}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '32px',
                              height: '32px',
                              minWidth: '150px',
                              fontSize: '12px',
                            }),
                            valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                            indicatorsContainer: (base) => ({ ...base, height: '32px' }),
                          }}
                        />
                      )}
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      {...register(`orders.${item.codRegistro}.change`, {
                        onChange: (e) => {
                          if (e.target.checked) setValue(`orders.${item.codRegistro}.reference`, false);
                          markDirty(item.codRegistro);
                        },
                      })}
                      className="form-checkbox"
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      {...register(`orders.${item.codRegistro}.reference`, {
                        onChange: (e) => {
                          if (e.target.checked) setValue(`orders.${item.codRegistro}.change`, false);
                          markDirty(item.codRegistro);
                        },
                      })}
                      className="form-checkbox"
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      {...register(`orders.${item.codRegistro}.recent_change`, {
                        onChange: () => markDirty(item.codRegistro),
                      })}
                      className="form-checkbox"
                    />
                  </td>
                  <td className={`${tdClass} text-gray-400 whitespace-nowrap`}>
                    {item.fecRegistra ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── VALIDAR ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <button
          disabled={selected_items.length === 0 && selected_options.length === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-success px-6
            text-white text-sm font-medium shadow-sm hover:bg-success/90 transition
            disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleValidate}
        >
          {t.validate}
        </button>
      </div>

      {/* ── TABLA REPUESTOS ─────────────────────────────────────────────── */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.options_for_nro_part ?? 'Repuestos'}{' '}
            <span className="font-bold text-primary">[{NroParte}]</span>
          </p>
          <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thClass}></th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.description}</th>
                <th className={thClass}>{t.supplier}</th>
                <th className={thClass}>{t.brand}</th>
                <th className={`${thClass} text-right`}>{t.weight}</th>
                <th className={`${thClass} text-right`}>{t.cost}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {options.map((o, index) => (
                <tr
                  key={index}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className={tdClass}>
                    <Checkbox
                      size="xs"
                      checked={selected_options.includes(o)}
                      onChange={() => toggleRowOption(o)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>{o.nroParte}</td>
                  <td className={tdClass}>{o.descripcion}</td>
                  <td className={tdClass}>{o.proveedor}</td>
                  <td className={tdClass}>{o.marca}</td>
                  <td className={`${tdClass} text-right`}>{customFormat(o.peso)}</td>
                  <td className={`${tdClass} text-right font-medium`}>{customFormat(o.costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default TableItems;
