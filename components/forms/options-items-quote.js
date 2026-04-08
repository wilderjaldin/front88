'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios'
import IconPlus from '../icon/icon-plus';
import { customFormat } from '@/app/lib/format';
import IconCheck from '../icon/icon-check';
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';

const url_add_item = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/AdicionarItem';
const url_add_item_confirmed = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/AdicionarItem';

const OptionsItemsQuote = ({ confirmed = false, close, options, customer, data, token, t, order, setItems, setOrder, updateInputs, item_select = [], changePrice = false }) => {

  const router = useRouter();
  const locale = useSelector(getLocale);

  const addItem = async (item) => {



    //Nueva cotizacion: NroOrden: 0; CodItem: 0
    //Agregar a cotizacion: NroOrden: 44; CodItem: 0
    const data_add = {
      Idioma: locale,
      NroOrden: (order.NroOrden) ?? 0,
      CodItem: (item_select.CodItem) || 0,
      CodCliente: customer.CodCliente,
      CodRepuesto: item.CodRepuesto,
      NroParte: data.nro_part,
      NroParteCambio: item.NroParte,
      Cantidad: data.quantity,
      Posicion: (data.position != "") ? data.position : 0,
      NroPedido: data.nro_order,
      MarcaEquipo: data.equipment_brand,
      ModeloEquipo: data.equipment_model,
      AnioEquipo: data.equipment_year,
      NroSerieEquipo: data.equipment_serie,
      MarcaMotor: data.engine_serie,
      ModeloMotor: data.engine_model,
      NroSerieMotor: data.engine_serie,
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
        close();

      }
    } catch (error) {

    }

  }

  const addItemConfirmed = async (item) => {

    let CambiaPrecio = 0;
    const data_add = {
      Idioma: locale,
      NroOrden: order.NroOrden,
      CodItem: (item_select.CodItem) || 0,
      CodCliente: customer.CodCliente,
      Cantidad: data.quantity,
      CodRepuestoSelect: 1,
      CodRepuestoActual: 1,
      NroParteCliente: item.NroParte,
      CambiaPrecio: CambiaPrecio,
      ValToken: token
    }


    try {
      const rs = await axios.post(url_add_item_confirmed, data_add);

      if (rs.data.estado == 'OK') {
        setOrder(rs.data.dato2[0]);
        setItems(rs.data.dato3);
        updateInputs(rs.data.dato3);
        close();

      }
    } catch (error) {

    }


  }

  const changeItemConfirmed = async (item) => {

    
    if (changePrice) {
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
          let CambiaPrecio = 0;

          await Swal.fire({
            title: t.question_do_you_want_the_current_sale_price,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#15803d',
            confirmButtonText: t.yes,
            cancelButtonText: t.no,
            reverseButtons: true
          }).then(async (result) => {
            if (result.isConfirmed) {
              CambiaPrecio = 1;
            }
          });


          const data_add = {
            Idioma: locale,
            NroOrden: order.NroOrden,
            CodItem: (item_select.CodItem) || 0,
            CodCliente: customer.CodCliente,
            Cantidad: data.quantity,
            CodRepuestoSelect: item.CodRepuesto,
            CodRepuestoActual: item.CodRepuesto,
            NroParteCliente: item.NroParte,
            CambiaPrecio: CambiaPrecio,
            ValToken: token
          }

         
          try {
            const rs = await axios.post(url_add_item_confirmed, data_add);

            if (rs.data.estado == 'OK') {
              // setOrder(rs.data.dato1[0]);
              setItems(rs.data.dato3);
              
              updateInputs(rs.data.dato3);
              close();

            }
          } catch (error) {

          }


        }
      });
    }






  }
  return (
    <>
      <table className="bg-white ">
        <thead>
          <tr className="relative !bg-gray-400 text-center uppercase">
            <th></th>
            <th>{ t.spare_part_type }</th>
            <th>{ t.application }</th>
            <th>{ t.brand }</th>
            <th>{ t.supplier }</th>
            <th>{ t.status }</th>
            <th>{ t.price_unit }</th>
            <th>{ t.delivery_time }</th>
            <th>{ t.days_of_validity }</th>
          </tr>
        </thead>
        <tbody>
          {
            options.map((o, index) => {
              return (
                <tr key={index} className={`group/item ${((item_select?.CodRepuesto) && (item_select.CodRepuesto == o.CodRepuesto)) ? 'bg-cyan-200 !hover:bg-cyan-200' : ''}`}>
                  <td>
                    {((item_select?.CodRepuesto) && (item_select.CodRepuesto == o.CodRepuesto)) ?
                      <IconCheck className='fill-green-600'></IconCheck>
                      :
                      <button onClick={() => (confirmed) ? ((changePrice) ? changeItemConfirmed(o) : addItemConfirmed(o)) : addItem(o)} className='btn btn-sm btn-dark group/edit group-hover/item:btn-success' type='button'><IconPlus></IconPlus></button>
                    }

                  </td>
                  <td>{o.TipRepuesto}</td>
                  <td>{o.Aplicacion}</td>
                  <td>{o.Marca}</td>
                  <td>{o.Proveedor}</td>
                  <td>{o.Estado}</td>
                  <td className='text-end'>{customFormat(o.Precio)}</td>
                  <td>{o.DesTieEntrega}</td>
                  <td>{o.DiasVigencia}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </>
  );
};

export default OptionsItemsQuote;
