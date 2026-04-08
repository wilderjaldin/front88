"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useOptionsSelect } from '@/app/options'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import TableItems from "@/app/admin/register/reference-change-part/table"
import Form from "@/app/admin/register/reference-change-part/form"
import IconBellBing from "@/components/icon/icon-bell-bing";
import Link from "next/link";
import IconInfoCircle from "@/components/icon/icon-info-circle";
import IconBackSpace from "@/components/icon/icon-backspace";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
const url_search = process.env.NEXT_PUBLIC_API_URL + 'referencia/MostrarReferencia';
const url_update_item = process.env.NEXT_PUBLIC_API_URL + 'referencia/ModificarItem';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'referencia/GuardarReferencia';
const url_delete = process.env.NEXT_PUBLIC_API_URL + 'referencia/EliminarItem';
const url_validate = process.env.NEXT_PUBLIC_API_URL + 'referencia/ValidarReferencia';

export default function ReferenceChangePart() {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const brands = useOptionsSelect("brands") || [];
  const [isSearch, setIsSearch] = useState(false);

  const [items, setItems] = useState([])
  const [options, setOptions] = useState([])

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);

  //
  const nro_part = searchParams.get("part");
  const quote_id = searchParams.get("id") || 0;
  const customer_id = searchParams.get("customer");
  //

  const [NroParte, setNroParte] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function fetchData() {
      if (nro_part) {
        setValue('nro_part', nro_part);
        await onSearch({ nro_part: nro_part, application: 0 });
      }
    }
    fetchData();
  }, [nro_part]);

  const onChangeSelectRange = (select) => {
    setValue('application', (select?.value) ?? 0);
  }

  const onSearch = async (data) => {

    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const rs = await axios.post(url_search, { NroParte: data.nro_part, CodMarca: (data.application) ?? 0, ValToken: token });
      
      if (rs.data.estado == "OK") {
        if (nro_part != data.nro_part || data.application != 0) {
          const nextSearchParams = new URLSearchParams(searchParams.toString());
          nextSearchParams.delete("customer");
          nextSearchParams.delete("part");
          nextSearchParams.delete("id");
          router.replace(`${pathname}?${nextSearchParams}`);
        }
        setNroParte(data.nro_part);
        setItems(() => rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        }));
        setOptions(() => rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        }));
        setIsSearch(true);
        Swal.close();

      }
    } catch (error) {
      
    }
  }

  const updateItem = async (data) => {
    try {
      data.ValToken = token;
      const rs = await axios.post(url_update_item, data);
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.update_item_success,
          showConfirmButton: false,
          timer: 1500
        })
      }
    } catch (error) {

    }
  }

  const deleteItem = async (data) => {
    try {
      Swal.fire({
        title: t.question_delete_the_selected_records,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#15803d',
        confirmButtonText: t.yes,
        cancelButtonText: t.btn_cancel,
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          data.ValToken = token;
          const rs = await axios.post(url_delete, data);
          
          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.record_deleted,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              setItems(() => {
                return items.filter((item) => {
                  return item.CodRegistro != data.CodRegistro;
                });
              });
            })
          }
        }
      });

    } catch (error) {

    }
  }

  const handleNew = () => {
    setModalTitle(t.new_register);
    setModalContent(<Form t={t} brands={brands} action_cancel={() => setShowModal(false)} handleSave={handleSave}></Form>)
    setShowModal(true);
  }

  const handleSave = async (data) => {
    try {
      data.ValToken = token;
      

      const rs = await axios.post(url_save, data);
      
      if (rs.data.estado == 'OK') {
        setShowModal(false);
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setItems(() => rs.data.dato.map((o, index) => {
            o.id = index;
            return o;
          }));
        });
        setIsSearch(false);

      }
    } catch (error) {
      
    }
  }

  const validateItem = async (data_send) => {
    try {

      const rs = await axios.post(url_validate, data_send);
      if (rs.data.estado == "OK") {
        Swal.fire({
          title: t.validate_quote_success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        });
      }
    } catch (error) {

    }
  }

  const clear = () => {
    setValue('nro_part', "");
    setItems([]);
    setOptions([]);
    setIsSearch(false);
  }

  useDynamicTitle(`${t.register} | ${t.reference_part_change}` );

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.register}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> { t.reference_part_change } </span>
          </li>
        </ul>
      </div>
      {(quote_id != 0) &&
        <div className="mt-8 relative flex items-center rounded border !border-warning bg-warning-light p-3.5 text-warning before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8 before:border-b-transparent before:border-l-inherit before:border-t-transparent ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180 dark:bg-warning-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
            <IconBellBing className="h-6 w-6" />
          </span>
          <div>
            <p className="ltr:pr-2 rtl:pl-2 text-dark font-bold">
              { t.reference_is_related_to_the_quote } <Link className="btn btn-sm btn-outline-info inline-block font-bold" href={`/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${quote_id}`}>{quote_id}</Link>
            </p>
            <p className="text-dark">{ t.quote_will_be_eliminated }</p>
          </div>
        </div>
      }
      <div className="panel shadow-xl border-[#b7b7b7] border mt-8 sm:px-20 z-20 mb-4">
        <form action="" onSubmit={handleSubmit(onSearch)}>
          <fieldset className="space-y-4">

            <div className="grid grid-cols-1 sm:flex justify-between gap-5">
              <div className="w-1/2 relative">
                <input type={'text'} autoComplete='OFF' {...register("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_part ? "true" : "false"} placeholder={ t.nro_part } className="form-input pr-20 placeholder:" />
                {errors.nro_part && <span className='absolute text-red-400 error block text-xs mt-1' role="alert">{errors.nro_part?.message?.toString()}</span>}

                <div className="flex items-center text-center sm:absolute sm:end-0 sm:bottom-0">
                  <button type="button" onClick={() => clear()} className="btn btn-sm btn-dark hover:bg-gray-900 text-white font-medium rounded-lg"><IconBackSpace className=''></IconBackSpace></button>
                </div>

              </div>
              <Select isClearable={true}
                isSearchable={true}
                id="aplication"
                instanceId={`aplication`}
                menuPosition={'fixed'}
                menuShouldScrollIntoView={false}
                placeholder={t.select_option}
                {...register("application", { required: false })}
                className='w-full'
                options={brands}
                onChange={onChangeSelectRange} />
              <button type="submit" className="btn btn-primary">{t.btn_search}</button>
              <button type="button" className="btn btn-success" onClick={() => handleNew()}>{t.btn_new}</button>
            </div>


          </fieldset>
        </form>
      </div>

      <Modal size={'w-full max-w-xl'} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>

      {(items.length > 0) && <TableItems t={t} quote_id={quote_id} NroParte={NroParte} items={items} options={options} token={token} brands={brands} updateItem={updateItem} deleteItem={deleteItem} validateItem={validateItem}></TableItems>}


      {(isSearch && items.length == 0)
        &&
        <div className="relative flex items-center rounded border !border-info bg-info-light p-3.5 text-info before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8 before:border-b-transparent before:border-l-inherit before:border-t-transparent ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180 dark:bg-info-dark-light">
          <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
            <IconInfoCircle className="h-6 w-6" />
          </span>
          <h2 className='text-dark'>{t.search_is_empty}</h2>
        </div>
      }

    </>
  );
}