'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useWatch } from "react-hook-form"
import IconDiscount from '../icon/icon-discount';
import Modal from '@/components/modal';
import OptionsItemsQuote from '@/components/forms/options-items-quote'
import OptionsItemsQuoteEmpty from '@/components/forms/options-items-quote-empty'
import DiscountForm from "@/components/forms/discount-form"
import PriceParametersForm from "@/components/forms/price-parameters-form"
import CostSummary from "@/components/cost-summary"
import { customFormat } from '@/app/lib/format';
import { useDebounce } from 'use-debounce';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import IconTrashLines from '../icon/icon-trash-lines';
import IconCheck from '../icon/icon-check';
import IconRefresh from '../icon/icon-refresh';
import TableReference from "@/app/admin/revision/quotes/table-reference"
import DeliveryInstructionsForm from "@/components/forms/delivery-instructions-form"

const url_search = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/BuscarItem';
const url_update_quantity = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/ModificarCantidad';
const url_update_note = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarNotas';
const url_delete_item_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/EliminarItem';
const url_save_freight = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarFleteInterno';
const url_delete_freight = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/EliminarFleteInterno';
const url_more_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/VerOpciones';
const url_price_parameters = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarParamPrecio';
const url_update_item = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ActualizarItem';
const url_add_item = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/ActualizarItem';
const url_search_reference = process.env.NEXT_PUBLIC_API_URL + 'referencia/MostrarReferencia';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import IconDirection from '../icon/icon-direction';

const ConfirmedQuoteForm = ({ t, token, _customer_, _order_ = [], _items_, _tracking_, options_share }) => {


  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
  const [items, setItems] = useState(_items_)
  const [order, setOrder] = useState(_order_)
  const [isSelectItems, setIsSelectItems] = useState(false);
  const [disabledTracking, setDisabledTracking] = useState(true);
  const [quote_or_tracking_option, setQuoteORTrackingOption] = useState();
  const [tracking_option, setTrackingOption] = useState('');
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [customer, setCustomer] = useState(_customer_);

  const tablaRef = useRef(null);
  const locale = useSelector(getLocale);


  const [seleccionados, setSeleccionados] = useState([])

  const toggleSeleccion = (item) => {
    setSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((i) => i.CodItem !== item.CodItem) : [...prev, item]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === items.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(items.map((d) => d))
    }
  }

  const {
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { freight: customFormat(_order_.FleteInterno) } });

  const {
    register: registerSearchQuote,
    getValues: getValuesQuote,
    setValue: setValueQuote,
    control,
    formState: { errors: errorsSearchQuote },
    handleSubmit: handleSearchQuoteFormSubmit
  } = useForm({
    defaultValues: {
      items: items.map(p => ({ Cantidad: 1 }))
    }
  })

  const {
    register: registerNoteQuote,
    getValues: getValuesNoteQuote,
    formState: { errors: errorsNoteQuote },
    handleSubmit: handleSaveNoteQuoteFormSubmit
  } = useForm();

  useEffect(() => {
    setOrder(_order_);
    setValue('freight', customFormat(_order_.FleteInterno));

  }, [_order_]);

  useEffect(() => {
    setCustomer(_customer_)

  }, [_customer_]);

  useEffect(() => {
    if (_tracking_?.Cotizar || _tracking_?.Seguimiento) {
      setAllDisabledTracking(true);
    }
  }, [_tracking_]);

  useEffect(() => {
    setItems(_items_)
    updateInputs(_items_);
  }, [_items_]);

  useEffect(() => {
    if (seleccionados.length > 0) {
      setIsSelectItems(false)
    } else {
      setIsSelectItems(true);
    }
  }, [seleccionados]);

  const updateInputs = (items) => {

    items.map((p, index) => {

      setValueQuote(`items.${p.CodItem}.Cantidad`, p.Cantidad);
    });
  }

  const watchedItems = useWatch({ control, name: 'items' });
  const [debouncedItems] = useDebounce(watchedItems, 800);

  useEffect(() => {
    // Solo enviar si hay cambios reales
    debouncedItems.forEach(async (item, index) => {
      const original = items[index - 1];

      if ((original) && item.Cantidad !== original.Cantidad) {
        try {
          const data = {
            NroOrden: order.NroOrden,
            CodItem: original.CodItem,
            Cantidad: item.Cantidad,
            ValToken: token
          }

          const rs = await axios.post(url_update_quantity, data);

          if (rs.data.estado == 'OK') {
            setOrder(rs.data.dato2[0]);
            setItems(rs.data.dato3);
            updateInputs(rs.data.dato3);
          }

        } catch (error) {

        }
      }
    });
  }, [debouncedItems]);

  useEffect(() => {
    if (order) {
      setValueQuote('nro_order', order.NroPedido);
      setValueQuote('equipment_brand', order.MarcaEquipo);
      setValueQuote('equipment_model', order.ModeloEquipo);
      setValueQuote('equipment_serie', order.NroSerieEquipo);
      setValueQuote('equipment_year', order.AnioEquipo);
      setValueQuote('engine_brand', order.MarcaMotor);
      setValueQuote('engine_model', order.ModeloMotor);
      setValueQuote('engine_serie', order.NroSerieMotor);
    }

  }, [order]);

  const handleChangeOptionShare = (select) => {
    setValue('share_with_customer', (select?.value) ?? 0);
  }

  const onSaveNote = async (data) => {
    try {
      const rs = await axios.post(url_update_note, { NroOrden: order.NroOrden, NotaUsuario: data.note_user, NotaCliente: data.note_customer, ValToken: token });
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_note_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {

        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.save_note_quote_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleSearchQuoteFormSubmit(onSearch)();
    }
  };

  const onSearch = async (data) => {

    Swal.fire({
      text: t.question_update_cofirmed_order,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.accept,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        const data_search = {
          Idioma: locale,
          NroOrden: order.NroOrden,
          CodItem: 0,
          Cantidad: data.quantity,
          NroParte: data.nro_part,
          ValToken: token
        }

        try {
          const rs = await axios.post(url_search, data_search);

          if (rs.data.estado == 'OP') {
            showOptions(rs.data.dato3, data);
          } else if (rs.data.estado == 'OK') {
            if (rs.data.dato3.length == 1) {

              addItem(data, rs.data.dato3[0], rs.data.dato2[0]);
              return;
            } else {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: t.add_item_to_quote_success,
                showConfirmButton: false,
                timer: 1500
              }).then(r => {
                setOrder(rs.data.dato2[0]);
                setItems(rs.data.dato3);
                updateInputs(rs.data.dato3);
              });
            }

          } else if (rs.data.estado == "NC") {

            setOrder(rs.data.dato2[0]);
            setItems(rs.data.dato3);
            updateInputs(rs.data.dato3);

            setModalTitle('');
            setModalSize('w-full max-w-2xl');
            setModalContent(<OptionsItemsQuoteEmpty code={rs.data.dato1} close={() => setShowModal(false)} customer={customer} order={order} token={token} t={t} data={data} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder}></OptionsItemsQuoteEmpty>);
            setShowModal(true);
          }
          setValueQuote('nro_part', '');
          setValueQuote('quantity', '');
        } catch (error) {

        }

      }
    });



  }


  const addItem = async (data, item, order) => {

    const data_add = {
      Idioma: locale,
      NroOrden: (order.NroOrden) ?? 0,
      CodItem: 0,
      CodCliente: customer.CodCliente,
      CodRepuesto: item.CodRepuesto,
      NroParte: (data.nro_part) ?? "",
      NroParteCambio: (data.nro_part) ?? "",
      Cantidad: (data.quantity) ?? "",
      Posicion: (data.position != "") ? data.position : 0,
      NroPedido: (data.nro_order) ?? "",
      MarcaEquipo: (data.equipment_brand) ?? "",
      ModeloEquipo: (data.equipment_model) ?? "",
      AnioEquipo: (data.equipment_year) ?? "",
      NroSerieEquipo: (data.equipment_serie) ?? "",
      MarcaMotor: (data.engine_serie) ?? "",
      ModeloMotor: (data.engine_model) ?? "",
      NroSerieMotor: (data.engine_serie) ?? "",
      ValToken: token

    }

    try {
      const rs = await axios.post(url_add_item, data_add);

      if (rs.data.estado == 'OK') {
        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
        if (order.NroOrden) {
          router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${rs.data.dato1[0].NroOrden}`);
        }
        updateInputs(rs.data.dato2);
      }
    } catch (error) {

    }
  }

  const showOptions = (options, data) => {
    setModalTitle('');
    setModalSize('w-full max-w-5xl')
    setModalContent(<OptionsItemsQuote confirmed={true} close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} options={options} customer={customer} order={order} token={token} t={t} data={data}></OptionsItemsQuote>);
    setShowModal(true);
  }
  const updateItem = async () => {
    try {

      Swal.fire({
        text: t.question_update_cofirmed_order,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.accept,
        cancelButtonText: t.btn_cancel,
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          let data = [];
          seleccionados.map(i => {
            data.push({ Idioma: locale, NroOrden: order.NroOrden, CodItem: i.CodItem, Cantidad: i.Cantidad, NroParte: i.NroParte, ValToken: token });
          });
          const rs = await axios.post(url_update_item, data);
          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.update_item_success,
              showConfirmButton: false,
              timer: 1500
            });

            setOrder(rs.data.dato1[0]);
            setItems(rs.data.dato2);
            setSeleccionados([]);
          }
        }
      });

    } catch (error) {

    }
  }


  const discount = () => {
    setModalTitle('');
    setModalSize('w-full max-w-lg');
    setModalContent(<DiscountForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></DiscountForm>);
    setShowModal(true);
  }

  const saveFreight = async () => {
    Swal.fire({
      title: t.updating,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const freight = getValues('freight');
    try {
      const rs = await axios.post(url_save_freight, { Idioma: locale, NroOrden: order.NroOrden, FleteInterno: freight, ValToken: token });
      Swal.close();

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_freight_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          //setValue('freight', freight.toFixed(2));
        });
      } else if (rs.data.estado == 'Error') {
        Swal.fire({
          title: t.error,
          text: rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.save_freight_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.save_freight_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const deleteFreight = async () => {
    Swal.fire({
      title: t.question_delete_freight,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_distribute,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_delete_freight, { Idioma: locale, NroOrden: order.NroOrden, CodCliente: customer.CodCliente, ValToken: token });
          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delete_freight_success,
              showConfirmButton: false,
              timer: 1500
            }).then(async (r) => {

            });
          } else {
            Swal.fire({
              title: t.error,
              text: t.delete_freight_error,
              icon: 'error',
              confirmButtonColor: '#dc2626',
              confirmButtonText: t.close
            });
          }
        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.delete_freight_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  }

  const showMore = async (item) => {


    try {
      const rs = await axios.post(url_more_quote, { NroOrden: order.NroOrden, CodCliente: customer.CodCliente, NroParte: item.NroParte, Cantidad: item.Cantidad, ValToken: token });
      if (rs.data.estado == 'OK') {
        let data = getValuesQuote();
        data.nro_part = item.NroParte.replace(/\s+/g, "").replace(/\*/g, "");
        data.quantity = getValuesQuote(`items.${item.CodItem}.Cantidad`)
        data.position = item.CodItem;


        setModalTitle('');
        setModalSize('w-full max-w-5xl')
        setModalContent(<OptionsItemsQuote
          close={() => setShowModal(false)}
          updateInputs={updateInputs}
          setItems={setItems}
          setOrder={setOrder}
          options={rs.data.dato2}
          customer={customer}
          order={order}
          token={token}
          item_select={item}
          t={t}
          data={data}
          confirmed={true}
          changePrice={true}
        ></OptionsItemsQuote>);
        setShowModal(true);
      }
    } catch (error) {

    }
  }

  /*
  const selectItem = (e, item) => {
    if (e.target.checked) {
      setSelectItems(prevArray => [...prevArray, item]);
    } else {

      setSelectItems(() => {
        return select_items.filter((i) => {
          return item.CodItem != i.CodItem;
        });
      });

    }
  }
  */

  const deleteItems = async () => {

    Swal.fire({
      text: t.question_update_cofirmed_order,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.accept,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let data = [];
          seleccionados.map(i => {
            data.push({ Idioma: locale, NroOrden: order.NroOrden, CodItem: i.CodItem, ValToken: token });
          });
          const rs = await axios.post(url_delete_item_quote, data);

          if (rs.data.estado == 'OK') {
            setOrder(rs.data.dato2[0]);
            setItems(rs.data.dato3);
            updateInputs(rs.data.dato3);
          }


        } catch (error) {

        }
      }
    });

  }

  const priceParameters = async () => {
    try {
      const rs = await axios.post(url_price_parameters, { NroOrden: order.NroOrden, ValToken: token });
      if (rs.data.estado == 'OK') {
        setModalSize('w-full max-w-lg');
        setModalTitle('');
        setModalContent(<PriceParametersForm
          close={() => setShowModal(false)}
          updateInputs={updateInputs}
          setItems={setItems}
          setOrder={setOrder}
          customer={customer}
          order={order}
          token={token}
          default_value={rs.data.dato}
          t={t}
          data={[]}
        ></PriceParametersForm>);
        setShowModal(true);
      }
    } catch (error) {

    }

  }

  const costSummary = () => {

    setModalTitle('');
    setModalContent(<CostSummary
      close={() => setShowModal(false)}
      order={order}
      token={token}
      t={t}
    ></CostSummary>);
    setShowModal(true);
  }




  const showReference = async (item) => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });



    try {
      const NroParte = (item.NroParte.replace(/\s+/g, "").replace(/\*/g, ""));
      const rs = await axios.post(url_search_reference, { NroParte: NroParte, CodMarca: 0, ValToken: token });

      if (rs.data.estado == "OK") {
        setShowModal(true);
        setModalSize('w-full max-w-6xl');
        setModalTitle(t.reference_part_change);
        let references = rs.data.dato1;
        let options = rs.data.dato2;
        setModalContent(<TableReference NroParte={NroParte} t={t} items={references} options={options} token={token} close={() => setShowModal(false)} quote_id={order.NroOrden}></TableReference>)
        Swal.close();
      }
    } catch (error) {

    }
  }

  const instructions = () => {
    setShowModal(true);
    setModalContent(<DeliveryInstructionsForm action_cancel={() => setShowModal(false) } order_id={order.NroOrden} token={token} t={t}></DeliveryInstructionsForm>);
  }




  return (
    <>
      <div className='panel border mt-8 bg-[#F2F2F2]'>
        <div className="grid grid-cols-2 gap-4">
          <form action="" onSubmit={handleSearchQuoteFormSubmit(onSearch)}>
            <fieldset>
              <legend className='space-y-1'>{ t.btn_search }</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className='space-y-1'>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nro_part">{ t.nro_part }</label>
                    <div className="relative flex-1">
                      <input onKeyDown={handleKeyDown} type='text' autoComplete='OFF' {...registerSearchQuote("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errorsSearchQuote.nro_part ? "true" : "false"} placeholder={t.enter_nro_part} className="form-input form-input-sm placeholder:" />
                      {errorsSearchQuote.nro_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsSearchQuote.nro_part?.message?.toString()}</span>}
                    </div>
                  </div>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="quantity">{ t.amount }</label>
                    <div className="relative flex-1">
                      <input onKeyDown={handleKeyDown} type='text' autoComplete='OFF' {...registerSearchQuote("quantity", { required: { value: true, message: t.required_field } })} aria-invalid={errorsSearchQuote.quantity ? "true" : "false"} placeholder={t.enter_quantity} className="form-input form-input-sm placeholder:" />
                      {errorsSearchQuote.quantity && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsSearchQuote.quantity?.message?.toString()}</span>}
                    </div>
                  </div>

                </div>

                <div className='space-y-1'>
                  <div className="flex sm:flex-row flex-col">
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <button type="button" onClick={handleSearchQuoteFormSubmit(onSearch)} className='btn btn-primary'>{t.btn_search}</button>
                    </div>
                  </div>

                </div>
              </div>
            </fieldset>
          </form>

          <form action="">
            <fieldset>
              <legend></legend>
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                <div className="relative mt-2 px-8 mb-2">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex sm:flex-row flex-col border-b">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_quote}:</div>
                      <div className="text-end ml-8 font-bold flex-1"><span className=''>{order?.NroOrden}</span></div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.total_weight_lb }</div>
                      <div className="text-end ml-8 font-bold flex-1">{customFormat(order?.TotalPeso)}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.quote_total }</div>
                      <div className="text-end ml-8 font-bold flex-1">{customFormat(order?.Total)}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.nro_items }</div>
                      <div className="text-end ml-8 font-bold flex-1">{order?.NroItems}</div>
                    </div>
                  </div>

                </div>
              </div>



            </fieldset>
          </form>
        </div>


      </div>
      {(order?.NroOrden) &&
        <div>
          <div className="bg-gray-300 py-4 mt-4">
            <div className="px-4 grid grid-cols-12 gap-2">

              <div className="flex flex-wrap gap-2 col-span-4">
                <button onClick={() => updateItem()} title={ t.update } className='btn btn-sm hover:btn-dark' disabled={isSelectItems}><IconRefresh></IconRefresh></button>
                <button onClick={() => deleteItems()} title={ t.delete } className='btn btn-sm hover:btn-dark' disabled={isSelectItems}><IconTrashLines></IconTrashLines></button>
                <button onClick={() => discount()} title={ t.add_discount } className='btn btn-sm hover:btn-dark'><IconDiscount></IconDiscount></button>
              </div>


              <div className="flex flex-wrap items-center justify-end gap-2 col-span-4">
                <button onClick={() => instructions() }className='btn btn-sm btn-dark' type='button'>{ t.delivery_instruction }</button>
                <button onClick={() => costSummary()} className='btn btn-sm btn-dark' type='button'>{ t.cost_summary }</button>
              </div>
            </div>
          </div>
          <div className="border-0 p-0">
            <div className="table-responsive">
              <table className="bg-white table-hover table-compact" ref={tablaRef}>
                <thead>
                  <tr className="relative !bg-gray-400 text-center uppercase">
                    <th className='w-1 !p-2'>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="border border-dark border-1 bg-white form-checkbox !mr-0"
                          checked={seleccionados.length === items.length}
                          onChange={toggleTodos}
                        />
                      </label>
                    </th>
                    <th className='w-1 !p-0'>Item</th>
                    <th className='w-1'>{ t.qty }</th>
                    <th className='whitespace-nowrap'>{ t.nro_part }</th>
                    <th>{ t.description }</th>
                    <th>{ t.weight_unit }</th>
                    <th>{ t.spare_part_type }</th>
                    <th>{ t.application }</th>
                    <th>{ t.brand }</th>
                    <th>{ t.price_unit }</th>
                    <th>Total</th>
                    <th>{ t.indicator }</th>
                    <th>{ t.t_delivery }</th>
                    <th>{ t.days_of_validity }</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className='!p-2'>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="border border-dark border-1 form-checkbox !mr-0"
                              checked={seleccionados.includes(item)}
                              onChange={() => toggleSeleccion(item)}
                            />
                          </label>
                        </td>
                        <td className='!p-0 text-center'>{item.CodItem}</td>
                        <td>

                          <input
                            step="any" type="number"
                            {...registerSearchQuote(`items.${item.CodItem}.Cantidad`, {
                              valueAsNumber: true
                            })}
                            className="border text-center rounded form-input w-20 border-dark border-2 !p-1 text-xl"
                          />

                        </td>
                        <td className='whitespace-nowrap'>{(item.NroParte.includes("*")) ? <button onClick={() => showReference(item)} className="btn btn-sm btn-outline-info font-bold">{item.NroParte}</button> : item.NroParte}</td>
                        <td>{item.DesRepuesto}</td>
                        <td className='text-end'>{customFormat(item.Peso)}</td>
                        <td>{item.TipoRepuesto}</td>
                        <td>{item.Aplicacion}</td>
                        <td>{item.Marca}</td>
                        <td className='text-end'>{customFormat(item.Precio)}</td>
                        <td className='text-end'>{customFormat(item.Total)}</td>
                        <td>
                          {(item.VerMas) &&
                            <button onClick={() => showMore(item)} className='btn btn-sm btn-secondary' type="button">{item.VerMas}</button>
                          }
                        </td>
                        <td>{item.TiEntrega}</td>
                        <td>{item.Dias}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-[#F2F2F2] p-5 border shadow-lg">
            <div>
              <div>
                <label htmlFor="Email">{ t.note_to_customer }</label>
                <div className="relative text-white-dark">
                  <textarea defaultValue={order.NotaCliente} className='form-input' {...registerNoteQuote(`note_customer`, { required: { value: true, message: t.required_field } })} rows="4">
                  </textarea>
                  {errorsNoteQuote.note_customer && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsNoteQuote.note_customer?.message?.toString()}</span>}
                </div>
              </div>
              <div>
                <label htmlFor="Email">{ t.note_to_user }</label>
                <div className="relative text-white-dark">
                  <div className="relative text-white-dark">
                    <textarea defaultValue={order.NotaUsuario} className='form-input' {...registerNoteQuote(`note_user`, { required: { value: true, message: t.required_field } })} rows="4">
                    </textarea>
                    {errorsNoteQuote.note_user && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsNoteQuote.note_user?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button className='btn btn-sm btn-dark' type="button" onClick={handleSaveNoteQuoteFormSubmit(onSaveNote)}>{ t.save_notes }</button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-md bg-white text-center shadow-lg dark:bg-[#1c232f]">
              <div className="mt-6 p-5 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.total_spare_parts }:</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.TotRepuestos)}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.freight }</div>

                  <div className='text-end ml-8 font-bold flex-1'>
                    <div className="flex justify-items-end justify-end">
                      <button type="button" onClick={() => saveFreight()} className={`btn btn-sm btn-outline-dark ${(order.FleteInterno > 0) ? 'ltr:rounded-r-none rtl:rounded-l-none' : 'ltr:rounded-r-none rtl:rounded-l-none'}  group/item`}>
                        <IconCheck className='fill-success group-hover/item:fill-white'></IconCheck>
                      </button>
                      {(order.FleteInterno > 0) &&
                        <button type="button" onClick={() => deleteFreight()} className="btn btn-sm btn-outline-dark rounded-none ltr:border-l-0 rtl:border-r-0 group/item">
                          <IconDirection className='fill-black group-hover/item:fill-white'></IconDirection>
                        </button>
                      }
                      <input {...register(`freight`, { required: { value: true, message: t.required_field } })} type="text" placeholder="" className="text-end text-sm form-input ltr:rounded-l-none rtl:rounded-r-none w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.discount }</div>
                  <div className="text-end ml-8 font-bold flex-1">{(order.Descuento) ? (`- ${customFormat(order.Descuento)}`) : '0.00'}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.tax }</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.MtoIva)}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">Total $us</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.Total)}</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      }
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default ConfirmedQuoteForm;
