'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import Select from 'react-select';
import IconTrashLines from '../icon/icon-trash-lines';
import IconPlusCircle from '../icon/icon-plus-circle';
import EquipmentForm from '@/components/forms/equipment-form'
import EngineForm from '@/components/forms/engine-form'
import Modal from '@/components/modal';
import { useOptionsSelect } from '@/app/options'
import { useRouter } from 'next/navigation';
import axios from 'axios'
import Swal from 'sweetalert2'

const url_save_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarCotSinCod';
const url_get_lists = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarListasDesplegables';


const QuoteWithoutCodeForm = ({ _customer_, t, token, _order_ = [], _items_ }) => {

  const router = useRouter();

  const [order, setOrder] = useState(_order_)
  const [customer, setCustomer] = useState(_customer_);
  const brands = useOptionsSelect("brands") || [];
  const [current_row, setCurrentRow] = useState(1);
  const [items, setItems] = useState(_items_)
  const [disabled, setDisabled] = useState((order.NroOrden) ? false : true);

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl');
  const [select_equipment, setSelectEquipment] = useState(null);
  const [select_engine, setSelectEngine] = useState(null);

  const [disabledTracking, setDisabledTracking] = useState(true);
  const [quote_or_tracking_option, setQuoteORTrackingOption] = useState();
  const [tracking_option, setTrackingOption] = useState('');
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [options_share, setOptionsShare] = useState([]);

  let cancelTokenSource = null;

  useEffect(() => {
    setOrder(_order_);
    if (_order_.NroOrden) {
      setShowModal(false);
      setDisabled(false);
      let _select = () => {
        return brands.filter((b) => {
          return b.label == _order_.MarcaEquipo;
        })[0];
      };
      setSelectEquipment(_select);
      setValue('nro_order', _order_.NroPedido)
      setValue('equipment_model', _order_.ModeloEquipo);
      setValue('equipment_serie', _order_.NroSerieEquipo);

      setSelectEngine(() => {
        return brands.filter((b) => {
          return b.label == _order_.MarcaMotor;
        })[0];
      });
      setValue('engine_model', _order_.ModeloMotor);
      setValue('engine_serie', _order_.NroSerieMotor);
      setValue('note', (_order_.NotaCliente) ?? "");
      getLists();

    }
  }, [_order_]);

  useEffect(() => {
    setCustomer(_customer_)
  }, [_customer_]);

  useEffect(() => {
    setItems(_items_);
    setCurrentRow((_items_.lenght + 1));
  }, [_items_]);


  const getLists = async () => {
    try {
      if (cancelTokenSource) {
        cancelTokenSource.cancel('Cancelado por nueva solicitud');
      }
      cancelTokenSource = axios.CancelToken.source();

      const rs = await axios.post(url_get_lists, { NroOrden: order.NroOrden, ValToken: token }, { cancelToken: cancelTokenSource.token });

      if (rs.data.estado == 'OK') {
        let _options_share = [];
        rs.data.dato1.map(s => {
          _options_share.push({ value: s.CodUsuario, label: s.NomUsuario })
        });

        setOptionsShare(_options_share);
      }
    } catch (error) {
      if (axios.isCancel(error)) {

      } else {

      }
    }
  }



  const {
    register,
    handleSubmit, setValue, getValues, unregister,
    formState: { errors },
  } = useForm();

  useEffect(() => {

    if (disabled && !order.NroOrden) {

      showModal('equipment');
    }
  }, []);

  const generateInitRows = () => {
    let _rows = [];
    for (let i = 1; i <= 5; i++) {
      _rows.push({ CodItem: i, Cantidad: 1, DesRepuesto: "" });
    }
    setItems(_rows);
    setCurrentRow(6);
  }


  const setDataEquipment = (data, select_brand) => {
    setValue('equipment_model', data.equipment_model);
    setValue('equipment_serie', data.equipment_serie);
    setValue('equipment_brand', (select_brand?.value) ?? null);
    setSelectEquipment(select_brand)
  }

  const setDataEngine = (data, select_brand) => {
    setValue('engine_model', data.engine_model);
    setValue('engine_serie', data.engine_serie);
    setValue('engine_brand', (select_brand?.value) ?? null);
    setSelectEngine(select_brand);
    setDisabled(false);
    generateInitRows();
  }
  const onChangeSelectEquipmentBrand = (value) => {
    setValue('equipment_brand', (value.value) ?? null);
    setSelectEquipment(value);
  }
  const onChangeSelectEngineBrand = (value) => {
    setValue('engine_brand', (value.value) ?? null)
    setSelectEngine(value);
  }

  const showModal = (type) => {



    setModalSize('w-full max-w-lg');
    if (type == 'equipment') {
      setModalTitle(t.equipment_data);
      setModalContent(<EquipmentForm t={t} brands={brands} setDataEquipment={setDataEquipment} setSelectEquipment={setSelectEquipment} showModal={showModal} ></EquipmentForm>);
    } else if (type == 'engine') {
      setModalTitle(t.engine_data);
      setModalContent(<EngineForm t={t} brands={brands} setDataEngine={setDataEngine} showModal={showModal} close={() => setShowModal(false)} ></EngineForm>);
    }

    setShowModal(true);

  }




  const addRow = () => {

    setItems([...items, { CodItem: (current_row), Cantidad: 1, DesRepuesto: '' }])
    setCurrentRow(current_row + 1);
  }

  const deleteRow = (row) => {
    let _rows = items.filter((r, index) => {
      return row.CodItem != r.CodItem
    });
    setItems(_rows);
    unregister(`data[${row.CodItem}][amount]`);
    unregister(`data[${row.CodItem}][description]`);
  }

  const handleChangeOption = (option) => {
    setQuoteORTrackingOption(option.target.value);
    if (option.target.value == 'quote') {
      setDisabledTracking(true);
    } else {
      setDisabledTracking(false);
    }
  }

 

  const handleChangeOptionShare = (select) => {
    setValue('share_with_customer', (select?.value) ?? 0);
  }

  const apply = async () => {
    let customer_id = getValues('share_with_customer') || null;


    if (!quote_or_tracking_option) {
      Swal.fire({
        title: t.error,
        text: t.quote_or_tracking_option_empty,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    } else {
      try {
        const data = {
          NroOrden: order.NroOrden,
          CodUsuarioRegistra: customer.CodCliente,
          CodUsuarioCompartido: (customer_id) ?? 0,
          Cotizar: (quote_or_tracking_option == "quote") ? 1 : 0,
          Seguimiento: (quote_or_tracking_option == "tracking") ? 1 : 0,
          WhatsAp: (tracking_option == 'wp') ? 1 : 0,
          Mail: (tracking_option == 'email') ? 1 : 0,
          NotaUsuario: getValuesNoteQuote('note_user'),
          ValToken: token

        }
        const rs = await axios.post(url_save_tracking, data);

        if (rs.data.estado == 'Ok') {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.tracking_option_success,
            showConfirmButton: false,
            timer: 1500
          });
          setAllDisabledTracking(true);
        }
      } catch (error) {

      }
    }
  }

  const quote = async () => {

    //
    if (!select_engine?.label && !select_equipment?.label) {
      Swal.fire({
        title: t.info,
        text: t.we_need_more_data_quote,
        icon: 'info',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    try {
      let data = getValues();
      let data_send = [];

      if (items.length == 0) {
        Swal.fire({
          title: t.info,
          text: t.items_empty_quote,
          icon: 'info',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }


      let pos = 1;
      data.data.map((d, index) => {
        if (d.amount == undefined || d.amount < 1) {
          Swal.fire({
            title: t.info,
            text: `${t.the_quantity_item} #${pos} ${t.must_be_greater}`,
            icon: 'info',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }

        if (d.description == undefined || d.description == '') {
          Swal.fire({
            title: t.info,
            text: `${t.the_description_item} #${pos} ${t.cannot_be_empty}`,
            icon: 'info',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }
        pos++;
        
        data_send.push({
          NroOrden: (order.NroOrden) ?? 0,
          CodCliente: customer.CodCliente,
          NroPedido: data.nro_order,
          MarcaEquipo: (select_equipment?.label) ?? "",
          ModeloEquipo: data.equipment_model,
          //AnioEquipo: 2010,
          NroSerieEquipo: data.equipment_serie,
          MarcaMotor: (select_engine?.label) ?? "",
          ModeloMotor: data.engine_model,
          NroSerieMotor: data.engine_serie,
          Nota: (data.note) ?? '',
          Cantidad: d.amount,
          Descripcion: d.description,
          ValToken: token

        });
      });



      const rs = await axios.post(url_save_quote, data_send);


      if (rs.data.estado == 'Ok') {
        Swal.fire({
          title: `${t.your_quote_number} #${rs.data.dato}`,
          html: `<p>${t.we_are_in_the_process_of_identifying}</p>${t.we_will_send_you_a_message}<p></p>`,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        }).then(async (r) => {
          router.push(`/admin/revision/orders-process?customer=${customer.CodCliente}&option=quotes`);
        });
      } else {
        Swal.fire({
          title: t.error,
          html: `${t.update_quote_error} <br/> <strong>"${rs.data.mensaje}"</strong>`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {

    }
  }

  return (
    <>
      <h2 className='text-center font-bold text-lg'>{ t.help_with_information }</h2>
      <form action="">
        <div className='panel border mt-8 bg-[#F2F2F2]'>
          <fieldset>
            <legend></legend>
            <div className="grid grid-cols-3 gap-4 bg-gray-400">
              <div className=''>
                <div className="flex sm:flex-row items-center flex-col pt-3 pb-3">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end text-black" htmlFor="nro_order">{ t.nro_pedido }</label>
                  <div className="relative flex-1">
                    <input type='text' disabled={disabled} autoComplete='OFF' {...register("nro_order", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_order ? "true" : "false"} placeholder={t.enter_nro_order} className="form-input placeholder:" />
                    {errors.nro_order && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_order?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="col-span-2 bg-gray-300 gap-4 p-4">
                {(order.NroOrden) &&
                  <div className="grid grid-cols-2">
                    <div>
                      <div className="flex sm:flex-row flex-col items-center">
                        <label className="mb-0 sm:w-2/5 sm:ltr:mr-4 rtl:ml-2 text-end text-blue-800">{t.nro_quote}</label>
                        <div className="relative flex-1 text-blue-800 font-bold text-lg">
                          {order.NroOrden}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex sm:flex-row flex-col items-center">
                        <label className="mb-0 sm:w-2/5 sm:ltr:mr-4 rtl:ml-2 text-end text-blue-800">{ t.nro_items }</label>
                        <div className="relative flex-1 text-blue-800 font-bold text-lg">
                          {order.NroItems}
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
              <div className="space-y-4">
                <h3 className='font-bold text-center'>{ t.equipment_data }</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select options={brands} value={select_equipment} onChange={onChangeSelectEquipmentBrand} isDisabled={disabled} placeholder={t.select_option} className='w-full form-select-sm' />
                  </div>
                  <div className='block'>
                    {errors.equipment_brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_brand?.message?.toString()}</span>}
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_model">{ t.model }</label>
                  <div className="relative flex-1">
                    <input type='text' disabled={disabled} autoComplete='OFF' {...register("equipment_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_model ? "true" : "false"} placeholder={t.enter_equipment_model} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_serie">{ t.equipment_serie }</label>
                  <div className="relative flex-1">
                    <input disabled={disabled} type='text' autoComplete='OFF' {...register("equipment_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_serie ? "true" : "false"} placeholder={t.enter_equipment_serie} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-center">{ t.engine_data }</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_brand">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select value={select_engine} isDisabled={disabled} tabIndex="2" placeholder={t.select_option} className='w-full form-select-sm' options={brands} onChange={onChangeSelectEngineBrand} />
                  </div>
                  <div className='block'>
                    {errors.engine_brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_brand?.message?.toString()}</span>}
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_model">{ t.model }</label>
                  <div className="relative flex-1">
                    <input disabled={disabled} type='text' autoComplete='OFF' {...register("engine_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_model ? "true" : "false"} placeholder={t.enter_engine_model} className="form-input form-input-sm placeholder:" />
                    {errors.engine_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_serie">{ t.engine_serie }</label>
                  <div className="relative flex-1">
                    <input disabled={disabled} type='text' autoComplete='OFF' {...register("engine_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_serie ? "true" : "false"} placeholder={t.enter_engine_serie} className="form-input form-input-sm placeholder:" />
                    {errors.engine_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>
              {(order.NroOrden) &&
                <div className="space-y-4 rounded-md bg-white text-center shadow dark:bg-[#1c232f] mt-4 p-4">

                  <div className="flex w-full gap-4 my-6 items-center justify-center">
                    <div>
                      <label className="inline-flex">
                        <input onChange={handleChangeOption} type="radio" name="option" value={'quote'} disabled={all_disabled_tracking} className="form-radio" />
                        <span>{ t.btn_quote }</span>
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex">
                        <input onChange={handleChangeOption} type="radio" name="option" value={'tracking'} disabled={all_disabled_tracking} className="form-radio" />
                        <span>{ t.follow }</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="country">{ t.share_with }</label>
                    <div className="">
                      <div className='flex'>
                        <Select
                          options={options_share}
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
                          { t.apply }
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              }
            </div>

            <div className="mt-4 text-start">
              <div className="flex sm:flex-row flex-col items-center">
                <label className="mb-0 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="note">{t.note}</label>
                <div className="relative flex-1">
                  <input type='text' autoComplete='OFF' {...register("note", { required: false })} placeholder={t.enter_note} className="form-input placeholder:" />
                </div>
              </div>
            </div>

          </fieldset>


        </div>
        {(items) &&
          <div>

            <table className="min-w-full border text-sm text-left">
              <thead>
                <tr className="relative !bg-gray-400 text-center uppercase">
                  <th className="w-24">Nro.</th>
                  <th className="w-24">{  t.amount } </th>
                  <th className="">{ t.part_description }</th>
                  <th className="flex items-center w-1">
                    <button onClick={() => addRow()} type="button" title="Agregar" className="btn btn-sm m-auto btn-primary  p-1 "><IconPlusCircle className='mr-2' />{t.btn_add}</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, index) => {

                  return (

                    <tr key={index}>
                      <td className="!p-1">
                        {index + 1}
                      </td>
                      <td className="!p-1">
                        <input step="any" type='number' defaultValue={r.Cantidad} autoComplete='OFF' {...register(`data[${r.CodItem}][amount]`, { required: false })} className="form-input border border-1 border-black placeholder:" />
                      </td>
                      <td className="!p-1">
                        <input type='text' defaultValue={r.DesRepuesto} autoComplete='OFF' {...register(`data[${r.CodItem}][description]`, { required: false })} className="form-input border border-1 border-black placeholder:" />
                      </td>
                      <td>
                        {(index > 0) &&
                          <div className="mx-auto flex w-max items-center gap-2">
                            <ul className='flex items-center gap-2'>
                              <li onClick={() => deleteRow(r)}>
                                <button className="btn btn-sm btn-danger" type='button' title={t.delete}>
                                  <IconTrashLines />
                                </button>
                              </li>
                            </ul>
                          </div>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" onClick={() => quote()} className="btn btn-success" >
                { t.btn_quote }
              </button>

            </div>

          </div>
        }
      </form>
      <Modal show_close_button={false} size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>

    </>
  );
};

export default QuoteWithoutCodeForm;
