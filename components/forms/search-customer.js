'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconBackSpace from '../icon/icon-backspace';
import IconSearch from '../icon/icon-search';
import IconInfoCircle from '../icon/icon-info-circle';
import IconArrowForward from '../icon/icon-arrow-forward';

const URL_BUSCAR = 'clientes/buscar';

const SearchCustomerForm = ({ t, close }) => {

  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [isSearch,  setIsSearch]  = useState(false);

  const { register, reset, handleSubmit, setFocus } = useForm();

  React.useEffect(() => {
    setFocus("query");
  }, [setFocus]);

  const onSearch = async (data) => {
    try {
      const rs = await axiosClient.get(URL_BUSCAR, { params: { term: data.query } });
      setCustomers(rs.data ?? []);
      setIsSearch(true);
    } catch {
      Swal.fire({
        title: t.error,
        text: t.customer_error_search,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close,
      });
    }
  };

  const clear = () => {
    reset({ query: "" });
    setCustomers([]);
    setIsSearch(false);
  };

  const goToCustomer = (cod) => {
    router.push(`/admin/revision/orders-process?customer=${cod}&option=quotes`);
    close?.();
  };


  const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
  const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

  return (
    <div className="space-y-4">

      {/* Search bar */}
      <form onSubmit={handleSubmit(onSearch)}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              autoComplete="off"
              {...register("query", { required: true })}
              placeholder={t.enter_search_customer}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700
                bg-white dark:bg-gray-900 pl-9 pr-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={clear}
            title={t.btn_clear}
            className="flex h-10 items-center justify-center rounded-lg px-3
              bg-gray-200 text-gray-700 hover:bg-gray-300 transition
              dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <IconBackSpace className="h-4 w-4" />
          </button>

          <button
            type="submit"
            className="flex h-10 items-center gap-1.5 rounded-lg px-4
              bg-primary/20 text-primary hover:bg-primary/40 transition text-sm font-medium"
          >
            <IconSearch className="h-4 w-4" />
            {t.btn_search}
          </button>
        </div>
      </form>

      {/* Results */}
      {customers.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto overflow-y-auto max-h-72">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={thClass}></th>
                  <th className={thClass}>{t.customer ?? 'Cliente'}</th>
                  <th className={thClass}>{t.document_type ?? 'Tipo'}</th>
                  <th className={thClass}>{t.document ?? 'Documento'}</th>
                  <th className={thClass}>{t.country ?? 'País'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {customers.map((c, index) => (
                  <tr
                    key={index}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                    onClick={() => goToCustomer(c.codCliente)}
                  >
                    <td className={tdClass}>
                      <button
                        type="button"
                        title={t.view ?? 'Ver cotizaciones'}
                        className="flex h-7 w-7 items-center justify-center rounded-lg
                          bg-primary/10 text-primary hover:bg-primary/25 transition"
                        onClick={(e) => { e.stopPropagation(); goToCustomer(c.codCliente); }}
                      >
                        <IconArrowForward className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className={`${tdClass} font-medium`}>{c.nomCliente}</td>
                    <td className={tdClass}>{c.tipDocumento}</td>
                    <td className={`${tdClass} font-mono`}>{c.numNit}</td>
                    <td className={tdClass}>
                      <span className="flex items-center gap-1.5">
                        {c.codPais && (
                          <img
                            src={`/assets/flags/${c.codPais.trim().toLowerCase()}.svg`}
                            alt={c.codPais}
                            className="h-4 w-6 rounded-sm object-cover border border-gray-200 dark:border-gray-600"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        {c.nomPais ?? c.codPais}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isSearch && customers.length === 0 && (
        <div className="relative flex items-center rounded border !border-info bg-info-light p-3.5 text-info
          before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8
          before:border-b-transparent before:border-l-inherit before:border-t-transparent
          ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180
          dark:bg-info-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
            <IconInfoCircle className="h-6 w-6" />
          </span>
          <h2 className="text-dark">{t.customer_empty}</h2>
        </div>
      )}

    </div>
  );
};

export default SearchCustomerForm;
