"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import { swalSuccess, swalError, swalConfirm, swalInfo } from '@/app/lib/swal';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowLeft from "@/components/icon/icon-arrow-left";
import IconPlusCircle from "@/components/icon/icon-plus-circle";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconX from "@/components/icon/icon-x";
import IconMail from "@/components/icon/icon-mail";
import IconSave from "@/components/icon/icon-save";
import IconAttachment from "@/components/icon/icon-attachment";
import IconArrowsExchange from "@/components/icon/icon-arrows-exchange";
import MailToSupplierForm from "@/app/admin/queries/spare-parts-identified/quotes/mail-to-supplier-form";
import MailToCustomerForm from "@/app/admin/queries/spare-parts-identified/quotes/mail-to-customer-form";
import AttachQuoteForm from "@/components/forms/attach-quote-form";

const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 text-right pr-3";
const inputClass = "h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-gray-800";
const thClass    = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass    = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";
const btnPrimary = "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition";
const btnSecondary = "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition";


const selectStyles = {
  control:             b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px' }),
  valueContainer:      b => ({ ...b, padding: '0 8px' }),
  indicatorsContainer: b => ({ ...b, height: '36px' }),
};

export default function QuoteIdentify() {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();

  const customer_id = searchParams.get("customer");
  const quote_id    = searchParams.get("id");

  const [brands, setBrands] = useState([]);
  const [select_equipment, setSelectEquipment] = useState(null);
  const [select_engine,    setSelectEngine]    = useState(null);

  const [customer, setCustomer] = useState({});
  const [quote,    setQuote]    = useState({});
  const [items,    setItems]    = useState([]);
  const [follow,   setFollow]   = useState(null);

  const [current_row, setCurrentRow] = useState(1);
  const [selected,    setSelected]   = useState([]);
  const [isSelect,    setIsSelect]   = useState(true);

  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [select_share,          setSelectShare]          = useState(null);
  const [seguimientoNombre,     setSeguimientoNombre]    = useState(null);
  const [suppliers_suggestion,  setSupplierSuggestion]  = useState([]);
  const [suppliers,             setSuppliers]            = useState([]);
  const [users,                 setUsers]                = useState([]);

  const [converting,    setConverting]   = useState(false);
  const [show_modal,    setShowModal]    = useState(false);
  const [modal_title,   setModalTitle]   = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size,    setModalSize]    = useState('w-full max-w-xl');

  const { register, setValue, getValues, formState: { errors } } = useForm();

  useEffect(() => {
    async function fetchData() {
      await getDetail(quote_id);
      await getLists(quote_id);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let c_r = current_row;
    items.map(i => {
      c_r++;
      setValue(`items.${i.codItem}.amount`,           getValues(`items.${i.codItem}.amount`)           || i.cantidad);
      setValue(`items.${i.codItem}.description`,      getValues(`items.${i.codItem}.description`)      || i.desRepuesto);
      setValue(`items.${i.codItem}.description_real`, getValues(`items.${i.codItem}.description_real`) || i.desRepReal);
      setValue(`items.${i.codItem}.nro_part`,         getValues(`items.${i.codItem}.nro_part`)         || i.nroParte);
    });
    setCurrentRow(c_r);
  }, [items]);

  useEffect(() => {
    setValue('nro_order',        quote.nroPedido);
    setValue('equipment_model',  quote.modelo);
    setValue('equipment_serie',  quote.nroSerie);
    setValue('engine_model',     quote.modeloMo);
    setValue('engine_serie',     quote.nroSerieMo);
    setValue('note',             quote.notCliente);
  }, [quote]);

  // Resuelve los selects de marca cuando ambos (brands y quote) estén disponibles
  useEffect(() => {
    if (brands.length === 0) return;
    if (quote.codMarca)   setSelectEquipment(brands.find(b => b.value == quote.codMarca)   ?? null);
    if (quote.codMarcaMo) setSelectEngine(   brands.find(b => b.value == quote.codMarcaMo) ?? null);
  }, [brands, quote]);

  useEffect(() => { setIsSelect(selected.length === 0); }, [selected]);

  const getDetail = async (nroCotizacion) => {
    try {
      const rs = await axiosClient.get(`repuestosporidentificar/detalle/${nroCotizacion}`);
      const d  = rs.data;
      const cat = d.cotizacion?.catCotizacion;
      if (cat === 'NR' || cat === 'MA') {
        const option = cat === 'NR' ? 'quotes' : 'manual';
        const label  = cat === 'NR' ? 'Normal (NR)' : 'Manual (MA)';
        await swalInfo(`Esta cotización ya fue convertida a Cotización ${label}.`);
        router.replace(`/admin/revision/quotes?customer=${customer_id}&option=${option}&id=${nroCotizacion}`);
        return;
      }
      setQuote(d.cotizacion ?? {});
      setItems((d.items ?? []).map((o, i) => ({ ...o, id: i })));
      setFollow(d.seguimiento ?? null);
      setCustomer(d.cliente ?? {});
      const nomSeg = d.seguimiento?.nomUsuario ?? null;
      setSeguimientoNombre(nomSeg);
      setAllDisabledTracking(!!nomSeg);
    } catch {}
  };

  const getLists = async (nroCotizacion) => {
    try {
      const rs = await axiosClient.get('repuestosporidentificar/controles', { params: { nroCotizacion } });
      setBrands(rs.data.marcas       ?? []);
      setSupplierSuggestion(rs.data.proveedores ?? []);
      setSuppliers(rs.data.proveedores ?? []);
      setUsers(rs.data.usuarios       ?? []);
    } catch {}
  };

  const toggleAll = () => setSelected(selected.length === items.length ? [] : [...items]);
  const toggleRow = (row) => setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const copyDescription = (codItem) => {
    setValue(`items.${codItem}.description_real`, getValues(`items.${codItem}.description`));
  };

  const copyAllDescriptions = () => {
    items.forEach(i => {
      setValue(`items.${i.codItem}.description_real`, getValues(`items.${i.codItem}.description`));
    });
  };

  const addRow = () => {
    setItems([...items, { id: current_row, codItem: current_row, cantidad: 1, desRepuesto: '', desRepReal: '', nroParte: '' }]);
    setCurrentRow(current_row + 1);
  };
  const removeRow = () => {
    if (selected.length > 0) {
      setItems(items.filter(item => !selected.includes(item)));
      setSelected([]);
    }
  };

  const handleChangeOptionShare = (select) => {
    setValue('share_with_customer', select?.value ?? 0);
    setSelectShare(select ?? null);
  };

  const apply = async () => {
    try {
      await axiosClient.post('repuestosporidentificar/registrar-seguimiento', {
        nroCotizacion:        quote.nroCotizacion,
        codUsuarioCompartido: getValues('share_with_customer') ?? 0,
        notaUsuario:          getValues('note') ?? '',
      });
      swalSuccess(t.tracking_option_success ?? 'Seguimiento registrado');
      setSeguimientoNombre(select_share?.label ?? null);
      setAllDisabledTracking(true);
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? (t.tracking_option_error ?? 'No se pudo registrar el seguimiento'), t.close);
    }
  };

  const handleSave = async () => {
    if (items.length === 0) return;
    const payload = {
      nroCotizacion: quote.nroCotizacion,
      codCliente:    Number(customer_id),
      nroPedido:     getValues('nro_order')      ?? '',
      marcaEquipo:   select_equipment?.label     ?? '',
      modeloEquipo:  getValues('equipment_model') ?? '',
      nroSerieEquipo:getValues('equipment_serie') ?? '',
      marcaMotor:    select_engine?.label         ?? '',
      modeloMotor:   getValues('engine_model')    ?? '',
      nroSerieMotor: getValues('engine_serie')    ?? '',
      nota:          getValues('note')            ?? '',
      detalle:       items.map(i => ({
        nroParte:       getValues(`items.${i.codItem}.nro_part`)         ?? '',
        descripcion:    getValues(`items.${i.codItem}.description`)      ?? '',
        descripcionReal:getValues(`items.${i.codItem}.description_real`) ?? '',
        cantidad:       Number(getValues(`items.${i.codItem}.amount`))   || 1,
      })),
    };
    try {
      await axiosClient.put('repuestosporidentificar/guardar-cambios', payload);
      swalSuccess(t.save_success);
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? t.save_error, t.close);
    }
  };

  const handleConvert = async () => {
    const { isConfirmed } = await swalConfirm(t.question_quote_to_normal ?? '¿Convertir a cotización normal?', '', { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#15803d' });
    if (!isConfirmed) return;
    setConverting(true);
    try {
      const rs = await axiosClient.post('repuestosporidentificar/convertir-normal', quote.nroCotizacion, {
        headers: { 'Content-Type': 'application/json' },
      });
      swalSuccess(rs.data?.mensaje ?? t.convert_quote_success);
      router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${quote.nroCotizacion}`);
    } catch (err) {
      const data = err?.response?.data;
      swalError(t.error ?? 'Error', data?.detalle ?? data?.mensaje ?? t.save_error);
      setConverting(false);
    }
  };

  const handleConvertManual = async () => {
    const { isConfirmed } = await swalConfirm('¿Convertir a cotización manual?', '', { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#ea580c' });
    if (!isConfirmed) return;
    setConverting(true);
    try {
      const rs = await axiosClient.post('repuestosporidentificar/convertir-manual', quote.nroCotizacion, {
        headers: { 'Content-Type': 'application/json' },
      });
      swalSuccess(rs.data?.mensaje ?? t.convert_quote_success);
      router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${quote.nroCotizacion}`);
    } catch (err) {
      const data = err?.response?.data;
      swalError(t.error ?? 'Error', data?.detalle ?? data?.mensaje ?? t.save_error);
      setConverting(false);
    }
  };

  const handleEmailSupplier = () => {
    setModalTitle(t.mail_to_supplier ?? 'Mail a Proveedor'); setModalSize('w-full max-w-3xl');
    setModalContent(<MailToSupplierForm order={quote} selected={selected} close={() => setShowModal(false)} t={t} />);
    setShowModal(true);
  };
  const handleMailToCustomer = () => {
    setModalTitle(t.mail_to_customer ?? 'Mail a Cliente'); setModalSize('w-full max-w-3xl');
    setModalContent(<MailToCustomerForm order={quote} codCliente={customer_id} close={() => setShowModal(false)} t={t} />);
    setShowModal(true);
  };
  const attach = () => {
    setModalTitle(t.attach ?? 'Adjuntar'); setModalSize('w-full max-w-6xl');
    setModalContent(<AttachQuoteForm close={() => setShowModal(false)} nro={quote.nroCotizacion} urls={{ upload: 'repuestosporidentificar/guaarchadj', list: 'repuestosporidentificar/verarchadj', delete: 'repuestosporidentificar/eliarchadj', update: 'repuestosporidentificar/modarchadj' }} t={t} />);
    setShowModal(true);
  };

  useDynamicTitle(t.spare_parts_to_be_identified);

  return (
    <>
      {/* Overlay conversión */}
      {converting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Convirtiendo cotización...</p>
        </div>
      )}

      {/* ── BREADCRUMB + VOLVER ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>{t.query}</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/queries/spare-parts-identified" className="text-primary hover:underline">
              {t.spare_parts_to_be_identified}
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2">
            <span>{t.quote}</span>
          </li>
          {customer.nomCliente && (
            <li className="before:content-['/'] before:mx-2">
              <span
                title={customer.nomPais || undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
              >
                {customer.codPais && (
                  <img
                    src={`/assets/flags/${customer.codPais.toLowerCase()}.svg`}
                    alt={customer.nomPais}
                    className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                  />
                )}
                {customer.nomCliente}
              </span>
            </li>
          )}
        </ul>
        <Link
          href="/admin/queries/spare-parts-identified"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 transition dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <IconArrowBackward className="h-4 w-4" />
          {t.back}
        </Link>
      </div>

      <div className="space-y-3">

        {/* ── NRO PEDIDO + INFO ─────────────────────────────────────── */}
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{t.nro_pedido}</label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  {...register("nro_order", { required: { value: true, message: t.required_field } })}
                  placeholder={t.enter_nro_order}
                  className={`h-8 w-64 rounded-lg border-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-gray-900 ${errors.nro_order ? 'border-red-400' : 'border-gray-400 dark:border-gray-500'}`}
                />
                {errors.nro_order && (
                  <span className="absolute top-full left-0 mt-0.5 text-[10px] text-red-500 whitespace-nowrap">{errors.nro_order?.message?.toString()}</span>
                )}
              </div>
            </div>
            {quote.nroCotizacion && (
              <div className="flex items-center gap-6 text-sm ml-auto">
                <span className="text-gray-500">{t.nro_quote}:
                  <span className="ml-1.5 font-bold text-primary text-base">{quote.nroCotizacion}</span>
                </span>
                <span className="text-gray-500">{t.nro_items}:
                  <span className="ml-1.5 font-bold text-primary text-base">{quote.nroItems}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── EQUIPO + MOTOR + SEGUIMIENTO ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Equipo */}
          <div className="panel overflow-hidden border border-blue-200 dark:border-blue-900 p-0">
            <div className="px-4 py-2 border-b border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t.equipment_data}</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.brand}</label>
                <div className="flex-1">
                  <Select
                    options={brands}
                    value={select_equipment}
                    onChange={value => { setValue('equipment_brand', value?.value ?? null); setSelectEquipment(value); }}
                    placeholder={t.select_option}
                    instanceId="eq-brand"
                    menuPosition="fixed"
                    filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin opciones'}
                    styles={selectStyles}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.model}</label>
                <input type="text" autoComplete="off" {...register("equipment_model")} placeholder={t.enter_equipment_model} className={inputClass} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.equipment_serie}</label>
                <input type="text" autoComplete="off" {...register("equipment_serie")} placeholder={t.enter_equipment_serie} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Motor */}
          <div className="panel overflow-hidden border border-violet-200 dark:border-violet-900 p-0">
            <div className="px-4 py-2 border-b border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-900/20">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t.engine_data}</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.brand}</label>
                <div className="flex-1">
                  <Select
                    options={brands}
                    value={select_engine}
                    onChange={value => { setValue('engine_brand', value?.value ?? null); setSelectEngine(value); }}
                    placeholder={t.select_option}
                    instanceId="en-brand"
                    menuPosition="fixed"
                    filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin opciones'}
                    styles={selectStyles}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.model}</label>
                <input type="text" autoComplete="off" {...register("engine_model")} placeholder={t.enter_engine_model} className={inputClass} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelClass}>{t.engine_serie}</label>
                <input type="text" autoComplete="off" {...register("engine_serie")} placeholder={t.enter_engine_serie} className={inputClass} />
              </div>
            </div>
          </div>

          {/* CRM / Seguimiento */}
          <div className="panel overflow-hidden border border-amber-200 dark:border-amber-900 p-0">
            <div className="px-4 py-2 border-b border-amber-100 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-900/20">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">CRM / Seguimiento</p>
            </div>
            <div className="p-3 space-y-2">
              {suppliers_suggestion.length <= 12 ? (
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {t.supplier_suggestion}
                  </label>
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {suppliers_suggestion.length === 0
                      ? <span className="text-xs text-gray-400 italic">—</span>
                      : suppliers_suggestion.map((s, i) => (
                          <span key={i} className="inline-flex items-center h-6 px-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[11px] font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {s.label}
                          </span>
                        ))
                    }
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.supplier_suggestion}</label>
                  <div className="flex-1 min-w-0">
                    <Select
                      options={suppliers_suggestion}
                      isSearchable
                      isClearable={false}
                      menuPosition="fixed"
                      placeholder="—"
                      menuShouldScrollIntoView={false}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className={labelClass}>{all_disabled_tracking ? (t.shared_with ?? 'Compartido con') : t.share_with}</label>
                {all_disabled_tracking ? (
                  <span className="h-9 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 text-sm font-medium text-primary truncate">
                    {seguimientoNombre ?? '—'}
                  </span>
                ) : (
                  <div className="flex flex-1 min-w-0 gap-0">
                    <div className="flex-1 min-w-0">
                      <Select
                        options={users}
                        isClearable
                        value={select_share}
                        instanceId="share-user"
                        menuPosition="fixed"
                        onChange={handleChangeOptionShare}
                        placeholder={t.select_option}
                        styles={{
                          ...selectStyles,
                          control: b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px', borderRadius: '0.5rem 0 0 0.5rem', borderRight: 'none' }),
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={apply}
                      className="h-9 shrink-0 px-3 rounded-r-lg border border-l-0 border-gray-300 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition"
                    >
                      {t.apply}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── NOTA ──────────────────────────────────────────────────── */}
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="flex items-center gap-2 px-4 py-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 w-28 text-right pr-3">{t.note}</label>
            <input type="text" autoComplete="off" {...register("note")} placeholder={t.enter_note} className={inputClass} />
          </div>
        </div>

        {/* ── TABLA DE ITEMS ────────────────────────────────────────── */}
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.part_description ?? 'Items'}</p>
              <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addRow} type="button"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 px-3 text-primary text-xs font-medium hover:bg-primary/5 transition">
                <IconPlusCircle className="h-3.5 w-3.5" />
                {t.btn_add}
              </button>
              <button onClick={removeRow} disabled={isSelect} type="button"
                className={`flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition ${isSelect ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20'}`}>
                <IconX className="h-3.5 w-3.5" />
                {t.delete}
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-10 text-center`}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={items.length > 0 && selected.length === items.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className={`${thClass} w-24`}>{t.quantity}</th>
                  <th className={thClass}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{t.description}</span>
                      <button
                        type="button"
                        onClick={copyAllDescriptions}
                        title="Copiar todas las descripciones"
                        className="inline-flex items-center gap-1 h-5 px-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-[10px] font-semibold text-gray-500 dark:text-gray-300 hover:border-primary hover:text-primary transition normal-case tracking-normal"
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        Todo
                      </button>
                    </div>
                  </th>
                  <th className={thClass}>{t.translate_piece}</th>
                  <th className={`${thClass} w-36`}>{t.nro_part}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                  </tr>
                ) : items.map((record, i) => (
                  <tr key={record.id ?? i}
                    className={`transition-colors ${selected.includes(record) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <td className={`${tdClass} text-center`}>
                      <input type="checkbox" className="form-checkbox" checked={selected.includes(record)} onChange={() => toggleRow(record)} />
                    </td>
                    <td className={tdClass}>
                      <input
                        {...register(`items.${record.codItem}.amount`)}
                        step="any" type="number"
                        className="h-8 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                    <td className={tdClass}>
                      <div className="flex">
                        <input
                          {...register(`items.${record.codItem}.description`)}
                          type="text"
                          className="h-8 flex-1 rounded-l-lg border border-r-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                        <button
                          onClick={() => copyDescription(record.codItem)}
                          type="button"
                          title={t.copy ?? 'Copiar descripción'}
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-r-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        >
                          <IconArrowLeft className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <input
                        {...register(`items.${record.codItem}.description_real`)}
                        type="text"
                        className="h-8 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        {...register(`items.${record.codItem}.nro_part`)}
                        type="text"
                        className="h-8 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer — acciones */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex-wrap gap-2 bg-white dark:bg-gray-900">
            {/* Grupo izquierdo: comunicación */}
            <div className="flex flex-wrap gap-2">
              <button onClick={handleMailToCustomer} type="button"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400 text-xs font-semibold transition">
                <IconMail className="h-3.5 w-3.5" />
                {t.mail_to_customer}
              </button>
              <button onClick={handleEmailSupplier} disabled={isSelect} type="button"
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${isSelect ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-400'}`}>
                <IconMail className="h-3.5 w-3.5" />
                {t.mail_to_supplier}
              </button>
              <button onClick={attach} type="button" className={btnSecondary}>
                <IconAttachment className="h-3.5 w-3.5" />
                {t.attach}
              </button>
            </div>
            {/* Grupo derecho: conversión + guardar */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleConvert} type="button"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400 text-xs font-semibold transition">
                <IconArrowsExchange className="h-3.5 w-3.5" />
                Convertir Cotización Normal
              </button>
              <button
                onClick={handleConvertManual}
                type="button"
                disabled={!select_equipment && !select_engine}
                title={!select_equipment && !select_engine ? 'Se requiere al menos una marca (equipo o motor)' : undefined}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition
                  ${!select_equipment && !select_engine
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
                    : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                  }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Convertir Cotización Manual
              </button>
              <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
              <button onClick={handleSave} type="button" className={btnPrimary}>
                <IconSave className="h-3.5 w-3.5" />
                {t.btn_save_changes}
              </button>
            </div>
          </div>

        </div>

      </div>

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content} />
    </>
  );
}
