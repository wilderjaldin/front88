"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import IconCaretDown from "@/components/icon/icon-caret-down";
import IconCheck from "@/components/icon/icon-check";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_list_mails = process.env.NEXT_PUBLIC_API_URL + 'inbox/MostrarMsgPendientes';
const url_detail_mail = process.env.NEXT_PUBLIC_API_URL + 'inbox/MostrarDetMsg';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'inbox/GuardarMsg';
const url_close = process.env.NEXT_PUBLIC_API_URL + 'inbox/CerrarMsg';
const url_list_users = process.env.NEXT_PUBLIC_API_URL + "inbox/MostrarListaUsuarios"

export default function Inbox() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [pager] = useState<any>({
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    startIndex: 0,
    endIndex: 0,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
    setValue: setValueSearch,
    formState: { errors: errorsQuote },
  } = useForm();

  const [pagedMails, setPagedMails] = useState<any>([]);
  const [selectedMail, setSelectedMail] = useState<any>([]);
  const [details, setDetails] = useState([])
  const [mailList, setMailList] = useState([]);
  const [filteredMailList, setFilteredMailList] = useState<any>(mailList);
  const [users, setUsers] = useState([])

  useEffect(() => {

    async function fetchData() {
      let res = await getList();
      await getListUsers();
    }
    fetchData();


  }, []);

  const getList = async (CodNroOrden = 0, CodUsuario = 0) => {
    try {
      const rs = await axios.post(url_list_mails, { CodNroOrden: CodNroOrden, CodUsuario: CodUsuario, ValToken: token });
      if (rs.data.estado == 'OK') {

        setMailList(rs.data.dato);
        setFilteredMailList(rs.data.dato);
      }

    } catch (error) {
      return [];
    }
  }

  const getListUsers = async () => {
    try {
      const rs = await axios.post(url_list_users, {ValToken: token});
      if(rs.data.estado == 'OK'){
        let _users : any = [];
        rs.data.dato.map((u : any) => {
          if(u.CodUsuario != 0){
            _users.push({value: u.CodUsuario, label: u.NomUsuario })
          }
        });
        setUsers(_users);
      }
    } catch (error) {
      
    }
  }

  useEffect(() => {
    searchMails();
  }, [mailList]);

  const searchMails = (isResetPage = true) => {
    if (isResetPage) {
      pager.currentPage = 1;
    }

    let filteredRes = mailList;



    if (filteredRes.length) {
      pager.totalPages = pager.pageSize < 1 ? 1 : Math.ceil(filteredRes.length / pager.pageSize);
      if (pager.currentPage > pager.totalPages) {
        pager.currentPage = 1;
      }
      pager.startIndex = (pager.currentPage - 1) * pager.pageSize;
      pager.endIndex = Math.min(pager.startIndex + pager.pageSize - 1, filteredRes.length - 1);
      setPagedMails([...filteredRes.slice(pager.startIndex, pager.endIndex + 1)]);
    } else {
      setPagedMails([]);
      pager.startIndex = -1;
      pager.endIndex = -1;
    }
  };

  const selectMail = async (item: any) => {
    if (item) {
      try {
        const rs = await axios.post(url_detail_mail, { CodMensaje: item.CodMensaje, ValToken: token });
        if (rs.data.estado == "OK") {
          setSelectedMail(rs.data.dato1[0]);
          setDetails(rs.data.dato2);
        }
      } catch (error) {

      }
      //setSelectedMail(item);
    } else {
      setSelectedMail([]);
    }
  };
  const onSearch = async (data: any) => {
    let res = await getList(((data.nro_quote != "") ? data.nro_quote : 0), (data.user) ?? 0);
  }
  const onSubmit = async (data: any) => {
    try {
      const rs = await axios.post(url_save, {
        CodMensaje: selectedMail.CodMensaje,
        DesMensaje: data.message,
        "ValToken": token
      });
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.message_successfully_saved,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setDetails(rs.data.dato);
          setValue('message', "");
        });
      }
    } catch (error) {

    }
  }

  const handleCloseMessage = async (message: any) => {

    try {
      const rs = await axios.post(url_close, { CodMensaje: message.CodMensaje, ValToken: token });
      if (rs.data.estado == "OK") {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.message_read,
          showConfirmButton: false,
          timer: 1000
        }).then(r => {
          setMailList(rs.data.dato);
        });

      }
    } catch (error) {

    }
  }

  const onChangeSelect = (select: any) => {
    if (select?.value != null) {
      setValueSearch('user', select.value)
    } else {
      setValueSearch('user', 0)
    }

  }
  useDynamicTitle(`${ t.inbox}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.home }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> { t.inbox } </span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-10 gap-4 mt-8">
        <div className="col-span-4 panel dark:gray-50 p-0 ltr:rounded-r-none rtl:rounded-l-none xl:relative xl:block xl:h-auto ltr:xl:rounded-r-md rtl:xl:rounded-l-md">
          <div className="p-4">
            <form className="" onSubmit={handleSubmitSearch(onSearch)}>
              <div className="grid grid-cols-1 sm:flex justify-between gap-5">
                <input type="number" {...registerSearch("nro_quote", { required: false })} placeholder={t.nro_quote} className="form-input" />
                <Select isClearable id='select-user' placeholder={''} {...registerSearch("user", { required: false })} className='w-full' options={users} onChange={onChangeSelect} />
                <button type="submit" className="btn btn-primary">{t.btn_search}</button>
              </div>
            </form>
          </div>
          <div className="mt-0 flex-1 md:flex-auto">
            <div className="flex items-center justify-center md:justify-end p-4">
              <div className="ltr:mr-3 rtl:ml-3">{pager.startIndex + 1 + '-' + (pager.endIndex + 1) + ` ${t.of} ` + filteredMailList.length}</div>
              <button
                type="button"
                disabled={pager.currentPage === 1}
                className="rounded-md bg-[#f4f4f4] p-1 enabled:hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60 ltr:mr-3 rtl:ml-3 dark:bg-white-dark/20 enabled:dark:hover:bg-white-dark/30"
                onClick={() => {
                  pager.currentPage--;
                  searchMails(false);
                }}
              >
                <IconCaretDown className="h-5 w-5 rotate-90 rtl:-rotate-90" />
              </button>
              <button
                type="button"
                disabled={pager.currentPage === pager.totalPages}
                className="rounded-md bg-[#f4f4f4] p-1 enabled:hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white-dark/20 enabled:dark:hover:bg-white-dark/30"
                onClick={() => {
                  pager.currentPage++;
                  searchMails(false);
                }}
              >
                <IconCaretDown className="h-5 w-5 -rotate-90 rtl:rotate-90" />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table-compact whitespace-nowrap">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="!py-2 !px-2">{ t.started_by }</th>
                  <th className="!py-2 !px-2">{ t.destiny } - { t.message }</th>
                </tr>
              </thead>
              <tbody>
                {pagedMails.map((mail: any, index: any) => (
                  <tr
                    key={index}
                    onClick={() => selectMail(mail)}
                    className={`${(selectedMail.CodMensaje == mail.CodMensaje) ? 'bg-gray-200 text-black' : 'bg-white text-white-dark'} group/item cursor-pointer hover:shadow-md hover:z-10 hover:border-t-1 hover:!border-1 hover:!border-gray-200 relative transition-all duration-150`}
                  >
                    <td className="!px-2 !border-b-1 border-b-gray-200">
                      <span className={`${mail.Visto == 0 ? 'font-bold text-black dark:text-gray-300' : ''} line-clamp-1  overflow-hidden`}>
                        {mail.IniciadoPor}
                      </span>
                    </td>
                    
                    <td className="relative !px-2 !border-b-1 border-b-gray-200">
                      <span className={`${mail.Visto == 0 ? 'font-bold text-black dark:text-gray-300' : ''}`}>
                        {mail.DesMensaje} - {mail.Destino}
                      </span>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseMessage(mail);
                          }}
                          className="z-10 invisible group-hover/item:visible"
                        >
                          <IconCheck className="fill-success" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
        <div className="col-span-6 panel dark:gray-50 p-0 ltr:rounded-r-none rtl:rounded-l-none xl:relative xl:block xl:h-auto ltr:xl:rounded-r-md rtl:xl:rounded-l-md">
          {(selectedMail.NroOrden) &&
            <>
              <div className="p-4">
              <div className="flex flex-row gap-4 border-b border-b-gray-100 mb-2">
                <div className="font-bold text-black basis-1/5">
                  { t.customer }
                </div>
                <div className="basis-3/4">
                  {selectedMail.NomCliente}
                </div>
              </div>

              <div className="flex flex-row gap-4 border-b border-b-gray-100 mb-2">
                <div className="font-bold text-black basis-1/5">
                  { t.quote }
                </div>
                <div className="basis-3/4">
                  {selectedMail.NroOrden}
                </div>
              </div>

              <div className="flex flex-row gap-4 border-b border-b-gray-100 mb-2">
                <div className="font-bold text-black basis-1/5">
                  Total
                </div>
                <div className="basis-3/4">
                  {selectedMail.Total}
                </div>
              </div>
              <div className="flex flex-row gap-4">
                <div className="font-bold text-black basis-1/5">
                { t.date }
                </div>
                <div className="basis-3/4">
                  {selectedMail.FechaCot}
                </div>
              </div>
              </div>
              <div className="p-4">
                <form action="" onSubmit={handleSubmit(onSubmit)}>
                  <fieldset>
                    <legend></legend>
                    <div>
                      <div className="flex">
                        <textarea {...register("message", { required: { value: true, message: t.required_field } })} id="message" className="form-input ltr:rounded-r-none rtl:rounded-l-none"></textarea>
                        <button type="submit" className="btn btn-outline-dark ltr:rounded-l-none rtl:rounded-r-none">{ t.accept }</button>
                      </div>
                      {errors.message && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.message?.message?.toString()}</span>}
                    </div>
                  </fieldset>
                </form>
              </div>
              <div className="table-responsive">
                <table className="table-hover">
                  <thead>
                    <tr>
                      <th>{ t.users }</th>
                      <th>{ t.detail }</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((mail: any, index: any) => {
                      return (
                        <tr key={index}>
                          <td>{mail.NomUsuario}</td>
                          <td>{mail.DesMensaje}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          }
        </div>
      </div>

    </>
  );
}