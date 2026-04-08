'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useForm } from "react-hook-form"
import DivideQuantity from "@/app/admin/purchase-order/divide-quantity"
import MailForm from "@/app/admin/purchase-order/MailForm"
import ChangeSupplier from "@/app/admin/purchase-order/change-supplier"
import BtnPrintProforma from "@/components/BtnPrintProforma"
import dynamic from 'next/dynamic';
const PdfViewerOrder = dynamic(() => import('@/app/admin/purchase-order/PdfViewerOrder'), {
  ssr: false,
});

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const url_generate = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/GenerarOrdCompra';
const url_validate = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/ValidarOpcionPrv';
const url_update_order = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/ActualizarDatOrdenCompra';
const url_print_proforma = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/BorradorOrdenCompra';



import { customFormat } from '@/app/lib/format';
import Modal from '@/components/modal';
import { useRouter } from 'next/navigation';

const PurchaseOrderDetails = ({ CadNroOrden, token, t, order, setOrder, items, setItems, contact, setReload }) => {

  const router = useRouter();

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
  const [show_close_button, setShowCloseModal] = useState(true);
  const [bk_items, setBackupItems] = useState(items);
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { others: customFormat(order.MtoOtros), shipping: customFormat(order.MtoShipping) } });

  const [selected, setSelected] = useState([]);
  const [isSelect, setIsSelect] = useState(false);

  const toggleSelect = (item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i.NroOrden !== item.NroOrden) : [...prev, item]
    )
  }

  const toggleAll = () => {
    if (selected.length === items.length) {
      setSelected([])
    } else {
      setSelected(items.map((d) => d))
    }
  }

  useEffect(() => {
    if (selected.length > 0) {
      setIsSelect(false)
    } else {
      setIsSelect(true);
    }
  }, [selected]);

  const divideQuantity = async () => {
    let isDivisible = true;
    let quantity = 1;
    selected.map((i, index) => {
      quantity = Number(getValues(`items.${index}.quantity_purchased`));

      if (quantity == 1 && i.CantFaltante == 1) {
        isDivisible = false;
      }
    });

    if (!isDivisible) {
      Swal.fire({
        title: t.error,
        text: t.not_disisible,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    if (selected[0]?.isDivide == 1) {
      Swal.fire({
        title: t.error,
        text: `${t.has_already_been_divided}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    } else {

      const valid = await validate(selected[0].NroParteCompra);

      if (valid) {
        setModalTitle(t.divide_quantity);
        setModalSize('w-full max-w-xl');
        setShowCloseModal(true);
        setModalContent(<DivideQuantity close={() => setShowModal(false)} t={t} item={selected[0]} items={items} setItems={setItems}></DivideQuantity>);
        setShowModal(true);
      }
    }
  }

  const validate = async (NroParte) => {
    try {
      const rs = await axios.post(url_validate, { NroParte: NroParte, ValToken: token });
      
      if (rs.data.estado == "Ok") {
        return true;
      } else {
        Swal.fire({
          title: t.error,
          text: `${t.empty_suppliers}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return false;
      }
    } catch (error) {
      
    }
  }

  const changeSupplier = async () => {
    const valid = await validate(selected[0].NroParteCompra);

    if (valid) {
      setModalTitle(t.change_supplier);
      setModalSize('w-full max-w-5xl');
      setShowCloseModal(true);
      setModalContent(<ChangeSupplier setReload={setReload} setSelectedItems={setSelected} CadNroOrden={CadNroOrden} close={() => setShowModal(false)} t={t} token={token} item={selected[0]} items={items} setItems={setItems}></ChangeSupplier>);
      setShowModal(true);
    }
  }

  useEffect(() => {
    items.map((i, index) => {
      setValue(`items.${index}.quantity_purchased`, i.CantComprada);
      setValue(`items.${index}.real_cost`, customFormat(i.CostoReal));
    })
  }, [items]);

  const showEmails = (order_id) => {
    setModalTitle('');
    setModalSize('w-full max-w-3xl');
    setShowCloseModal(false);
    setModalContent(<MailForm close={() => updateList()} print={print} t={t} token={token} order={order} order_id={order_id}></MailForm>);
    setShowModal(true);
  }

  const print = (order_id) => {
    setShowModal(true)
    setModalSize('w-full max-w-2xl');
    setShowCloseModal(false);
    let order = { NroOrdenCompra: order_id };
    setTimeout(() => {
      setModalContent(
        <PdfViewerOrder
          order={order}
          token={token}
          onClose={() => {
            setShowModal(false);
            showEmails(order_id);
            //updateList();
          }}
        />
      );
    }, 300);


  }

  const updateList = () => {
    window.location.reload();
  };

  const generateOrder = async () => {
    try {
      let data_send = [];
      let CadOrdenCompra = [];

      selected.forEach(i => {
        CadOrdenCompra.push(i.NroOrden);
      });

      const CadNroOrden = [...new Set(CadOrdenCompra)].join(",");
      let different_quantities = false;
      const data = getValues();

      selected.forEach((i) => {

        const itemIndex = items.findIndex(
          item => item.CodItem === i.CodItem
        );

        if (itemIndex === -1) return;

        const CantComprada = getValues(
          `items.${itemIndex}.quantity_purchased`
        );

        data_send.push({
          NomPrv: order.NomPrv,
          CadNroOrden,
          NumOrdCompra: 0,
          MtoShipping: data.shipping,
          MtoOtros: data.others,
          CodRepuesto: i.CodRepuesto,
          CodItem: i.CodItem,
          NroOrden: i.NroOrden,
          NroParteCliente: i.NroParteCliente,
          NroParteCompra: i.NroParteCompra,
          Descripcion: i.Descripcion,
          CantFaltante: i.CantFaltante,
          CantComprada,
          CostoSistema: i.CostoSistema,
          CostoReal: i.CostoReal,
          OrigenCompra: i.OrigenCompra,
          ValToken: token
        });

        if (CantComprada < i.CantFaltante) {
          different_quantities = true;
        }
      });

      if (different_quantities) {
        Swal.fire({
          title: t.error,
          text: t.different_quantities_purchase_order,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }
      const rs = await axios.post(url_generate, data_send);

      if (rs.data.estado === 'Ok') {
        print(rs.data.dato);
      }

    } catch (error) {
      console.error(error);
    }
  };

  const resetOrder = () => {
    setItems(bk_items);
    setSelected([]);
    setValue('others', order.MtoOtros);
    setValue('shipping', order.MtoShipping);
  }
  const handleUpdate = async () => {

    try {
      let data_send = [];
      items.map((item, index) => {
        data_send.push({
          NumOrdCompra: (order.NroOrden) || 0,
          MtoShipping: getValues('shipping') || 0,
          MtoOtros: getValues('others') || 0,
          CodRepuesto: 10,
          CodItem: item.CodItem,
          NroOrden: (item.NroOrden) || 0,
          CantComprada: getValues(`items.${index}.quantity_purchased`) || 0,
          CostoSistema: item.CostoSistema || 0,
          CostoReal: getValues(`items.${index}.real_cost`) || 0,
          ValToken: token
        })
      });

      const rs = await axios.post(url_update_order, data_send);
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.record_updated,
          confirmButtonText: t.close
        })
      }

    } catch (error) {

    }
  }

  return (
    <>
      <div className='flex justify-end my-4'>
        <button onClick={setOrder} className='btn btn-outline-dark'>{t.back}</button>
      </div>
      <div className="relative grid grid-cols-2 gap-4 overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
        <div className="relative mt-10 px-6 mb-8">
          <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
            <div className="flex sm:flex-row flex-col border-b pb-2">
              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.supplier}:</div>
              <div className="text-end ml-8 font-bold flex-1">{order.NomPrv}</div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_purchase_order}</div>
              <div className="text-end ml-8 font-bold flex-1">{(order.NroOrden) ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="relative mt-10 px-6 mb-8">
          <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
            <div className="flex sm:flex-row flex-col border-b pb-2">
              <div className="flex-none ltr:mr-2 rtl:ml-2">	{t.name_contact}:</div>
              <div className="text-end ml-8 font-bold flex-1">{(contact?.NomContato) ?? '---'}</div>
            </div>
            <div className="flex sm:flex-row flex-col border-b pb-2">
              <div className="flex-none ltr:mr-2 rtl:ml-2">	{t.email}:</div>
              <div className="text-end ml-8 font-bold flex-1">{(contact?.Mail) ?? '---'}</div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.phone}:</div>
              <div className="text-end ml-8 font-bold flex-1">{(contact?.Telefono) ?? '---'}</div>
            </div>
          </div>
        </div>

      </div>
      <div className='table-responsive mt-4'>
        {!(order.NroOrden) &&
          <div className="bg-gray-400 p-4">
            <div className="flex flex-wrap items-center justify-start gap-2">
              {(false) &&
                <button disabled={isSelect} onClick={() => divideQuantity()} type="button" className="btn btn-dark">
                  {t.divide_quantity}
                </button>
              }

              <button disabled={isSelect} onClick={() => changeSupplier()} type="button" className="btn btn-dark">
                {t.change_of_supplier}
              </button>

              <button disabled={isSelect} onClick={() => resetOrder()} type="button" className="btn btn-dark">
                {t.undo_changes}
              </button>

            </div>
          </div>
        }
        <table className="bg-white table-hover text-sm">
          <thead>
            <tr className="relative !bg-gray-400 text-center text-sm">
              <th>
                <input
                  type="checkbox"
                  className="border border-dark border-1 bg-white form-checkbox"
                  checked={selected.length === items.length}
                  onChange={toggleAll}
                />
              </th>
              <th>{t.nro_part_customer}</th>
              <th>{t.nro_part_purchase}</th>
              <th>{t.description}</th>
              <th>{t.missing_amount}</th>
              <th>{t.quantity_purchased}</th>
              <th>{t.system_cost}</th>
              <th>{t.actual_cost}</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              return (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      className="border border-dark border-1 form-checkbox"
                      checked={selected.includes(item)}
                      onChange={() => toggleSelect(item)}
                    />
                  </td>
                  <td>{item.NroParteCliente}</td>
                  <td>{item.NroParteCompra}</td>
                  <td>{item.Descripcion}</td>
                  <td>{item.CantFaltante}</td>
                  <td>
                    <input
                      type="text"
                      {...register(`items.${index}.quantity_purchased`)}
                      className="form-input form-input-sm w-full border border-dark border-1"
                    />
                  </td>
                  <td>{customFormat(item.CostoSistema)}</td>
                  <td>
                    <input
                      type="text"
                      {...register(`items.${index}.real_cost`)}
                      className="form-input form-input-sm w-full border border-dark border-1"
                    />
                  </td>
                  <td>{customFormat(item.Total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="h-1 bg-gray-200 w-full mt-10"></div>
        <div className='flex items-center justify-between gap-4 mt-10 bg-gray-200 shadow border border-1 border-gray-300 p-4'>
          <div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {!(order.NroOrden) &&
                <>
                  <BtnPrintProforma selected={selected} disabled={isSelect} token={token} order={order} t={t} className="btn btn-dark"></BtnPrintProforma>
                  <button disabled={isSelect} onClick={() => generateOrder()} type="button" className="btn btn-success">
                    {t.generate_purchase_order}
                  </button>
                </>
              }
              <button disabled={!(order.NroOrden)} onClick={() => handleUpdate()} type="button" className="btn btn-dark">
                {t.btn_update}
              </button>

            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className='space-y-4'>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="others">{t.others}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("others", { required: false })} aria-invalid={errors.others ? "true" : "false"} placeholder={t.enter_others} className="form-input placeholder:" />
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="shipping">Shipping</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("shipping", { required: false })} aria-invalid={errors.shipping ? "true" : "false"} placeholder={t.enter_shipping} className="form-input placeholder:" />
                  </div>
                </div>

              </div>
              <div>
                <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                  <div className="flex sm:flex-row flex-col border-b pb-2">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">Sub Total:</div>
                    <div className="text-end ml-8 font-bold flex-1">{customFormat(order.MtoSubTotal)}</div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <div className="flex-none ltr:mr-2 rtl:ml-2">Total Sus.:</div>
                    <div className="text-end ml-8 font-bold flex-1">{customFormat(order.MtoTotal)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal show_close_button={show_close_button} size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default PurchaseOrderDetails;
