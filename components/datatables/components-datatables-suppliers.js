'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import IconPencil from '../icon/icon-pencil';
import IconTrashLines from '../icon/icon-trash-lines';
import IconUsersGroup from '../icon/icon-users-group';
import IconMapPin from '../icon/icon-map-pin';
import IconDots from '../icon/icon-dots';
import IconChatDots from '../icon/icon-chat-dots';
import IconFile from '../icon/icon-file';
import IconHands from '../icon/icon-hands';
import IconSettings from '../icon/icon-settings';
import IconCaretDown from '../icon/icon-caret-down';
import Dropdown from '@/components/dropdown';
import Link from 'next/link';
import axios from 'axios'
import Swal from 'sweetalert2'
const url_delete_supplier = process.env.NEXT_PUBLIC_API_URL + 'proveedor/EliminarRegistroPrv';
const DatatablesSuppliers = ({ data = [], showSettings, supplier = null, t, token }) => {

  
  const [suppliers, setSuppliers] = useState(data)

  useEffect(() => {
    setSuppliers(data)
  }, [data]);


  const deleteSupplier = (s) => {
  
      Swal.fire({
        title: t.delete_supplier_question,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        text: s.NomPrv,
        confirmButtonText: t.yes_delete,
        cancelButtonText: t.btn_cancel,
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            let rs = await axios.post(url_delete_supplier, { CodPrv: s.CodPrv, ValToken: token });
            
            if (rs.data.estado == "OK") {
              setSuppliers(rs.data.dato);  
              Swal.fire({
                position: "top-end",
                icon: "success",
                text: t.delete_supplier_success,
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                position: "top-end",
                icon: "error",
                title: t.delete_supplier_error,
                showConfirmButton: false,
                timer: 1500
              });
            }
  
          } catch (error) {
            
            Swal.fire({
              title: t.error,
              text: t.delete_supplier_error_server,
              icon: 'error',
              confirmButtonColor: '#dc2626',
              confirmButtonText: t.close
            });
          }
  
        }
  
      });
    }

  return (
    <div className="panel mt-6">
      <div className="table-responsivess mb-5">
        <table className="table-hover">
          <thead>
            <tr>
              <th>{ t.razon_social }</th>
              <th>{ t.country } - { t.city }</th>
              <th>{ t.document }</th>
              <th>{ t.address }</th>
              <th>{ t.contact }</th>
              <th>{ t.phone }</th>
              <th>{ t.email }</th>
              <th>{ t.consider_stock }</th>
              <th>{ t.days_process }</th>
              <th>{ t.days_shipping_standard }</th>
              <th className="text-center"></th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(suppliers)) &&

              <>
                {suppliers.map((s, index) => {
                  return (
                    <tr key={index}>
                      <td>{s.NomPrv}</td>
                      <td>{s.NomPais + ' ' + s.NomCiudad}</td>
                      <td>{s.NumDocumento}</td>
                      <td>{s.DirPrv}</td>
                      <td>{s.NomContacto}</td>
                      <td>{s.Telefono}</td>
                      <td>{s.Mail}</td>
                      <td>{s.ConsiderarStock}</td>
                      <td>{s.DiasProceso}</td>
                      <td>{s.DiasShipingStandard}</td>
                      <td className="text-center">
                        <div className="mx-auto flex w-max items-center gap-2">
                          <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteSupplier(s)}><IconTrashLines /></button>
                          <button className={`btn ${((supplier) && (s.CodPrv == supplier.CodPrv)) ? 'btn-dark' : 'btn-outline-dark'}`} type='button' onClick={() => showSettings(s)}>
                            <span>
                              <IconSettings className="h-5 w-5  inline-block mr-2" />
                            </span>
                            {t.settings}
                          </button>
                        </div>

                      </td>
                    </tr>
                  );
                })}
              </>

            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatatablesSuppliers;
