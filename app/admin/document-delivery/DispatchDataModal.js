'use client';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import DatePicker from 'react-date-picker';
import IconSave from '@/components/icon/icon-save';
import axiosClient from '@/app/lib/axiosClient';
import { swalInfo } from '@/app/lib/swal';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

// Misma lista usada en register/carrier/form.
const CURRENCIES = ['DÓLARES', 'BOLIVIANOS', 'PESOS', 'SOLES', 'REALES', 'EUROS'].map(c => ({ value: c, label: c }));

// entregas/controles y entregas/adjuntar-items ya están confirmados (se usan también
// en /admin/dispatch). El endpoint de Guardar de este modal todavía no — se ajusta
// cuando se defina el contrato real.
const URL_CONTROLS     = 'entregas/controles';
const URL_ITEMS        = 'entregas/adjuntar-items';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    height: '38px',
    fontSize: '0.8rem',
    borderColor: state.isFocused ? '#4361ee' : 'var(--select-border, #e0e6ed)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(67,97,238,0.12)' : 'none',
    '&:hover': { borderColor: '#4361ee' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 10px' }),
  indicatorsContainer: (base) => ({ ...base, height: '38px' }),
  menu: (base) => ({ ...base, fontSize: '0.8rem', zIndex: 30 }),
};

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2 py-1.5";

const DispatchDataModal = ({ t, row, onClose, onSaved }) => {
  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { date: new Date() },
  });

  const [sellers, setSellers]       = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [addresses, setAddresses]   = useState([]);
  const [items, setItems]           = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    axiosClient.get(URL_CONTROLS, { params: { incluirDirecciones: true } }).then(rs => {
      const vendedores      = rs.data?.vendedores ?? [];
      const despachadores   = rs.data?.despachadores ?? [];
      const direcciones     = rs.data?.direccionesEntrega ?? [];
      setSellers(vendedores);
      setDeliverers(despachadores);
      setAddresses(direcciones);

      // Si solo hay una opción disponible, se preselecciona para no obligar
      // a elegir el único valor posible en cada Select.
      if (vendedores.length === 1) setValue('seller', vendedores[0]);
      if (despachadores.length === 1) setValue('delivered_by', despachadores[0]);
      if (direcciones.length === 1) setValue('delivery_address', direcciones[0]);
    }).catch(() => {});
  }, [setValue]);

  useEffect(() => {
    if (!row?.NumEmbalaje) return;
    setLoadingItems(true);
    axiosClient.post(URL_ITEMS, { cadNumEmbalaje: String(row.NumEmbalaje) })
      .then(rs => {
        const list = Array.isArray(rs.data) ? rs.data : [];
        setItems(list.map(i => ({
          NroOrden:    i.nroCotizacion,
          NroParte:    i.nroParte,
          Descripcion: i.desRepuesto,
          Cantidad:    i.cantidad,
          Origen:      i.origen,
        })));
      })
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [row?.NumEmbalaje]);

  const handleSave = () => {
    // Guardar sin confirmar todavía — se ajusta cuando se defina el contrato real.
    swalInfo(t.pending_backend_integration ?? 'Acción pendiente de definir con el backend.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <span className="font-semibold">{t.customer}:</span>{' '}
          <span>{row?.Cliente}</span>
        </div>
        <div>
          <span className="font-semibold">{t.nro_packaging}:</span>{' '}
          <span>{row?.NumEmbalaje}</span>
        </div>
      </div>

      <form className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3" onSubmit={handleSubmit(handleSave)}>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="delivered_by">{t.delivered_by} <span className="text-red-500">*</span></label>
          <Controller
            name="delivered_by"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                options={deliverers}
                id="delivered_by"
                instanceId="delivered_by"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectStyles}
                placeholder={t.select_option}
              />
            )}
          />
          {errors.delivered_by && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.delivered_by?.message?.toString()}</span>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="date">{t.date} <span className="text-red-500">*</span></label>
          <Controller
            control={control}
            name="date"
            rules={{ required: { value: true, message: t.required_field } }}
            render={({ field: { onChange, value } }) => (
              <DatePicker
                onChange={onChange}
                value={value}
                format="d/MM/y"
                locale="es-ES"
                className="form-input h-[38px] w-full"
              />
            )}
          />
          {errors.date && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.date?.message?.toString()}</span>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="seller">{t.seller} <span className="text-red-500">*</span></label>
          <Controller
            name="seller"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                options={sellers}
                id="seller"
                instanceId="seller"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectStyles}
                placeholder={t.select_option}
              />
            )}
          />
          {errors.seller && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.seller?.message?.toString()}</span>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="currency">{t.currency} <span className="text-red-500">*</span></label>
          <Controller
            name="currency"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                options={CURRENCIES}
                id="currency"
                instanceId="currency"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectStyles}
                placeholder={t.select_option}
              />
            )}
          />
          {errors.currency && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.currency?.message?.toString()}</span>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="delivery_address">{t.delivery_address} <span className="text-red-500">*</span></label>
          <Controller
            name="delivery_address"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                options={addresses}
                id="delivery_address"
                instanceId="delivery_address"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectStyles}
                placeholder={t.select_option}
              />
            )}
          />
          {errors.delivery_address && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.delivery_address?.message?.toString()}</span>}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="delivery_location">{t.delivery_place} <span className="text-red-500">*</span></label>
          <input
            type="text"
            autoComplete="off"
            {...register('delivery_location', { required: { value: true, message: t.required_field } })}
            className="form-input h-[38px] text-xs w-full"
          />
          {errors.delivery_location && <span className="text-red-400 text-xs mt-1 block" role="alert">{errors.delivery_location?.message?.toString()}</span>}
        </div>
      </form>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>{t.nro_order}</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.amount}</th>
                <th className={thClass}>Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loadingItems ? (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-gray-400">{t.loading}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : items.map((i, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdClass}>{i.NroOrden}</td>
                  <td className={tdClass}>{i.NroParte}</td>
                  <td className={tdClass}>{i.Descripcion}</td>
                  <td className={`${tdClass} text-center`}>{i.Cantidad}</td>
                  <td className={tdClass}>{i.Origen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-outline-dark h-9">
          {t.btn_cancel ?? 'Cancelar'}
        </button>
        <button
          type="button"
          disabled={items.length === 0 || saving}
          onClick={handleSubmit(handleSave)}
          className="btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {saving ? (t.saving ?? 'Guardando…') : (t.btn_save ?? 'Guardar')}
        </button>
      </div>
    </div>
  );
};

export default DispatchDataModal;
