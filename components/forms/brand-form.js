'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Swal from 'sweetalert2';

const URLS = {
  create: process.env.NEXT_PUBLIC_API_URL + 'repuesto/AdicionarMarcaRepuesto',
  update: process.env.NEXT_PUBLIC_API_URL + 'repuesto/ModificarMarcaRepuesto',
};

export default function BrandForm({ t, token, brand, onSuccess, updateBrandsFile }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      NomMarca: '',
    },
  });

  // 🔁 Cargar datos al editar
  useEffect(() => {
    if (brand) {
      reset({ NomMarca: brand.NomMarca });
    }
  }, [brand, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        ValToken: token,
        NomMarca: data.NomMarca.trim().toUpperCase(),
      };

      let res;

      if (brand?.CodMarca) {
        res = await axios.post(URLS.update, {
          ...payload,
          CodMarca: brand.CodMarca,
        });
      } else {
        res = await axios.post(URLS.create, payload);
      }


      Swal.fire({
        position: "top-end",
        icon: "success",
        title: t.brand_save_success,
        showConfirmButton: false,
        timer: 1500
      });

      await updateBrandsFile(res.data?.dato || []);
      onSuccess(res.data?.dato || []);

    } catch (error) {
      Swal.fire(t.error, t.brand_save_error_server, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">
          {t.brand}
        </label>

        <input
          type="text"
          autoComplete="off"
          {...register('NomMarca', {
            required: { value: true, message: t.required_field },
            maxLength: { value: 50, message: t.max_50_characters },
          })}
          className="form-input w-full"
        />

        {errors.NomMarca && (
          <span className="text-red-400 text-xs">
            {errors.NomMarca.message}
          </span>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? t.saving : t.btn_save}
        </button>
      </div>
    </form>
  );
}
