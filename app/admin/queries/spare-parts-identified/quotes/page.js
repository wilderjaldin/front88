"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useEffect, Fragment, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { Checkbox } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import { Tab } from '@headlessui/react';
import Swal from 'sweetalert2'
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import { useOptionsSelect } from '@/app/options'
import IconArrowLeft from "@/components/icon/icon-arrow-left";
import IconPlusCircle from "@/components/icon/icon-plus-circle";
import IconTrash from "@/components/icon/icon-trash";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconX from "@/components/icon/icon-x";
import IconMail from "@/components/icon/icon-mail";
import IconSave from "@/components/icon/icon-save";
import IconRefresh from "@/components/icon/icon-refresh";
import MailToSupplierForm from "@/app/admin/queries/spare-parts-identified/quotes/mail-to-supplier-form"
import MailToCustomerForm from "@/app/admin/queries/spare-parts-identified/quotes/mail-to-customer-form"
import IconAttachment from "@/components/icon/icon-attachment";
import AttachQuoteForm from "@/components/forms/attach-quote-form";


const url_quote_detail = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/MostrarDetalleCotSc';
const url_lists = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/MostrarListaControles';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/GuardarCambios';
const url_convert = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/ConvertirCotizacion';

export default function QuoteIdentify() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const customer_id = searchParams.get("customer");
  const quote_id = searchParams.get("id");

  const brands = useOptionsSelect("brands") || [];
  const [select_equipment, setSelectEquipment] = useState(null);
  const [select_engine, setSelectEngine] = useState(null);

  const [customer, setCustomer] = useState([]);

  //
  const [current_row, setCurrentRow] = useState(1);
  //
  const [quote, setQuote] = useState([]);
  const [items, setItems] = useState([]);
  const [follow, setFollow] = useState([]);


  const [selected, setSelected] = useState([]);
  const [isSelect, setIsSelect] = useState(false);
  //

  //follow
  const [disabledTracking, setDisabledTracking] = useState(true);
  const [quote_or_tracking_option, setQuoteORTrackingOption] = useState();
  const [tracking_option, setTrackingOption] = useState('');
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  //List
  const [suppliers_suggestion, setSupplierSuggestion] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  //
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-xl')
  //



  const {
    register,
    handleSubmit, setValue, getValues, unregister,
    formState: { errors },
  } = useForm();

  useEffect(() => {

    async function fetchData() {
      let res = await getDetail(quote_id);
      let lists = await getLists(quote_id);
    }
    fetchData();

  }, []);
  useEffect(() => {
    let c_r = current_row;
    items.map(i => {
      c_r++;
      setValue(`items.${i.CodItem}.amount`, ((getValues(`items.${i.CodItem}.amount`)) ? getValues(`items.${i.CodItem}.amount`) : i.Cantidad));
      setValue(`items.${i.CodItem}.description`, ((getValues(`items.${i.CodItem}.description`)) ? getValues(`items.${i.CodItem}.description`) : i.DesRepuesto));
      setValue(`items.${i.CodItem}.description_real`, ((getValues(`items.${i.CodItem}.description_real`)) ? getValues(`items.${i.CodItem}.description_real`) : i.DesRepuestoReal));
      setValue(`items.${i.CodItem}.nro_part`, ((getValues(`items.${i.CodItem}.nro_part`)) ? getValues(`items.${i.CodItem}.nro_part`) : i.NroParte));
    });
    setCurrentRow(c_r);
  }, [items]);

  useEffect(() => {
    setValue('nro_order', quote.NroPedido);

    setValue('equipment_model', quote.ModeloEquipo);
    setValue('equipment_serie', quote.NroSerieEquipo);
    setValue('engine_model', quote.ModeloMotor);
    setValue('engine_serie', quote.NroSerieMotor);
    setValue('note', quote.NotaCliente);
    // marca equipo
    if (quote.MarcaEquipo) {
      let equipment_brand = brands.find(b => b.value == quote.MarcaEquipo) || null;
      if (equipment_brand) {
        setSelectEquipment(equipment_brand);
      }
    }
    if (quote.MarcaMotor) {
      let engine_brand = brands.find(b => b.value == quote.MarcaMotor) || null;
      if (engine_brand) {
        setSelectEngine(engine_brand);
      }
    }
  }, [quote]);


  const getDetail = async (NroOrden) => {
    try {
      const rs = await axios.post(url_quote_detail, { NroOrden: NroOrden, ValToken: token });

      if (rs.data.estado == 'OK') {
        setQuote(rs.data.dato1[0]);

        let array_items = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setItems(array_items);
        setFollow(rs.data.dato3);
        setCustomer(rs.data.dato4[0]);
      }
    } catch (error) {

    }
  }

  const getLists = async (NroOrden) => {
    try {
      const rs = await axios.post(url_lists, { NroOrden: NroOrden, ValToken: token });

      if (rs.data.estado == 'OK') {
        let _suggestion = [];
        rs.data.dato1.map(s => {
          if (s.CodPrv != 0) {
            _suggestion.push({ value: s.CodPrv, label: s.NomPrv })
          }
        });
        setSupplierSuggestion(_suggestion);

        let _suppliers = [];
        rs.data.dato2.map(s => {
          if (s.CodPrv != 0) {
            _suppliers.push({ value: s.CodPrv, label: s.NomPrv })
          }
        });
        setSuppliers(_suppliers);

        let _users = [];
        rs.data.dato3.map(u => {
          if (u.CodUsuario != 0) {
            _users.push({ value: u.CodUsuario, label: u.NomUsuario })
          }
        });
        setUsers(_users);
      }
    } catch (error) {

    }
  }

  const onChangeSelectEquipmentBrand = (value) => {
    setValue('equipment_brand', (value.value) ?? null);
    setSelectEquipment(value);
  }
  const onChangeSelectEngineBrand = (value) => {
    setValue('engine_brand', (value.value) ?? null)
    setSelectEngine(value);
  }

  //
  const toggleAll = () => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelected((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };
  useEffect(() => {
    if (selected.length > 0) {
      setIsSelect(false)
    } else {
      setIsSelect(true);
    }
  }, [selected]);
  //
  const copyDescription = (CodItem) => {
    setValue(`items.${CodItem}.description_real`, getValues(`items.${CodItem}.description`));
  }
  //
  const addRow = () => {
    setItems([...items, { id: current_row, CodItem: current_row, Cantidad: 1, DesRepuesto: "", DesRepuestoReal: "", NroParte: "" }]);
    setCurrentRow(current_row + 1);
  }
  const removeRow = () => {
    if (selected.length > 0) {
      const nuevaData = items.filter((item) => !selected.includes(item));

      setItems(nuevaData);
      setSelected([]);
    }
  }
  // follow
  const handleChangeOptionShare = (select) => {
    setValue('share_with_customer', (select?.value) ?? 0);
  }
  const handleChangeOption = (option) => {
    setQuoteORTrackingOption(option.target.value);
    if (option.target.value == 'quote') {
      setDisabledTracking(true);
    } else {
      setDisabledTracking(false);
    }
  }

  const handleChangeTracking = (option) => {

    setTrackingOption(option.target.value);
  }

  //
  const handleSave = async () => {

    if (items.length > 0) {
      let data = [];

      items.map(i => {
        data.push({
          NroOrden: quote.NroOrden,
          CodCliente: customer_id,
          NroPedido: getValues('nro_order'),
          MarcaEquipo: (select_equipment?.label) ? select_equipment.label : "",
          ModeloEquipo: getValues('equipment_model'),
          AnioEquipo: "",
          NroSerieEquipo: getValues('equipment_serie'),
          MarcaMotor: (select_engine?.label) ? select_engine.label : "",
          ModeloMotor: getValues('engine_model'),
          NroSerieMotor: getValues('engine_serie'),
          Nota: getValues('note'),

          Cantidad: ((getValues(`items.${i.CodItem}.amount`)) ? getValues(`items.${i.CodItem}.amount`) : 1),
          Descripcion: ((getValues(`items.${i.CodItem}.description`)) ? getValues(`items.${i.CodItem}.description`) : ''),
          DescripcionReal: ((getValues(`items.${i.CodItem}.description_real`)) ? getValues(`items.${i.CodItem}.description_real`) : ''),
          NroParte: ((getValues(`items.${i.CodItem}.nro_part`)) ? getValues(`items.${i.CodItem}.nro_part`) : ''),

          ValToken: token
        }
        );
      });


      try {
        const rs = await axios.post(url_save, data);

        if (rs.data.estado == 'Ok') {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.save_success,
            showConfirmButton: false,
            timer: 2500
          });
        }
      } catch (error) {

      }
    }
  }

  const handleConvert = async () => {
    Swal.fire({
      title: t.question_quote_to_normal,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_convert, { NroOrden: quote.NroOrden, ValToken: token });
          
          if (rs.data.estado == 'Ok') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.convert_quote_success,
              showConfirmButton: false,
              timer: 2500
            }).then(r => {
              router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${quote.NroOrden}`);
            });
          }
        } catch (error) {

        }
      }
    });


  }

  const handleEmailSupplier = () => {
    setModalTitle('');
    setModalSize('w-full max-w-3xl');
    setModalContent(<MailToSupplierForm order={quote} selected={selected} close={() => setShowModal(false)} t={t} token={token}></MailToSupplierForm>);
    setShowModal(true);
  }

  const handleMailToCustomer = () => {

    setModalTitle('');
    setModalSize('w-full max-w-3xl');
    setModalContent(<MailToCustomerForm order={quote} selected={selected} close={() => setShowModal(false)} t={t} token={token}></MailToCustomerForm>);
    setShowModal(true);
  }

  const attach = () => {
    setModalTitle('');
    setModalSize('w-full max-w-6xl');
    setModalContent(<AttachQuoteForm close={() => setShowModal(false)} order={quote} token={token} t={t}></AttachQuoteForm>);
    setShowModal(true);
  }

  useDynamicTitle(t.spare_parts_to_be_identified);

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.query}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            {t.spare_parts_to_be_identified}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{t.quote}</span>
          </li>
          {(customer) &&
            <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
              <span className="bg-blue-600 p-2 text-white rounded"> {customer.NomCliente} </span>
            </li>
          }
        </ul>
      </div>

      <form action="">
        <div className='panel border mt-8 bg-[#F2F2F2]'>
          <fieldset>
            <legend></legend>

            <div className="grid grid-cols-3 gap-4 bg-gray-400">
              <div className=''>
                <div className="flex sm:flex-row items-center flex-col pt-3 pb-3">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end text-black" htmlFor="nro_order">{t.nro_pedido}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("nro_order", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_order ? "true" : "false"} placeholder={t.enter_nro_order} className="form-input placeholder:" />
                    {errors.nro_order && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_order?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="col-span-2 bg-gray-300 gap-4 p-4">
                {(quote.NroOrden) &&
                  <div className="grid grid-cols-2">
                    <div>
                      <div className="flex sm:flex-row flex-col items-center">
                        <label className="mb-0 sm:w-2/5 sm:ltr:mr-4 rtl:ml-2 text-end text-blue-800">{t.nro_quote}</label>
                        <div className="relative flex-1 text-blue-800 font-bold text-lg">
                          {quote.NroOrden}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex sm:flex-row flex-col items-center">
                        <label className="mb-0 sm:w-2/5 sm:ltr:mr-4 rtl:ml-2 text-end text-blue-800">{t.nro_items}</label>
                        <div className="relative flex-1 text-blue-800 font-bold text-lg">
                          {quote.NroItems}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

          </fieldset>

          <fieldset className='mt-4'>
            <legend></legend>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-4 z-10">
                <h3 className='font-bold text-center'>{t.equipment_data}</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select options={brands} value={select_equipment} onChange={onChangeSelectEquipmentBrand} placeholder={t.select_option} className='w-full form-select-sm' />
                  </div>
                  <div className='block'>
                    {errors.equipment_brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_brand?.message?.toString()}</span>}
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_model">{t.model}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("equipment_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_model ? "true" : "false"} placeholder={t.enter_equipment_model} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_serie">{t.equipment_serie}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("equipment_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_serie ? "true" : "false"} placeholder={t.enter_equipment_serie} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>
              <div className="space-y-4 z-10">
                <h3 className="font-bold text-center">{t.engine_data}</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_brand">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select value={select_engine} tabIndex="2" placeholder={t.select_option} className='w-full form-select-sm' options={brands} onChange={onChangeSelectEngineBrand} />
                  </div>
                  <div className='block'>
                    {errors.engine_brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_brand?.message?.toString()}</span>}
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_model">{t.model}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("engine_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_model ? "true" : "false"} placeholder={t.enter_engine_model} className="form-input form-input-sm placeholder:" />
                    {errors.engine_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_serie">{t.engine_serie}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("engine_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_serie ? "true" : "false"} placeholder={t.enter_engine_serie} className="form-input form-input-sm placeholder:" />
                    {errors.engine_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>

              <div className="space-y-4 rounded-md bg-white text-center shadow dark:bg-[#1c232f] mt-4 p-4">

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.supplier_suggestion}</label>
                  <div className='w-full px-2'>
                    <Select
                      options={suppliers_suggestion}
                      isClearable
                      {...register('suppliers_suggestion', { required: false })}
                      isSearchable
                      id="suppliers_suggestion"
                      instanceId="suppliers_suggestion"
                      menuPosition={'fixed'}
                      onChange={handleChangeOptionShare}
                      menuShouldScrollIntoView={false}
                      placeholder={t.select_option}
                    ></Select>
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="country">{t.share_with}</label>
                  <div className="">
                    <div className='flex'>
                      <Select
                        options={users}
                        isClearable
                        isDisabled={all_disabled_tracking}
                        {...register('share_with_customer', { required: false })}
                        isSearchable
                        id="city-select"
                        instanceId="city-select"
                        menuPosition={'fixed'}
                        onChange={handleChangeOptionShare}
                        menuShouldScrollIntoView={false}
                        placeholder={t.select_option}
                      ></Select>

                      <button disabled={all_disabled_tracking} onClick={() => apply()} type="button" className="btn btn-outline-primary ltr:rounded-l-none rtl:rounded-r-none">
                        {t.apply}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex w-full gap-4 my-6 items-center justify-center">
                  <div>
                    <label className="inline-flex">
                      <input onChange={handleChangeOption} type="radio" name="option" value={'quote'} disabled={all_disabled_tracking} className="form-radio" />
                      <span>{t.btn_quote}</span>
                    </label>
                  </div>
                  <div>
                    <label className="inline-flex">
                      <input onChange={handleChangeOption} type="radio" name="option" value={'tracking'} disabled={all_disabled_tracking} className="form-radio" />
                      <span>{t.follow}</span>
                    </label>
                  </div>
                </div>

              </div>

            </div>
            <div className="mt-4 text-start">
              <div className="flex sm:flex-row flex-col items-center">
                <label className="mb-0 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="note">{t.note}</label>
                <div className="relative flex-1">
                  <input type='text' autoComplete='OFF' {...register("note", { required: false })} placeholder={t.enter_note} className="form-input form-input-sm placeholder:" />
                </div>
              </div>
            </div>
          </fieldset>

        </div>
      </form>
      <div className="flex justify-between my-4">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button onClick={() => addRow()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconPlusCircle className="mr-2"></IconPlusCircle> Items
          </button>
          <button onClick={() => removeRow()} disabled={isSelect} type="button" className="btn enabled:btn-danger disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconX></IconX>
          </button>
          <button onClick={() => handleEmailSupplier()} disabled={isSelect} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconMail className="mr-1"></IconMail> {t.mail_to_supplier}
          </button>
          <button onClick={() => handleMailToCustomer()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconMail className="mr-1"></IconMail> {t.mail_to_customer}
          </button>
          <button onClick={() => attach()} title={t.attach} className='btn btn-dark btn-sm hover:btn-dark'><IconAttachment className="fill-white"></IconAttachment> {t.attach}</button>
          <button onClick={() => handleSave()} type="button" className="btn enabled:btn-success disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconSave className="mr-1"></IconSave> {t.btn_save_changes}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button onClick={() => handleConvert()} type="button" className="btn enabled:btn-secondary disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            <IconRefresh className="mr-1"></IconRefresh> {t.convert_to_regular_quote}
          </button>
        </div>

      </div>
      <div className="datatables">
        <DataTable
          noRecordsText="No results match your search query"
          highlightOnHover
          className="table-hover table-compact whitespace-nowrap"
          records={items}
          columns={[
            {
              accessor: 'select',
              title: (
                <Checkbox
                  checked={selected.length === items.length && items.length != 0}
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < items.length
                  }
                  onChange={toggleAll}
                />
              ),
              render: (record) => (
                <Checkbox
                  checked={selected.includes(record)}
                  onChange={() => toggleRow(record)}
                />
              ),
              textAlign: 'center',
              width: 50,
            },
            {
              accessor: 'Cantidad', title: t.quantity,
              render: (record) => (
                <input {...register(`items.${record.CodItem}.amount`)} className="form-input form-input-sm w-20" step="any" type="number"></input>
              )
            },
            {
              accessor: 'DesRepuesto', title: t.description,
              render: (record) => (
                <div className="flex">
                  <input {...register(`items.${record.CodItem}.description`)} type="text" className="form-input form-input-sm ltr:rounded-r-none rtl:rounded-l-none" />
                  <button onClick={() => copyDescription(record.CodItem)} type="button" className="btn btn-dark ltr:rounded-l-none rtl:rounded-r-none">
                    <IconArrowLeft></IconArrowLeft>
                  </button>
                </div>
              )
            },
            {
              accessor: 'DesRepuestoReal', title: t.translate_piece,
              render: (record) => (
                <input {...register(`items.${record.CodItem}.description_real`)} className="form-input form-input-sm" />
              )
            },
            {
              accessor: 'NroParte', title: t.nro_part,
              render: (record) => (
                <input {...register(`items.${record.CodItem}.nro_part`)} type="text" className="form-input form-input-sm" />
              )
            },
          ]}
          minHeight={200}
        />
      </div>
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}