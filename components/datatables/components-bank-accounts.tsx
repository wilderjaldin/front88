'use client';

import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import { useEffect, useState } from "react";
import ComponentBankAccountsForm from "@/components/forms/bank-account-form"
import { useOptionsSelect } from '@/app/options'
import IconPencil from "../icon/icon-pencil";
import IconTrashLines from "../icon/icon-trash-lines";
import axios from 'axios'
import Swal from 'sweetalert2'
import IconUserPlus from "../icon/icon-user-plus";
import IconListCheck from "../icon/icon-list-check";
import IconLayoutGrid from "../icon/icon-layout-grid";
import IconSearch from "../icon/icon-search";


const url_delete = process.env.NEXT_PUBLIC_API_URL + 'empresa/EliminarRegistroBanco';


const ComponentBankAccounts = ({ banks = [], token = '', company = {} }) => {

  const t = useTranslation();
  const [show_form, setShowForm] = useState(false);
  const [bank, setBank] = useState({})

  const [bank_list, setBankList] = useState([])

  const currencies_options = useOptionsSelect("currencies");
  const [value, setValue] = useState('list');
  const [filteredItems, setFilteredItems] = useState(banks);
  const [search, setSearch] = useState('');
  const searchContact = () => {
    setFilteredItems(() => {
      return banks.filter((item: any) => {
        return item.DesBanco.toLowerCase().includes(search.toLowerCase());
      });
    });
  };

  useEffect(() => {
    searchContact();
  }, [search]);

  const editBank = (bank: any) => {

    setBank({ id: bank.IdBanco, sigla: bank.Sigla, name: bank.DesBanco, swift: bank.ExtCuenta, currency: bank.Moneda, number: bank.NumCuenta });
    setShowForm(true);
  }

  useEffect(() => {
    setBankList(banks);
    setFilteredItems(banks);
  }, [banks]);

  const cancel = () => {
    setShowForm(false);
    setBank({});
  }
  const updateList = (bank: any) => {
    cancel();
    let exist = false;
    let new_list: any = bank_list.map((b: any) => {
      if (b.IdBanco == bank.IdBanco) {
        b = bank;
        exist = true;
      }
      return b;
    });
    if (!exist) {
      new_list.push(bank);
    }
    setBankList(new_list);
    setFilteredItems(new_list);
  }

  const deleteBank = (b: any) => {
    Swal.fire({
      title: t.delete_bank,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      text: b.DesBanco,
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete, { IdBanco: b.IdBanco, ValToken: token });
          //
          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.bank_account_deleted,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              
              
              let new_list: any = bank_list.filter((bank: any) => {
                return b.IdBanco != bank.IdBanco;
              });
              
              setBankList(new_list);
              setFilteredItems(new_list);
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.bank_account_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


          
        } catch (error) {
          
          Swal.fire({
            title: t.error,
            text: t.bank_account_delete_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }

    });
  }
  return (
    <div className="bg-gray-200 shadow-lg border p-4">

      {!(show_form) &&
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl">{t.bank_accounts}</h2>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="flex gap-3">
              <div>
                <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <IconPlusProps className="ltr:mr-2 rtl:ml-2" />
                  {t.btn_add}
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
      }

      {(show_form) ? <ComponentBankAccountsForm currencies_options={currencies_options} updateList={updateList} cancel={() => cancel()} bank={bank} token={token}></ComponentBankAccountsForm>
        :
        <>
          {!(filteredItems.length) && <h2 className="rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white mt-6 p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">{t.bank_accounts_empty}</h2>}
          {value === 'list' && (
            <div className="panel mt-5 overflow-hidden border-0 p-0">
              <div className="responsive-table">
                {(filteredItems.length > 0) &&
                  <table className='bg-white'>
                    <thead className="">
                      <tr>
                        <th>Sigla</th>
                        <th>{t.currency}</th>
                        <th>{t.bank_name}</th>
                        <th>{t.account_number}</th>
                        <th>Routing/Swift</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((b: any, index: any) => {
                        return (
                          <tr key={index}>
                            <td>{b.Sigla}</td>
                            <td>{b.Moneda}</td>
                            <td>{b.DesBanco}</td>
                            <td>{b.NumCuenta}</td>
                            <td>{b.ExtCuenta}</td>
                            <td>
                              <div className="mx-auto flex w-max items-center gap-2">
                                <button title={t.edit} type="button" className="btn btn-sm btn-info" onClick={() => editBank(b)}><IconPencil /></button>
                                <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteBank(b)}><IconTrashLines /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                }
              </div>
            </div>
          )}

          {value === 'grid' && (
            <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredItems.map((b: any, index: any) => {
                return (
                  <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                    <div className="relative mt-10 px-6">
                      <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.name}</div>
                          <div className="text-white-dark">{b.Sigla}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.currency}</div>
                          <div className="text-white-dark">{b.Moneda}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.bank_name}</div>
                          <div className="text-white-dark">{b.DesBanco}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">{t.account_number}</div>
                          <div className="text-white-dark">{b.NumCuenta}</div>
                        </div>

                        <div className="flex items-center">
                          <div className="flex-none ltr:mr-2 rtl:ml-2">Routing/Swift</div>
                          <div className="text-white-dark">{b.ExtCuenta}</div>
                        </div>
                      </div>

                      <div className="flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                        <button type="button" className="btn btn-outline-info w-1/2" onClick={() => editBank(b)}>
                          {t.btn_edit}
                        </button>
                        <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteBank(b)}>
                          {t.btn_delete}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </>
      }

    </div>
  );
};

export default ComponentBankAccounts;
