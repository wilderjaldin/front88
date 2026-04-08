"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import ComponentContactForm from "@/components/forms/contact-form";
import { DataTable } from "mantine-datatable";
import Tippy from "@tippyjs/react";
import IconPencil from "@/components/icon/icon-pencil";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconUserPlus from "@/components/icon/icon-user-plus";
import IconListCheck from "@/components/icon/icon-list-check";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconSearch from "@/components/icon/icon-search";
import Modal from '@/components/modal';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSearchParams } from "next/navigation";
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/MostrarListaContactos';
const url_get_contact = process.env.NEXT_PUBLIC_API_URL + 'cliente/RecuperarDatosContacto';
const url_delete_contact = process.env.NEXT_PUBLIC_API_URL + 'cliente/EliminarContacto';

export default function ContactsCustomer({ customer, token, t, setLoadContacts, loadContacts, contacts, setContacts }) {

  //const [_contacts, setContacts] = useState(contacts)
  const [value, setValue] = useState('list');
  const searchParams = useSearchParams();
  const [filteredItems, setFilteredItems] = useState(contacts);


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const is_new_customer = searchParams.get("new") || 'false';

  const [search, setSearch] = useState('');

  useEffect(() => {
    if(loadContacts){
      getContacts();
    }
    
    if(is_new_customer === 'true'){
      addContact();
    }
  }, []);


  const updateList = (contacts) => {
    
    setFilteredItems(contacts);
    setContacts(contacts);
  }

  const addContact = () => {
    setModalTitle(t.register_new_contact + ' ' + t.to + ' ' + customer.NomCliente)
    setModalContent(<ComponentContactForm is_new_customer={is_new_customer} updateList={updateList} customer={customer} token={token} action_cancel={() => setShowModal(false)} is_new={true} contact={null}></ComponentContactForm>);

    setShowModal(true);
  }
  const editContact = async (contact) => {

    setModalTitle(t.register_new_contact + ' ' + t.to + ' ' + customer.NomCliente)
    let contact_edit = await getContact(contact);
    setModalContent(<ComponentContactForm updateList={updateList} customer={customer} token={token} action_cancel={() => setShowModal(false)} is_new={false} contact={contact_edit}></ComponentContactForm>);

    setShowModal(true);

  }

  const getContact = async (contact) => {
    try {
      const rs = await axios.post(url_get_contact, { CodContacto: contact.CodContacto, ValToken: token });
      
      return rs.data.dato[0];
    } catch (error) {
      return [];
    }
  }

  const getContacts = async () => {
    try {
      const rs = await axios.post(url, { CodCliente: customer.IdCliente, ValToken: token });
      setContacts(rs.data.dato);
      setFilteredItems(rs.data.dato);
      setLoadContacts(false);
    } catch (error) {

    }
  }

  const deleteContact = (contact) => {
    

    Swal.fire({
      title: t.question_delete_contact,
      text: contact.NomContacto,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_contact, { CodContacto: contact.CodContacto, ValToken: token });
          if (rs.data.estado == "OK") {
            updateList(() => {
              return contacts.filter((item) => {
                return item.CodContacto != contact.CodContacto;
              });
            });
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.contact_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.contact_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {
          
          Swal.fire({
            title: t.error,
            text: t.contact_error_server,
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
      return contacts.filter((item) => {
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
        <h2 className="text-xl">{t.contacts}</h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex gap-3">
            <div>
              <button type="button" className="btn btn-primary" onClick={() => addContact()}>
                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                {t.btn_add_contact}
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
      {!(filteredItems.length) && <h2 className="rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white mt-6 p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">{t.contacts_empty}</h2>}
      {value === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="table-responsive">
            {( (Array.isArray(filteredItems)) && (filteredItems.length > 0)) &&
              <table className="table-striped table-hover">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{ t.job_title }</th>
                    <th>{ t.phones }</th>
                    <th>{ t.mails }</th>
                    <th className="!text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((contact, index) => {
                    return (
                      <tr key={index}>
                        <td>{contact.NomContacto}</td>
                        <td>{contact.NomCargo}</td>
                        <td>{contact.NumTelefonos}</td>
                        <td>{contact.Mails}</td>
                        <td>
                          <div className="mx-auto flex w-max items-center gap-2">
                            <button title={t.edit} type="button" className="btn btn-sm btn-info" onClick={() => editContact(contact)}><IconPencil /></button>
                            <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteContact(contact)}><IconTrashLines /></button>
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
          {filteredItems.map((contact, index) => {
            return (
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                <div className="relative mt-10 px-6">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.name}:</div>
                      <div className="text-white-dark">{contact.NomContacto}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.job_title }:</div>
                      <div className="text-white-dark">{contact.NomCargo}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.phones }:</div>
                      <div className="text-white-dark">{contact.NumTelefonos}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.mails }:</div>
                      <div className="text-white-dark">{contact.Mails}</div>
                    </div>
                  </div>

                  <div className="flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                    <button type="button" className="btn btn-outline-info w-1/2" onClick={() => editContact(contact)}>
                      {t.btn_edit}
                    </button>
                    <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteContact(contact)}>
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