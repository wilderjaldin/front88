"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import ComponentShippingForm from "@/components/forms/shipping-form";
import { DataTable } from "mantine-datatable";
import IconPencil from "@/components/icon/icon-pencil";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconUserPlus from "@/components/icon/icon-user-plus";
import IconListCheck from "@/components/icon/icon-list-check";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconSearch from "@/components/icon/icon-search";
import Modal from '@/components/modal';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconMapPin from "@/components/icon/icon-map-pin";
import { useSearchParams } from "next/navigation";
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/MostrarListaDirEntrega';
const url_get_address = process.env.NEXT_PUBLIC_API_URL + 'cliente/RecuperarDirEntrega';
const url_delete_address = process.env.NEXT_PUBLIC_API_URL + 'cliente/EliminarDirEntrega';


export default function ShippingAddressCustomer({ loadAddresses, setLoadAddresses, setAddresses, customer, token, addresses = [], t }) {



  const [value, setValue] = useState('list');
  const searchParams = useSearchParams();
  const [filteredItems, setFilteredItems] = useState(addresses);

  const option = searchParams.get("new") || 'false';
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [isUsa, setIsUsa] = useState(false);


  const [search, setSearch] = useState('');

  useEffect(() => {
    if (loadAddresses) {
      getAddresses();
    }
    if (option === 'true') {
      addAddress();
    }
  }, []);


  const updateList = (addresses) => {
    setFilteredItems(addresses);
    setAddresses(addresses)
  }
  const addAddress = () => {
    setModalTitle(t.register_new_shipping_address + ' ' + t.to + ' ' + customer.NomCliente)
    setModalContent(<ComponentShippingForm updateList={updateList} token={token} customer={customer} action_cancel={() => setShowModal(false)} is_new={true} address={[]}></ComponentShippingForm>);

    setShowModal(true);
  }
  const editAddress = async (address) => {

    setModalTitle(t.btn_update_address + ' ' + t.of + ' ' + customer.NomCliente)
    let address_edit = await getAddress(address);

    setModalContent(<ComponentShippingForm current_country={(address_edit.CodPais) ?? null} current_city={(address.CodCiudad) ?? null} updateList={updateList} token={token} customer={customer} action_cancel={() => setShowModal(false)} is_new={false} address={address_edit}></ComponentShippingForm>);

    setShowModal(true);

  }


  const getAddress = async (address) => {

    try {
      const rs = await axios.post(url_get_address, { CodRegistro: address.CodDir, ValToken: token });

      return rs.data.dato[0];
    } catch (error) {
      return [];
    }
  }

  const getAddresses = async () => {
    try {
      const rs = await axios.post(url, { CodCliente: customer.IdCliente, ValToken: token });

      setAddresses(rs.data.dato);
      setFilteredItems(rs.data.dato);
      setLoadAddresses(false);
    } catch (error) {

    }
  }


  const deleteAddress = (address) => {



    Swal.fire({
      title: t.question_delete_address,
      text: address.NomContacto,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {

        try {
          let rs = await axios.post(url_delete_address, { CodRegistro: address.CodDir, ValToken: token });
          if (rs.data.estado == "OK") {
            updateList(() => {
              return addresses.filter((item) => {
                return item.CodDir != address.CodDir;
              });
            });

            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.address_deleted,
              showConfirmButton: false,
              timer: 1500
            });


          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.address_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.address_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }

    });

  }



  const searchContact = () => {
    setFilteredItems(() => {
      return addresses.filter((item) => {
        return item.NomContacto.toLowerCase().includes(search.toLowerCase());
      });
    });
  };

  useEffect(() => {
    searchContact();
  }, [search]);

  return (
    <>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl">{t.address}</h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex gap-3">
            <div>
              <button type="button" className="btn btn-primary" onClick={() => addAddress()}>
                <IconMapPin className="ltr:mr-2 rtl:ml-2" />
                {t.btn_add_address}
              </button>
            </div>
            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                <IconListCheck />
              </button>
            </div>
            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                <IconLayoutGrid />
              </button>
            </div>
          </div>
          <div className="relative">
            <input type="text" placeholder={t.search} className="peer form-input py-2 ltr:pr-11 rtl:pl-11" onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
              <IconSearch className="mx-auto" />
            </button>
          </div>
        </div>
      </div>
      {!(filteredItems.length) && <h2 className="rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white mt-6 p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">{t.addresses_empty}</h2>}

      {value === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="table-responsive">
            {((Array.isArray(filteredItems)) && (filteredItems.length > 0)) &&
              <table className="table-striped table-hover">
                <thead>
                  <tr>
                    <th>{t.place}</th>
                    <th>{t.address}</th>
                    <th>{t.company}</th>
                    <th>{t.contact}</th>
                    <th>{t.phone}</th>
                    <th>{t.email}</th>
                    <th>{t.state}</th>
                    <th>{t.zip}</th>
                    <th className="!text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((address, index) => {
                    return (
                      <tr key={index}>
                        <td>{address.NomPais} {address.NomCiudad}</td>
                        <td>{address.DesDireccion}</td>
                        <td>{address.NomEmpresa}</td>
                        <td>{address.NomContacto}</td>
                        <td>{address.NumTelefono}</td>
                        <td>{address.Mail}</td>
                        <td>{address.NomEstado}</td>
                        <td>{address.CodPostal}</td>
                        <td>
                          <div className="mx-auto flex w-max items-center gap-2">
                            <button title={t.edit} type="button" className="btn btn-sm btn-info" onClick={() => editAddress(address)}><IconPencil /></button>
                            <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteAddress(address)}><IconTrashLines /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>)}


      {value === 'grid' && (
        <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((address, index) => {
            return (
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                <div className="relative mt-10 px-6">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.place}:</div>
                      <div className="text-white-dark">{address.NomPais} {address.NomCiudad}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.address}:</div>
                      <div className="text-white-dark">{address.DesDireccion}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.company}:</div>
                      <div className="text-white-dark">{address.NomEmpresa}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.contact}:</div>
                      <div className="text-white-dark">{address.NomContacto}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.phone}:</div>
                      <div className="text-white-dark">{address.NumTelefono}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.email}:</div>
                      <div className="text-white-dark">{address.Mail}</div>
                    </div>
                    {(isUsa) &&
                      <>
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.state}:</div>
                          <div className="text-white-dark">{address.NomEstado}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.zip}:</div>
                          <div className="text-white-dark">{address.CodPostal}</div>
                        </div>
                      </>
                    }
                  </div>

                  <div className="flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                    <button type="button" className="btn btn-outline-info w-1/2" onClick={() => editAddress(address)}>
                      {t.btn_edit}
                    </button>
                    <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteAddress(address)}>
                      {t.btn_delete}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>

    </>
  );
}