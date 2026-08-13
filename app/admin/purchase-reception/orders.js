'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import Select from 'react-select';
import SearchFilter from '@/components/SearchFilter';
import IconArrowDown from '@/components/icon/icon-arrow-down';
import IconSave from '@/components/icon/icon-save';
import Modal from '@/components/modal';
import MailToSupplierForm from '@/app/admin/purchase-reception/mail-to-supplier-form';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'

const URL_CANCEL_ORDER = 'recepcion/anular-orden-compra';
const URL_UPDATE_STATUS = 'recepcion/actualizar-status';
const URL_SAVE_ITEMS = 'recepcion/actualizar-datos';

const PAGE_SIZE = 20;

const thClass = "text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-left select-none";
const tdClass = "text-[11px] text-gray-700 dark:text-gray-300 px-2 py-1";
const inputRowClass = "h-6 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/30";

const EMPTY_ADV_FILTERS = { proveedores: [], paises: [], status: [], ordenes: [], oc: [], r1: false, r2: false, r3: false };

// Mismo mapeo que getList() en page.js — la respuesta de anular-orden-compra trae el
// mismo arreglo (shape) que GET recepcion/listar.
const mapOrder = (o, index) => ({
  id:              index,
  NumOrdenCompra:  o.numOrdenCompra,
  NroOrden:        o.nroOrden,
  NomPrv:          o.proveedor,
  Dias:            o.intDias,
  NumTracking:     o.numTracking,
  Nota:            o.nota,
  CodPaisCliente:  o.codPaisCliente,
  NomPais:         o.nomPais,
  NomStatus:       o.nomStatus,
  CodPrv:          o.codPrv,
  Recepcion1:      o.recepcion1 ?? false,
  Recepcion2:      o.recepcion2 ?? false,
  Recepcion3:      o.recepcion3 ?? false,
  TieneNota:       o.tieneNota ?? false,
});

// Estados fijos del negocio (no vienen de un catálogo del backend).
const STATUS_OPTIONS = [
  { value: '', label: '---' },
  { value: 'EN CAMINO – COMPLETO', label: 'EN CAMINO – COMPLETO' },
  { value: 'EN CAMINO - PARCIAL',  label: 'EN CAMINO - PARCIAL' },
  { value: 'LISTO P.U.-COMPLETO',  label: 'LISTO P.U.-COMPLETO' },
  { value: 'LISTO P.U.- PARCIAL',  label: 'LISTO P.U.- PARCIAL' },
];

const FilterChecklist = ({ title, options, selected, onToggle }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col min-w-[120px] flex-1">
    <div className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {title}
    </div>
    <div className="overflow-y-auto max-h-52 divide-y divide-gray-100 dark:divide-gray-700">
      {options.length === 0 ? (
        <div className="px-1.5 py-2 text-[11px] text-gray-400 text-center">—</div>
      ) : options.map(opt => (
        <label key={opt.value} className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] leading-tight text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-3 w-3 shrink-0"
            checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  </div>
);

const Orders = ({ t, data, setOrders, attachOrder, loading, onRefresh, onSearch, onClear }) => {

  const [selected_orders, setSelectedOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advFilters, setAdvFilters] = useState(EMPTY_ADV_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_ADV_FILTERS);

  const [showMailModal, setShowMailModal] = useState(false);

  const [statusOption, setStatusOption] = useState(null);
  const [applyingStatus, setApplyingStatus] = useState(false);

  const {
    register,
    getValues,
    setValue,
  } = useForm()

  useEffect(() => {
    data.map(o => {
      setValue(`orders.${o.NumOrdenCompra}.tracking`, o.NumTracking);
      setValue(`orders.${o.NumOrdenCompra}.note`, o.Nota);
      setValue(`orders.${o.NumOrdenCompra}.checked1`, o.Recepcion1);
      setValue(`orders.${o.NumOrdenCompra}.checked2`, o.Recepcion2);
      setValue(`orders.${o.NumOrdenCompra}.checked3`, o.Recepcion3);
    })
  }, [data]);

  useEffect(() => { setSelectedOrders([]); setPage(1); }, [data]);

  // Catálogos del filtro avanzado: se extraen del listado completo (ya no hay endpoint "controles").
  const catalogs = useMemo(() => {
    const proveedoresMap = new Map();
    const paisesMap = new Map();
    const ordenesSet = new Set();
    const ocSet = new Set();
    const statusInList = new Set();

    data.forEach(o => {
      if (o.CodPrv != null) proveedoresMap.set(String(o.CodPrv), o.NomPrv || String(o.CodPrv));
      if (o.CodPaisCliente) paisesMap.set(o.CodPaisCliente, o.NomPais || o.CodPaisCliente);
      if (o.NroOrden != null) ordenesSet.add(String(o.NroOrden));
      if (o.NumOrdenCompra != null) ocSet.add(String(o.NumOrdenCompra));
      if (o.NomStatus) statusInList.add(o.NomStatus);
    });

    const toOptionList = (map) => [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
    const toValueOptionList = (set) => [...set].map(v => ({ value: v, label: v })).sort((a, b) => Number(b.value) - Number(a.value));

    return {
      proveedores: toOptionList(proveedoresMap),
      paises:      toOptionList(paisesMap),
      ordenes:     toValueOptionList(ordenesSet),
      oc:          toValueOptionList(ocSet),
      // Solo los estados fijos que efectivamente aparecen en el listado actual.
      status: STATUS_OPTIONS.filter(opt => statusInList.has(opt.value)),
    };
  }, [data]);

  const advFiltersActive =
    advFilters.proveedores.length + advFilters.paises.length + advFilters.status.length + advFilters.ordenes.length + advFilters.oc.length +
    (advFilters.r1 ? 1 : 0) + (advFilters.r2 ? 1 : 0) + (advFilters.r3 ? 1 : 0);

  const filteredData = useMemo(() => {
    let list = data;

    if (advFilters.proveedores.length > 0) list = list.filter(o => advFilters.proveedores.includes(String(o.CodPrv)));
    if (advFilters.paises.length > 0) list = list.filter(o => advFilters.paises.includes(o.CodPaisCliente));
    if (advFilters.status.length > 0) list = list.filter(o => advFilters.status.includes(o.NomStatus));
    if (advFilters.ordenes.length > 0) list = list.filter(o => advFilters.ordenes.includes(String(o.NroOrden)));
    if (advFilters.oc.length > 0) list = list.filter(o => advFilters.oc.includes(String(o.NumOrdenCompra)));
    if (advFilters.r1) list = list.filter(o => o.Recepcion1);
    if (advFilters.r2) list = list.filter(o => o.Recepcion2);
    if (advFilters.r3) list = list.filter(o => o.Recepcion3);

    return list;
  }, [data, advFilters]);

  useEffect(() => { setPage(1); }, [data, advFilters]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData    = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelectedOrders(selected_orders.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelectedOrders(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);
  const ensureSelected = (row) =>
    setSelectedOrders(prev => prev.includes(row) ? prev : [...prev, row]);

  const handleUppercaseChange = (event, row, field) => {
    const upper = event.target.value.toUpperCase();
    event.target.value = upper;
    setValue(`orders.${row.NumOrdenCompra}.${field}`, upper);
    ensureSelected(row);
  };

  const handleAttachOrder = async () => {
    setSubmitting(true);
    await attachOrder(selected_orders);
    setSubmitting(false);
  };

  const handleSaveChanges = async () => {

    const items = selected_orders.map(o => ({
      numOrdenCompra: o.NumOrdenCompra,
      numTracking: getValues(`orders.${o.NumOrdenCompra}.tracking`),
      nota: getValues(`orders.${o.NumOrdenCompra}.note`),
      recepcion1: getValues(`orders.${o.NumOrdenCompra}.checked1`) == 1,
      recepcion2: getValues(`orders.${o.NumOrdenCompra}.checked2`) == 1,
      recepcion3: getValues(`orders.${o.NumOrdenCompra}.checked3`) == 1,
    }));

    setSavingChanges(true);
    try {
      await axiosClient.put(URL_SAVE_ITEMS, { items });
      swalSuccess(t.save_data_success);
      onRefresh?.();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_data_error, t.close);
    }
    setSavingChanges(false);
  }

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: t.question_the_purchase_order_cancel,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.close,
      reverseButtons: true
    });
    if (!result.isConfirmed) return;

    try {
      const rs = await axiosClient.post(URL_CANCEL_ORDER, {
        numOrdenCompra: selected_orders.map(o => o.NumOrdenCompra),
      });
      setSelectedOrders([]);
      setOrders((rs.data ?? []).map(mapOrder));
      swalSuccess(t.the_purchase_order_was_cancel);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_data_error, t.close);
    }
  }

  const handleChecked = (event, record, n) => {
    ensureSelected(record);
    setValue(`orders.${record.NumOrdenCompra}.checked${n}`, ((event.target.checked) ? 1 : 0));
  }

  const handleChangeStatus = async () => {
    if (selected_orders.length === 0 || !statusOption) return;

    setApplyingStatus(true);
    try {
      await axiosClient.put(URL_UPDATE_STATUS, {
        numOrdenCompra: selected_orders.map(o => o.NumOrdenCompra),
        nomStatus: statusOption.value,
      });
      swalSuccess(t.save_data_success);
      setStatusOption(null);
      setSelectedOrders([]);
      onRefresh?.();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_data_error, t.close);
    } finally {
      setApplyingStatus(false);
    }
  }

  const openFilterModal = () => {
    setDraftFilters(advFilters);
    setShowFilterModal(true);
  };

  const openMailModal = () => {
    if (selected_orders.length === 0) return;
    const distinctSuppliers = [...new Set(selected_orders.map(o => o.CodPrv))];
    if (distinctSuppliers.length > 1) {
      swalError(t.error, t.different_providers_error, t.close);
      return;
    }
    setShowMailModal(true);
  };

  const toggleDraft = (key, value) => {
    setDraftFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }));
  };

  const applyAdvancedFilters = () => {
    setAdvFilters(draftFilters);
    setShowFilterModal(false);
  };

  const clearAdvancedFilters = () => {
    setDraftFilters(EMPTY_ADV_FILTERS);
    setAdvFilters(EMPTY_ADV_FILTERS);
    setShowFilterModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.purchase_orders}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro server-side */}
        <SearchFilter t={t} onSearch={onSearch} onClear={onClear} />
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={handleAttachOrder}
          disabled={selected_orders.length === 0 || submitting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.attach_order}
          <IconArrowDown className="w-3.5 h-3.5 rotate-90" />
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleCancelOrder}
          disabled={selected_orders.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-35 disabled:cursor-not-allowed transition dark:bg-red-900/20 dark:text-red-400"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {t.cancel_purchase_order}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={openFilterModal}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/>
          </svg>
          {t.advanced_filter}
          {advFiltersActive > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
              {advFiltersActive}
            </span>
          )}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={openMailModal}
          disabled={selected_orders.length === 0}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${
            selected_orders.length === 0
              ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
              : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path strokeLinecap="round" d="M2 7l10 7 10-7"/></svg>
          {t.mail_supplier_title}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <div className="flex items-center gap-1.5">
          <Select
            classNamePrefix="rs"
            placeholder={t.status}
            options={STATUS_OPTIONS}
            value={statusOption}
            onChange={setStatusOption}
            styles={{
              control: (base) => ({ ...base, minHeight: 32, height: 32, minWidth: 170, fontSize: '0.75rem' }),
              menu: (base) => ({ ...base, width: 'max-content', minWidth: '100%' }),
              option: (base) => ({ ...base, whiteSpace: 'nowrap' }),
            }}
          />
          <button
            type="button"
            onClick={handleChangeStatus}
            disabled={selected_orders.length === 0 || !statusOption || applyingStatus}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
          >
            {applyingStatus ? (t.saving ?? 'Guardando…') : t.change_status}
          </button>
        </div>

        {selected_orders.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected_orders.length} seleccionado{selected_orders.length !== 1 ? 's' : ''}
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={selected_orders.length === 0 || savingChanges}
          className={`btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed ${selected_orders.length > 0 ? '' : 'ml-auto'}`}
        >
          <IconSave className="h-4 w-4" />
          {savingChanges ? (t.saving ?? 'Guardando…') : t.btn_save_changes}
        </button>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10 text-center`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-[18px] w-[18px]"
                    checked={pageData.length > 0 && selected_orders.length === pageData.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className={`${thClass} w-16 text-center`}>{t.nro_purchase_order}</th>
                <th className={`${thClass} w-16 text-center`}>{t.nro_order}</th>
                <th className={`${thClass} w-48`}>{t.supplier}</th>
                <th className={`${thClass} w-16 text-center`}>{t.days_of_process}</th>
                <th className={`${thClass} w-24`}>{t.status}</th>
                <th className={`${thClass} w-28`}>{t.country}</th>
                <th className={`${thClass} w-10 text-center`}>R1</th>
                <th className={`${thClass} w-10 text-center`}>R2</th>
                <th className={`${thClass} w-10 text-center`}>R3</th>
                <th className={`${thClass} w-64`}>Tracking</th>
                <th className={`${thClass} w-64`}>{t.note}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-sm text-gray-400">{t.loading}</td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, i) => (
                <tr
                  key={o.id ?? i}
                  className={`transition-colors ${
                    selected_orders.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox h-[18px] w-[18px]" checked={selected_orders.includes(o)} onChange={() => toggleRow(o)} />
                  </td>
                  <td className={`${tdClass} text-center font-medium`}>{o.NumOrdenCompra}</td>
                  <td className={`${tdClass} text-center`}>
                    <span className="inline-flex items-center justify-center">
                      <span
                        title={o.TieneNota ? (t.has_note ?? 'Tiene nota') : undefined}
                        className={`h-2 w-2 rounded-full mr-1.5 shrink-0 ${o.TieneNota ? 'bg-amber-400 dark:bg-amber-500' : 'invisible'}`}
                      />
                      {o.NroOrden}
                    </span>
                  </td>
                  <td className={`${tdClass} font-medium truncate`} title={o.NomPrv}>{o.NomPrv}</td>
                  <td className={`${tdClass} text-center`}>{o.Dias}</td>
                  <td className={tdClass}>
                    {o.NomStatus ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        {o.NomStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className={tdClass}>
                    {o.CodPaisCliente ? (
                      <div className="inline-flex items-center gap-1">
                        <img
                          src={`/assets/flags/${o.CodPaisCliente.toLowerCase()}.svg`}
                          alt={o.NomPais || o.CodPaisCliente}
                          className="h-3 w-4 rounded-sm object-cover shrink-0"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="truncate">{o.NomPais || o.CodPaisCliente}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      className="form-checkbox h-[18px] w-[18px]"
                      {...register(`orders.${o.NumOrdenCompra}.checked1`)}
                      value={1}
                      onChange={(event) => handleChecked(event, o, 1)}
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      className="form-checkbox h-[18px] w-[18px]"
                      {...register(`orders.${o.NumOrdenCompra}.checked2`)}
                      value={1}
                      onChange={(event) => handleChecked(event, o, 2)}
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      className="form-checkbox h-[18px] w-[18px]"
                      {...register(`orders.${o.NumOrdenCompra}.checked3`)}
                      value={1}
                      onChange={(event) => handleChecked(event, o, 3)}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`orders.${o.NumOrdenCompra}.tracking`)}
                      onChange={(e) => handleUppercaseChange(e, o, 'tracking')}
                      className={inputRowClass}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`orders.${o.NumOrdenCompra}.note`)}
                      onChange={(e) => handleUppercaseChange(e, o, 'note')}
                      className={inputRowClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}

      {/* Modal filtro avanzado */}
      <Modal showModal={showFilterModal} closeModal={() => setShowFilterModal(false)} title={t.advanced_filter} size="w-full max-w-5xl">
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <FilterChecklist
              title={t.supplier}
              options={catalogs.proveedores}
              selected={draftFilters.proveedores}
              onToggle={(v) => toggleDraft('proveedores', v)}
            />
            <FilterChecklist
              title={t.country}
              options={catalogs.paises}
              selected={draftFilters.paises}
              onToggle={(v) => toggleDraft('paises', v)}
            />
            <FilterChecklist
              title={t.status}
              options={catalogs.status}
              selected={draftFilters.status}
              onToggle={(v) => toggleDraft('status', v)}
            />
            <FilterChecklist
              title={t.nro_order}
              options={catalogs.ordenes}
              selected={draftFilters.ordenes}
              onToggle={(v) => toggleDraft('ordenes', v)}
            />
            <FilterChecklist
              title={t.nro_purchase_order}
              options={catalogs.oc}
              selected={draftFilters.oc}
              onToggle={(v) => toggleDraft('oc', v)}
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300">
            {['r1', 'r2', 'r3'].map((k, idx) => (
              <label key={k} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-3 w-3"
                  checked={draftFilters[k]}
                  onChange={() => setDraftFilters(prev => ({ ...prev, [k]: !prev[k] }))}
                />
                R{idx + 1}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={clearAdvancedFilters}
              className="inline-flex items-center h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
            >
              {t.clear_filters}
            </button>
            <button
              type="button"
              onClick={applyAdvancedFilters}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
            >
              {t.accept}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Mail a Proveedor */}
      <Modal showModal={showMailModal} closeModal={() => setShowMailModal(false)} title={t.mail_supplier_title} size="w-full max-w-3xl">
        {showMailModal && (
          <MailToSupplierForm t={t} selected={selected_orders} close={() => setShowMailModal(false)} />
        )}
      </Modal>
    </div>
  );
};

export default Orders;
