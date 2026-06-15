'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import axios from 'axios';
import IconBackSpace from '@/components/icon/icon-backspace';
import { customFormat } from '@/app/lib/format';

const url_validate = process.env.NEXT_PUBLIC_API_URL + 'referencia/ValidarReferencia';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const TableReference = ({ NroParte, t, items = [], token, options = [], close, quote_id = 0, brands = [] }) => {

  const [selected_items,   setSelectedItems]   = useState([]);
  const [selected_options, setSelectedOptions] = useState([]);
  const [filter,           setFilter]          = useState('');

  const { setValue, getValues, control } = useForm();

  const loadBrandOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(brands.filter(b => b.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [brands]);

  useEffect(() => {
    items.forEach(record => {
      const brand = brands.find(b => b.label === record.NomAplicacion) ?? null;
      if (brand) setValue(`orders.${record.CodRegistro}.application`, brand.value);
    });
  }, [items, brands, setValue]);

  const toggleAll = () =>
    setSelectedItems(selected_items.length === items.length ? [] : [...items]);

  const toggleRow = (row) =>
    setSelectedItems(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const toggleAllOptions = () =>
    setSelectedOptions(selected_options.length === options.length ? [] : [...options]);

  const toggleRowOption = (row) =>
    setSelectedOptions(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const validateItem = async () => {
    try {
      const data_send = [];

      selected_items.forEach(item => {
        const val    = getValues(`orders.${item.CodRegistro}.application`);
        const select = brands.find(b => b.value == val);
        data_send.push({ NroOrden: quote_id, NroParte: item.NroParte, NomMarca: select?.label ?? '', ValToken: token });
      });

      selected_options.forEach(item => {
        data_send.push({ NroOrden: quote_id, NroParte: item.NroParte, NomMarca: item.NomMarca, ValToken: token });
      });

      const rs = await axios.post(url_validate, data_send);
      if (rs.data.estado == 'OK') {
        close();
      }
    } catch {}
  };

  const filtered = items.filter(item =>
    item.NroParte?.toUpperCase().includes(filter.toUpperCase()) ||
    item.NomAplicacion?.toUpperCase().includes(filter.toUpperCase())
  );

  const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-left whitespace-nowrap";
  const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

  return (
    <div className="space-y-5">

      {/* ── FILTRO ────────────────────────────────────────────────────────── */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t.filter ?? 'Filtrar'}
          className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-900 px-3 pr-9 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {filter && (
          <button
            type="button"
            onClick={() => setFilter('')}
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
          >
            <IconBackSpace className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── TABLA REFERENCIAS ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.reference_part_change ?? 'Referencias cruzadas'}
          </p>
          <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <Checkbox
                    size="xs"
                    checked={selected_items.length === filtered.length && filtered.length > 0}
                    indeterminate={selected_items.length > 0 && selected_items.length < filtered.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                <th className={thClass}>{t.application ?? 'Aplicación'}</th>
                <th className={thClass}>{t.d_register ?? 'Fec. Registro'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((item, index) => (
                <tr key={index} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className={tdClass}>
                    <Checkbox
                      size="xs"
                      checked={selected_items.includes(item)}
                      onChange={() => toggleRow(item)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>{item.NroParte}</td>
                  <td className={tdClass}>
                    <Controller
                      name={`orders.${item.CodRegistro}.application`}
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
                              : (t.no_results ?? 'Sin resultados')
                          }
                          value={brands.find(o => o.value === field.value) || null}
                          onChange={opt => field.onChange(opt?.value ?? null)}
                          styles={{
                            control: (base) => ({ ...base, minHeight: '32px', height: '32px', minWidth: '160px', fontSize: '12px' }),
                            valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                            indicatorsContainer: (base) => ({ ...base, height: '32px' }),
                          }}
                        />
                      )}
                    />
                  </td>
                  <td className={`${tdClass} text-gray-400 whitespace-nowrap`}>{item.FecRegistra}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-400">{t.no_results ?? 'Sin resultados'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLA OPCIONES ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.options_for_nro_part ?? 'Opciones para el Nro. Parte'}{' '}
            <span className="font-bold text-primary">[{NroParte}]</span>
          </p>
          <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <Checkbox
                    size="xs"
                    checked={selected_options.length === options.length && options.length > 0}
                    indeterminate={selected_options.length > 0 && selected_options.length < options.length}
                    onChange={toggleAllOptions}
                  />
                </th>
                <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                <th className={thClass}>{t.description ?? 'Descripción'}</th>
                <th className={thClass}>{t.supplier ?? 'Proveedor'}</th>
                <th className={thClass}>{t.brand ?? 'Marca'}</th>
                <th className={`${thClass} text-right`}>{t.weight ?? 'Peso'}</th>
                <th className={`${thClass} text-right`}>{t.cost ?? 'Costo'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {options.map((o, index) => (
                <tr key={index} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className={tdClass}>
                    <Checkbox
                      size="xs"
                      checked={selected_options.includes(o)}
                      onChange={() => toggleRowOption(o)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>{o.NroParte}</td>
                  <td className={tdClass}>{o.DesRepuesto}</td>
                  <td className={tdClass}>{o.NomPrv}</td>
                  <td className={tdClass}>{o.NomMarca}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{customFormat(o.Peso)}</td>
                  <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(o.Costo)}</td>
                </tr>
              ))}
              {options.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-gray-400">{t.no_results ?? 'Sin resultados'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ACCIONES ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={close}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4
            text-sm text-gray-600 hover:bg-gray-50 transition
            dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t.btn_close ?? 'Cerrar'}
        </button>
        <button
          type="button"
          disabled={selected_items.length === 0 && selected_options.length === 0}
          onClick={validateItem}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-success px-5
            text-white text-sm font-medium shadow-sm hover:bg-success/90 transition
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.validate ?? 'Validar'}
        </button>
      </div>

    </div>
  );
};

export default TableReference;
