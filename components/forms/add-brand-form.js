'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useOptionsSelect } from '@/app/options'
import axios from 'axios'
import Swal from 'sweetalert2'
const url_add_brand = process.env.NEXT_PUBLIC_API_URL + 'repuesto/AdicionarMarcaRepuesto';

const AddBrandForm = ({ setBrands, action_cancel, token, msg_save_success, msg_save_error, msg_save_error_server }) => {

  const [enabled_special_order, setEnableSpecialOrder] = useState(false)
  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: '' } });

  const onSubmit = async (data) => {
    
    try {
      const rs = await axios.post(url_add_brand, { NomMarca: data.name, ValToken: token });
      
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: msg_save_success,
          confirmButtonText: t.close
        }).then(async (r) => {
          //actualizar lista

          let brands = [];
          
          rs.data.dato.map(brand => {
            if(brand.CodMarca > 0){
              brands.push({ value: brand.CodMarca, label: brand.NomMarca });
            }              
          });
          
          

          brands.sort(function (a, b) {
            let x = a.label.toLowerCase();
            let y = b.label.toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
          });

          const response = await fetch("/api/saveFile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: "brands.json",
              folder: "data-runtime",
              content: brands,
            }),
          });
          setBrands(brands);
          ///
          action_cancel();
        });
      } else {
        Swal.fire({
          title: t.error,
          text: msg_save_error + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      
      Swal.fire({
        title: t.error,
        text: msg_save_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div>
            <label htmlFor="name" className='required'>{t.name}</label>
            <div className="relative ">
              <input type='text' autoComplete='OFF' defaultValue='' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
              {errors.name && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
            </div>
          </div>

        </div>



        <div className="mb-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
              {t.btn_cancel}
            </button>

            <button type="submit" className="btn btn-success">
              {t.btn_save}
            </button>

          </div>
        </div>

      </form>

    </>
  );
};

export default AddBrandForm;
