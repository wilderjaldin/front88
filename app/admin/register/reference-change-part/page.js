"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Modal from '@/components/modal';
import axiosClient from '@/app/lib/axiosClient';
import axios from 'axios';
import Swal from 'sweetalert2';
import TableItems from "@/app/admin/register/reference-change-part/table";
import Form from "@/app/admin/register/reference-change-part/form";
import IconBellBing from "@/components/icon/icon-bell-bing";
import Link from "next/link";
import IconInfoCircle from "@/components/icon/icon-info-circle";
import IconBackSpace from "@/components/icon/icon-backspace";
import IconSearch from "@/components/icon/icon-search";
import IconPlusProps from "@/components/icon/icon-plus";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_DELETE   = 'referenciasCruzadas/eliminar';
const url_validate = process.env.NEXT_PUBLIC_API_URL + 'referencia/ValidarReferencia';
const URL_CONTROLS = 'referenciasCruzadas/controles';
const URL_BUSCAR   = 'referenciasCruzadas/buscar';
const URL_SAVE     = 'referenciasCruzadas/registrar';
const URL_UPDATE   = 'referenciasCruzadas/actualizar';

export default function ReferenceChangePart() {

  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  const [brands,        setBrands]       = useState([]);
  const [isSearch,      setIsSearch]     = useState(false);
  const [items,         setItems]        = useState([]);
  const [options,       setOptions]      = useState([]);
  const [NroParte,      setNroParte]     = useState("");
  const [show_modal,    setShowModal]    = useState(false);
  const [modal_title,   setModalTitle]   = useState('');
  const [modal_content, setModalContent] = useState(null);

  const nro_part    = searchParams.get("part");
  const quote_id    = searchParams.get("id") || 0;
  const customer_id = searchParams.get("customer");

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

  useEffect(() => {
    axiosClient.get(URL_CONTROLS)
      .then(rs => setBrands(rs.data.marcas ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (nro_part) {
      setValue('nro_part', nro_part);
      onSearch({ nro_part, cod_dax: '' });
    }
  }, [nro_part]);

  const onSearch = async (data) => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const rs = await axiosClient.get(URL_BUSCAR, {
        params: {
          nroParte: data.nro_part,
          codDax:   data.cod_dax ?? '',
        },
      });

      if (nro_part != data.nro_part) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("customer"); next.delete("part"); next.delete("id");
        router.replace(`${pathname}?${next}`);
      }
      setNroParte(data.nro_part);
      setItems((rs.data.referencias ?? []).map((o, i) => ({ ...o, id: i })));
      setOptions((rs.data.repuestos  ?? []).map((o, i) => ({ ...o, id: i })));
      setIsSearch(true);
      Swal.close();
    } catch {
      Swal.close();
    }
  };

  const updateItem = async (data, onSuccess) => {
    try {
      await axiosClient.put(URL_UPDATE, { registros: [data] });
      Swal.fire({ position: "top-end", icon: "success", title: t.update_item_success, showConfirmButton: false, timer: 1500 });
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.error;
      Swal.fire({ icon: "error", title: t.error ?? 'Error', text: msg });
    }
  };

  const updateAllItems = async (registros, onSuccess) => {
    try {
      await axiosClient.put(URL_UPDATE, { registros });
      Swal.fire({ position: "top-end", icon: "success", title: t.update_item_success, showConfirmButton: false, timer: 1500 });
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.error;
      Swal.fire({ icon: "error", title: t.error ?? 'Error', text: msg });
    }
  };

  const deleteItem = async (data) => {
    const result = await Swal.fire({
      title: t.question_delete_the_selected_records,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await axiosClient.post(URL_DELETE, { codRegistro: data.CodRegistro });
      Swal.fire({ position: "top-end", icon: "success", title: t.record_deleted, showConfirmButton: false, timer: 1500 });
      setItems(prev => prev.filter(item => item.codRegistro !== data.CodRegistro));
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.error;
      Swal.fire({ icon: "error", title: t.error ?? 'Error', text: msg });
    }
  };

  const handleNew = () => {
    setModalTitle(t.new_register);
    setModalContent(<Form t={t} brands={brands} action_cancel={() => setShowModal(false)} handleSave={handleSave} />);
    setShowModal(true);
  };

  const handleSave = async (data) => {
    try {
      await axiosClient.post(URL_SAVE, data);
      setShowModal(false);
      Swal.fire({ position: "top-end", icon: "success", title: t.save_success, showConfirmButton: false, timer: 1500 });
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.error;
      Swal.fire({ icon: "error", title: t.error ?? 'Error', text: msg });
    }
  };

  const validateItem = async (data_send) => {
    try {
      const rs = await axios.post(url_validate, data_send);
      if (rs.data.estado == "OK")
        Swal.fire({ title: t.validate_quote_success, icon: 'success', confirmButtonColor: '#15803d', confirmButtonText: t.close });
    } catch {}
  };

  const clear = () => {
    setValue('nro_part', "");
    setValue('cod_dax', "");
    setItems([]);
    setOptions([]);
    setIsSearch(false);
  };

  useDynamicTitle(`${t.register} | ${t.reference_part_change}`);

  return (
    <>
      {/* BREADCRUMB */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          {t.reference_part_change}
        </li>
      </ul>

      {quote_id != 0 && (
        <div className="mb-4 relative flex items-center rounded border !border-warning bg-warning-light p-3.5 text-warning before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8 before:border-b-transparent before:border-l-inherit before:border-t-transparent ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180 dark:bg-warning-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
            <IconBellBing className="h-6 w-6" />
          </span>
          <div>
            <p className="ltr:pr-2 rtl:pl-2 text-dark font-bold">
              {t.reference_is_related_to_the_quote}{' '}
              <Link className="btn btn-sm btn-outline-info inline-block font-bold" href={`/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${quote_id}`}>{quote_id}</Link>
            </p>
            <p className="text-dark">{t.quote_will_be_eliminated}</p>
          </div>
        </div>
      )}

      {/* HEADER: título izquierda / búsqueda derecha */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        {/* IZQUIERDA */}
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.reference_part_change}
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        {/* DERECHA — formulario de búsqueda */}
        <form onSubmit={handleSubmit(onSearch)}>
          <div className="flex flex-wrap items-end justify-end gap-3">

            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.nro_part}</span>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="OFF"
                  {...register("nro_part", {
                    validate: v => !!v || !!getValues('cod_dax') || t.required_field,
                  })}
                  placeholder={t.nro_part}
                  className="h-10 rounded-lg border border-gray-300 dark:border-gray-700
                    bg-white dark:bg-gray-900 px-4 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors.nro_part && (
                  <span className="absolute left-0 top-full mt-0.5 px-1 text-red-400 text-xs whitespace-nowrap">
                    {errors.nro_part.message?.toString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Code Dax</span>
              <input
                type="text"
                autoComplete="OFF"
                {...register("cod_dax")}
                placeholder="Code Dax"
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-700
                  bg-white dark:bg-gray-900 px-4 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center gap-2">
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
                className="flex h-10 items-center justify-center rounded-lg px-4
                  bg-primary/20 text-primary hover:bg-primary/40 transition text-sm font-medium"
              >
                <IconSearch className="h-4 w-4 mr-2" />{t.btn_search}
              </button>

              <div className="h-10 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

              <button
                type="button"
                onClick={handleNew}
                className="group h-10 rounded-lg bg-primary px-5
                  text-white text-sm font-medium
                  shadow-sm hover:bg-primary/90 transition"
              >
                <span className="flex items-center gap-1.5">
                  <IconPlusProps className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
                  {t.btn_new}
                </span>
              </button>
            </div>

          </div>
        </form>

      </div>

      <Modal
        size="w-full max-w-2xl"
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={modal_title}
        content={modal_content}
      />

      {items.length > 0 && (
        <TableItems
          t={t}
          quote_id={quote_id}
          NroParte={NroParte}
          items={items}
          options={options}
          token={token}
          brands={brands}
          updateItem={updateItem}
          updateAllItems={updateAllItems}
          deleteItem={deleteItem}
          validateItem={validateItem}
        />
      )}

      {isSearch && items.length == 0 && (
        <div className="mt-4 relative flex items-center rounded border !border-info bg-info-light p-3.5 text-info before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8 before:border-b-transparent before:border-l-inherit before:border-t-transparent ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180 dark:bg-info-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
            <IconInfoCircle className="h-6 w-6" />
          </span>
          <h2 className="text-dark">{t.search_is_empty}</h2>
        </div>
      )}
    </>
  );
}
