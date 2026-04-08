"use client";
import Image from "next/image";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "../../locales";


export default function CustomDesign() {
  const [showPassword, setShowPassword] = useState(false)
  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', remember: 0 } });
  const onSubmit = async (data) => {
    
   
  
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-100 text-gray-800 antialiased px-4 py-6 flex flex-col justify-center sm:py-12">
        <div className="mt-6">
          <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="mx-auto max-w-lg bg-white shadow-lg border rounded-lg">
              <div className="h-2 bg-yellow-400 rounded-t-md"></div>
              <div className="p-8">
                <h2>{ t.title.custom }</h2>
                <div className="py-2">
                  <span className="px-1 text-sm text-gray-600">{t.custom.email}</span>
                  <input autoComplete='OFF' defaultValue='' {...register("email", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.email ? "true" : "false"} placeholder="" type="text" className="text-md block px-3 py-2  rounded-lg w-full bg-white border-2 border-gray-300 placeholder-gray-600 shadow-md focus:placeholder-gray-500 focus:bg-white focus:border-gray-600 focus:outline-none" />
                  {errors.email && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.email?.message?.toString()}</span>}
                </div>

                <div className="py-2">
                  <span className="px-1 text-sm text-gray-600">{t.custom.nro_part}</span>
                  <input autoComplete='OFF' defaultValue='' {...register("nro_part", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.nro_part ? "true" : "false"} placeholder="" type="text" className="text-md block px-3 py-2  rounded-lg w-full bg-white border-2 border-gray-300 placeholder-gray-600 shadow-md focus:placeholder-gray-500 focus:bg-white focus:border-gray-600 focus:outline-none" />
                  {errors.nro_part && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.nro_part?.message?.toString()}</span>}
                </div>

                <div className="py-2">
                  <span className="px-1 text-sm text-gray-600">{t.custom.spare_part_number}</span>
                  <input autoComplete='OFF' defaultValue='' {...register("spare_part_number", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.spare_part_number ? "true" : "false"} placeholder="" type="text" className="text-md block px-3 py-2  rounded-lg w-full bg-white border-2 border-gray-300 placeholder-gray-600 shadow-md focus:placeholder-gray-500 focus:bg-white focus:border-gray-600 focus:outline-none" />
                  {errors.spare_part_number && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.spare_part_number?.message?.toString()}</span>}
                </div>
                
               <button className="mt-3 text-lg font-semibold bg-gray-800 w-full text-white rounded-lg px-6 py-3 block shadow-xl hover:text-white hover:bg-black">
                  {t.button.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}