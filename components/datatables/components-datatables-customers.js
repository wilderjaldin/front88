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

import { useDevice } from '@/context/device-context';

const url_delete_customer = process.env.NEXT_PUBLIC_API_URL + 'cliente/EliminarRegistroCliente';

const DatatablesCustomers = ({ data = [], showSettings, customer = [], t, token }) => {

  const { isMobile } = useDevice();
  const [customers, setCustomers] = useState(data)


  useEffect(() => {
    setCustomers(data)
  }, [data]);




  const deleteCustomer = (c) => {
    Swal.fire({
      title: t.delete_customer_question,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      text: c.NomCliente,
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_customer, { CodCliente: c.IdCliente, ValToken: token });

          if (rs.data.estado == "OK") {
            setCustomers(() => {
              return customers.filter((item) => {
                return item.IdCliente != c.IdCliente;
              });
            });

            Swal.fire({
              position: "top-end",
              icon: "success",
              text: t.delete_customer_success,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.delete_customer_error,
              showConfirmButton: false,
              timer: 1500
            });
          }

        } catch (error) {
          Swal.fire({
            title: t.error,
            text: t.delete_customer_error_server,
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
      <h5 className="mb-5 text-lg font-semibold dark:text-white-light">{t.customers}</h5>
      {(isMobile) ?
        <div>
          {customers.map((c, index) => {
            return (
              <div className="relative mb-4 overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                <div className="relative p-2">
                  <div className="grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.name}</div>
                      <div className=''>{c.NomCliente}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.address}</div>
                      <div className=''>{c.DirCliente}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.country} - {t.city}</div>
                      <div className=''>{c.DirCliente}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.document}</div>
                      <div className=''>{c.Documento}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.contact_name}</div>
                      <div className=''>{c.NomContacto}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.email}</div>
                      <div className=''>{c.Email}</div>
                    </div>

                    <div className="flex items-center">
                      <div className="text-white-dark flex-none ltr:mr-2 rtl:ml-2">{t.d_register}</div>
                      <div className=''>{c.FecRegistra}</div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteCustomer(c)}><IconTrashLines /> { t.btn_delete }</button>
                      <button className={`btn ${((customer) && (c.IdCliente == customer.IdCliente)) ? 'btn-dark' : 'btn-primary'}`} type='button' onClick={() => showSettings(c)}>
                        <span>
                          <IconSettings className="h-5 w-5  inline-block mr-2" />
                        </span>
                        {t.settings}
                      </button>
                    </div>



                  </div>
                </div>
              </div>
            )
          })}
        </div>
        :
        <div className="table-responsive mb-5">
          <table className="table-hover">
            <thead>
              <tr>
                <th>{t.name}</th>
                <th>{t.address}</th>
                <th>{t.country} - {t.city}</th>
                <th>{t.document}</th>
                <th>{t.contact_name}</th>
                <th>{t.phones}</th>
                <th>{t.email}</th>
                <th>{t.d_register}</th>
                <th className="text-center"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(customers)) &&
                <>
                  {customers.map((c, index) => {
                    return (
                      <tr key={index}>
                        <td>{c.NomCliente}</td>
                        <td>{c.DirCliente}</td>
                        <td>{c.NomPais + ' ' + c.NomCiudad}</td>
                        <td>{c.Documento}</td>
                        <td>{c.NomContacto}</td>
                        <td>{c.Telefonos}</td>
                        <td>{c.Email}</td>
                        <td>{c.FecRegistra}</td>
                        <td className="text-center">
                          <div className="mx-auto flex w-max items-center gap-2">
                            <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteCustomer(c)}><IconTrashLines /></button>
                            <button className={`btn ${((customer) && (c.IdCliente == customer.IdCliente)) ? 'btn-dark' : 'btn-primary'}`} type='button' onClick={() => showSettings(c)}>
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

      }

    </div>
  );
};

export default DatatablesCustomers;
