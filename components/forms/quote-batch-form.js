'use client';

import React, { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Select from 'react-select';
import Modal from '@/components/modal';
import { customFormat } from '@/app/lib/format';
import { useDebounce } from 'use-debounce';

import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { useOptionsSelect } from '@/app/options'
import IconFile from '../icon/icon-file';
import IconPrinter from '../icon/icon-printer';
import Link from 'next/link';

const url_search = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/BuscarItemLote';
const url_update_quantity = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarCantidad';

const QuoteBatchForm = ({ t, token, _customer_, _order_ = [], _items_, _tracking_ }) => {



  const [show_modal, setShowModal] = useState(false);
  const modal_content = (null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
  const [items, setItems] = useState([])
  const [order, setOrder] = useState((_order_.length) ? _order_ : null)
  const [customer, setCustomer] = useState(_customer_);

  const brands = useOptionsSelect("brands") || [];
  const [select, setSelect] = useState({})
  const locale = useSelector(getLocale);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm();


  useEffect(() => {
    setOrder(_order_);

  }, [_order_]);

  useEffect(() => {

    updateInputs(items);
  }, [items]);

  useEffect(() => {
    setCustomer(_customer_)
  }, [_customer_]);

  const updateInputs = (items) => {

    items.map((p, index) => (setValue(`items.${index}.Cantidad`, p.Cantidad)));
  }

  const watchedItems = useWatch({ control, name: 'items' });

  const [debouncedItems] = useDebounce(watchedItems, 800);



  useEffect(() => {
    // Solo enviar si hay cambios reales


    if (debouncedItems != undefined) {
      debouncedItems.forEach(async (item, index) => {
        const original = items[index];


        if (item.Cantidad !== original.Cantidad) {
          try {
            const data = {
              Idioma: locale,
              NroOrden: order.NroOrden,
              CodItem: original.CodItem,
              Cantidad: item.Cantidad,
              ValToken: token
            }

            const rs = await axios.post(url_update_quantity, data);

            if (rs.data.estado == 'OK') {

              setOrder(rs.data.dato1[0]);
              setItems(rs.data.dato2);
              updateInputs(rs.data.dato2);
            }

          } catch (error) {

          }
        } else {

        }
      });
    }

  }, [debouncedItems]);

  const onSearch = async (data) => {
    try {

      if (!data.brand) {
        Swal.fire({
          title: t.error,
          text: t.required_select_app,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }


      let normalized = data.batch
        .replace(/\t+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\r\n|\r|\n/g, ' ')
        .trim();


      const data_send = {
        Idioma: locale,
        NroOrden: (order.NroOrden) ?? 0,
        CodCliente: customer.CodCliente,
        NroPedido: (data.nro_order) ?? '',
        MarcaEquipo: data.brand.label,
        NroParte: normalized,
        ValToken: token
      }

      const rs = await axios.post(url_search, data_send);


      if (rs.data.estado == 'OK') {
        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);

        /*
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.set('id', rs.data.dato1[0].NroOrden);
        router.replace(`${pathname}?${nextSearchParams}`);
        */

      }

    } catch (error) {

    }
  }

  const handlerOnChange = (value) => {
    /*
    if (value) {
      setValue('brand', value.value)
      setSelect(value)
    } else {
      setValue('brand', null)
      setSelect({})
    }
    */
    setValue('brand', value);
  }


  const newQuote = () => {
    Swal.fire({
      title: t.question_create_new_quote,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        setOrder([]);
        setItems([]);
        setValue('batch', '');
        setValue('brand', null)
        setSelect(null)
      }
    });


  }

  const showHelp = () => {
    setShowModal(true);
    setModalSize('w-full max-w-5xl');
    //setModalContent();
  }

  return (
    <>
      <div className='panel border mt-8 bg-[#F2F2F2]'>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <textarea name="" id="" {...register("batch", { required: { value: true, message: t.required_field } })} rows={12} className='form-input'></textarea>
            {errors.batch && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.batch?.message?.toString()}</span>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="" className='text-lg font-bold text-blue-600 cursor-pointer' onClick={() => showHelp()}>{t.how_to_copy_items}</label>
            </div>

            <div className="flex sm:flex-row flex-col border-b pb-2 mt-4">
              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.application}:</div>
              <div className="ml-8 flex-1">
                <Controller
                  name="brand"
                  control={control}
                  rules={{ required: { value: true, message: t.required_select } }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      onChange={handlerOnChange}
                      options={brands}
                      placeholder={t.select_option}
                      className="w-full"
                      id="brand-select"
                      instanceId="brand-select"
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                    />
                  )}
                />
                {errors.brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type='button' onClick={handleSubmit(onSearch)} className='btn btn-primary'> {t.search} </button>
            </div>

          </div>

          <div>
            <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
              <div className="relative mt-10 px-6 mb-8">
                <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_quote}:</div>
                    <div className="text-end ml-8 font-bold flex-1"><span className='bg-secondary px-4 py-1 text-xl rounded text-white'>{(order && order?.NroOrden) ? order?.NroOrden : "---"}</span></div>
                  </div>
                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_pedido}:</div>
                    <div className="text-end ml-8 font-bold flex-1">{(order && order.NroPedido) ? order.NroPedido : "---"}</div>
                  </div>
                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">{t.total_weight_lb}</div>
                    <div className="text-end ml-8 font-bold flex-1">{customFormat(((order && order.TotalPeso) ? order.TotalPeso : 0))}</div>
                  </div>
                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">{t.quote_total}</div>
                    <div className="text-end ml-8 font-bold flex-1">{customFormat((order && order.Total) ? order.Total : 0)}</div>
                  </div>

                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_pedido}:</div>
                    <div className="text-end ml-8 font-bold flex-1">
                      <input type='text' autoComplete='OFF' {...register("nro_order", { required: false })} placeholder={t.enter_nro_order} className="form-input border border-dark border-2" />
                    </div>
                  </div>

                </div>

              </div>
            </div>
            <div className='mt-4'>
              {(order && order.NroOrden) &&
                <Link href={`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${order.NroOrden}`} className='text-blue-600 hover:text-blue-800 hover:underline font-bold'>Ir a cotización</Link>
              }
            </div>
          </div>
          <div>
            <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
              {(order) &&
                <div className="relative mt-10 px-6 mb-8">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_items}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.NroItems}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.total_spare_parts}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.TotRepuestos}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.freight}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.FleteInterno}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.tax}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.IvaEnPrecio}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.exchange_rate}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.TipoCambio}</div>
                    </div>
                  </div>

                </div>
              }
            </div>
          </div>
        </div>
      </div>

      {
        (items.length > 0) &&

        <div className="table-responsive">
          <div className="bg-gray-400 p-4">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <button type="button" onClick={() => newQuote()} className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                <IconFile className='mr-2'></IconFile> {t.btn_new}
              </button>
              <button disabled={true} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                <IconPrinter className='mr-2'></IconPrinter> {t.btn_print}
              </button>
            </div>
          </div>
          <table className="bg-white table-hover">
            <thead>
              <tr className="relative !bg-gray-400 text-center uppercase">
                <th></th>
                <th>Item</th>
                <th>{t.qty}</th>
                <th>{t.nro_part}</th>
                <th>{t.description}</th>
                <th>{t.spare_part_type}</th>
                <th>{t.application}</th>
                <th>{t.supplier}/{t.brand}</th>
                <th>{t.price_unit}*</th>
                <th>Total</th>
                <th>{t.indicator}</th>
                <th>{t.t_delivery}**</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, index) => {
                return (
                  <tr key={index} >
                    <td>

                    </td>
                    <td>{i.CodItem}</td>
                    <td>
                      <input
                        step="any" type="number"
                        {...register(`items.${index}.Cantidad`, {
                          valueAsNumber: true
                        })}
                        className="border rounded form-input w-20 border-dark border-2 !p-1 text-xl"
                      />
                    </td>
                    <td>{i.NroParte}</td>
                    <td>{i.DesRepuesto}</td>
                    <td>{i.TipoRepuesto}</td>
                    <td>{i.Aplicacion}</td>
                    <td>{i.Marca}</td>
                    <td>{i.Precio}</td>
                    <td>{i.Total}</td>
                    <td></td>
                    <td>{i.TiEntrega}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={""} content={modal_content}>
        <div>
          <p>{t.help_quote_batch_title}</p>
          <p>{t.help_quote_batch_steps}</p>
          <p>{t.help_quote_batch_step1}</p>
          <p>{t.help_quote_batch_step2}</p>
          <img src="/assets/images/help-quote.jpg" alt="image help quote" className="w-full" />
        </div>
      </Modal>
    </>
  );
};

export default QuoteBatchForm;
