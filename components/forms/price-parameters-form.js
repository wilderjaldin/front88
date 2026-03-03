'use client';
import React, {  useState } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/CambiarParamPrecio';

const PriceParametersForm = ({ close, token, t, default_value, order, setItems, setOrder }) => {

  const [ disableInput, setDisabledInput] = useState(true)
  const locale = useSelector(getLocale);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { utility: '0', days: '' } });





  const onSave = async (data) => {
    
    try {
      const rs = await axios.post(url, { Idioma: locale, NroOrden: order.NroOrden, Utilidad: data.utility, TiEntrega: data.days, TodosItems: (disableInput) ? 1 : 0, CodItems: data.items, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        close();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.price_parameters_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.price_parameters_quote_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const handleChangeOption = (e) => {
    if(e.target.value == "items"){
      setDisabledInput(false);
    } else {
      setDisabledInput(true);
    }
  }


  return (
    <>

      <div className=''>

        <div className="grid grid-cols-1 gap-6">
          <div className={``}>
            <div className="mb-5">
              <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Default</th>
                      <th>{ t.modify }</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='text-end'>{ t.utility }</td>
                      <td className='text-end'>{default_value}</td>
                      <td className='text-end'>
                        <input type='text' autoComplete='OFF' {...register("utility", { required: { value: true, message: t.required_field } })} aria-invalid={errors.amount ? "true" : "false"} placeholder={t.login.enter_amount} className="form-input placeholder:" />
                        {errors.utility && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.utility?.message?.toString()}</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className='text-end'>{ t.days }</td>
                      <td className='text-end'></td>
                      <td className='text-end'>
                        <input type='text' autoComplete='OFF' {...register("days", { required: false })} aria-invalid={errors.amount ? "true" : "false"} placeholder={t.login.enter_amount} className="form-input placeholder:" />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input onChange={handleChangeOption} type="radio" name="option" value="all" className="form-radio" defaultChecked />
                    <span className="text-white-dark">Todos</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input onChange={handleChangeOption} type="radio" name="option" value="items" className="form-radio" />
                    <span className="text-white-dark">Items</span>
                  </label>
                  <input disabled={disableInput} type='text' autoComplete='OFF' {...register("items", { required: { value: !disableInput, message: t.required_field } })} aria-invalid={errors.amount ? "true" : "false"} placeholder={t.login.enter_amount} 
                  className="form-input border border-dark border-1 placeholder: disabled:border-[#eee] disabled:pointer-events-none disabled:bg-[#eee] dark:disabled:bg-[#1b2e4b]" />
                  <span>(1,2,3) (1-3)</span>
                  {errors.items && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.items?.message?.toString()}</span>}
                </div>


                <div className="my-5">

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button onClick={() => close()} type="button" className="btn btn-dark">
                      {t.btn_cancel}
                    </button>

                    <button type="submit" className="btn btn-success">
                      {t.btn_save}
                    </button>

                  </div>
                </div>

              </form>

            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default PriceParametersForm;
