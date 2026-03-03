"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Swal from 'sweetalert2'
import axios from 'axios'
import Select from 'react-select';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_list_customers = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const url_change = process.env.NEXT_PUBLIC_API_URL + 'consulta/CambiarCotizacion';

export default function ChangeQuote() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [customers, setCustomers] = useState([])


  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors },
  } = useForm({});


  useEffect(() => {

    async function fetchData() {
      let res = await getListCustomers();
    }
    fetchData();


  }, []);

  const getListCustomers = async () => {
    try {
      const rs = await axios.post(url_list_customers, { ValToken: token });

      let options_customer = [];
      if (rs.data.estado == 'Ok') {
        rs.data.dato.map((s) => {
          if (s.CodCliente != 0) {
            options_customer.push({ value: s.CodCliente, label: s.NomCliente });
          }
        });
        setCustomers(options_customer);
      }
    } catch (error) {

    }
  }

  const onSubmit = async (data) => {


    try {
      Swal.fire({
        title: t.question_change_quote,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#15803d',
        confirmButtonText: t.yes,
        cancelButtonText: t.no,
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          const data_send = {
            CodClienteActual: data.actual_customer.value,
            CodClienteNuevo: data.new_customer.value,
            CadNroOrden: data.nro_quote,
            ValToken: token
          }
          
          const rs = await axios.post(url_change, data_send);
          if (rs.data.estado == 'Ok') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.change_quote_success,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              setValue('nro_quote', '');
              setValue('actual_customer', null);
              setValue('new_customer', null);
            });
          }
        }
      });




    } catch (error) {

    }
  }

  useDynamicTitle(`${t.query} | ${t.change_quote}`);

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.query}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.change_quote} </span>
          </li>
        </ul>
      </div>

      <div className="panel mt-4 gap-4">
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <fieldset>
            <div className="flex flex-row gap-4">
              <div className="basis-10/12">

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className='space-y-4'>

                    <div>
                      <label htmlFor="actual_customer">{ t.current_customer }</label>
                      <Controller
                        name="actual_customer"
                        control={control}
                        rules={{ required: { value: true, message: t.required_select } }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isClearable
                            options={customers}
                            placeholder={t.select_option}
                            className="w-full"
                          />
                        )}
                      />
                      {errors.actual_customer && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.actual_customer?.message?.toString()}</span>}
                    </div>

                  </div>

                  <div className='space-y-4'>

                    <div>
                      <label htmlFor="new_customer">{ t.new_customer }</label>
                      <Controller
                        name="new_customer"
                        control={control}
                        rules={{ required: { value: true, message: t.required_select } }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isClearable
                            options={customers}
                            placeholder={t.select_option}
                            className="w-full"
                          />
                        )}
                      />
                      {errors.new_customer && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.new_customer?.message?.toString()}</span>}
                    </div>

                  </div>

                  <div>
                    <label htmlFor="nro_quote">{ t.nro_quote }</label>
                    <div className="relative ">
                      <input tabIndex="1" type='text' autoComplete='OFF' defaultValue='' {...register("nro_quote", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_quote ? "true" : "false"} placeholder={t.login.enter_nro_quote} className="form-input placeholder:" />
                      {errors.nro_quote && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_quote?.message?.toString()}</span>}
                    </div>
                  </div>




                </div>

              </div>
              <div className="">
                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">

                  <button type="submit" className="btn btn-success">
                    { t.change_assignment }
                  </button>

                </div>
              </div>
            </div>

          </fieldset>
        </form>
      </div>
    </>
  );
}