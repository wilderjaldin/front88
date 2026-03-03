'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import FormAddBrand from '@/components/forms/add-brand-form';
import SelectCountry from '@/components/select-country'
import SelectCity from '@/components/select-city'
import Select from 'react-select';
import Loading from '@/components/layouts/loading';
import { getNameOption, getNameCity } from '@/app/options'
import axiosClient from "@/app/lib/axiosClient";
import Swal from 'sweetalert2'
const url_save = 'usuarios/registro';
const url_edit = 'usuarios/editar';

const UserForm = ({ action_cancel, user, show_labels_opc = false, token, updateList, roles, mode, countries, cities_all }) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false)
  const t = useTranslation();
  const [show_labels, setShowLabels] = useState(show_labels_opc)
  
  const [cities, setCities] = useState([]);
  const [current_country, setCurrentCountry] = useState('');
  const [current_city, setCurrentCity] = useState('');
  const [smtp_email, setSMTPEmail] = useState('');

  const isEdit = mode === "edit";

  const options_reports = useMemo(() => [
    { value: 'ES', label: t.spanish },
    { value: 'US', label: t.english },
  ], [t]);

  const options_status = useMemo(() => [
    { value: 'AC', label: t.active },
    { value: 'IN', label: t.inactive }
  ], [t]);

  const {
    register, reset,
    handleSubmit, getValues, setValue, control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      rol: null,
      report: 'ES',
      status: 'AC',
    }
  });



  useEffect(() => {
    if (!user) return;
    console.log('Cambiando...', user)
    reset({
      rol: user?.rol ?? null,
      login: user?.Username ?? "",
      name: user?.nombre ?? '',
      emailUser: user?.correo ?? '',
      country: user?.pais ?? '',
      city: user?.ciudad ?? '',
      report: user?.idioma ?? 'ES',
      status: user?.estado ?? 'AC',
      password_system: '',
      password_smtp: '',
    });
    if(user?.correo){
      setValue('email', (user?.correo+'@daxparts.com') );
      setSMTPEmail(user?.correo+'@daxparts.com');
    }
    setCurrentCountry(user?.pais ?? '');
    if (user?.pais) {
      let selec_cities = cities_all[user?.pais.toUpperCase()] || [];

      setCities(selec_cities);
      setValue('city', null);
      setCurrentCity(null);
    }
    if(user?.ciudad){
      console.log('entro ciudad', user?.ciudad)
      setValue('city', user?.ciudad);
      setCurrentCity(user?.ciudad)
    }

  }, [user]);

  const onSubmit = async (data) => {
    console.log('data', data)
    try {
      let data_user = {
        codRol: data.rol ?? null,
        nomUsuario: data.name,
        logUsuario: data.login,
        claUsuario: data.password_system || null,
        corElectronico: data.email,
        pwdMail: data.password_smtp,
        usuIdioma: data.report,
        codPais: (data.country?.value ?? data.country).toString(),
        codCiudad: (data.city?.value ?? data.city).toString(),
        codEstado: data.status,
      };
      let rs;

      if (mode === "edit") {
        console.log('editanto', data_user)
        console.log(user)
        rs = await axiosClient.put(url_edit, {
          codUsuario: user.codUsuario,
          ...data_user
        });

      } else {
        console.log('creando', data_user)
        rs = await axiosClient.post(url_save, data_user);
      }

      Swal.fire({
        title: t.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        text: t.customer_success_save,
        confirmButtonText: t.close
      }).then(async (r) => {
        updateList(rs.data);
        if (!user?.IdCliente) {
          action_cancel();
        }

      });


    } catch (error) {
      console.log(error)
      let message = t.customer_error_save;

      if (error.response) {
        message = error.response.data?.message ?? message;
      } else if (error.request) {
        message = "No se pudo conectar con el servidor";
      }

      Swal.fire({
        title: t.error,
        text: message,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const changeCountry = (select) => {

    let selec_cities = cities_all[select.value.toUpperCase()] || [];

    setCities(selec_cities);
    setValue('city', null);
    setCurrentCity(null);
    setValue('country', (select) ?? null);
  }

  const changeCity = (select) => {
    const currentValues = getValues();

    reset({
      ...currentValues,
      city: (select?.value) ?? null
    });
  }

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "@#$%&*!";

    const all = upper + lower + numbers + special;

    let password =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    setValue("password_system", password);
  };



  return (
    <>
      {isLoading && <Loading />}
      <div className={``}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="text" name="fakeuser" autoComplete="username" className="hidden" />
          <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />
          {/* 🔹 FILA 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 🔐 ACCESO AL SISTEMA */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                🔐 Acceso al Sistema
              </h3>

              {/* NOMBRE */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="form-label required text-right">
                  Nombre
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    {...register("name", { required: { value: true, message: t.required_field } })}
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="Nombre completo"
                  />
                  {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
                </div>
              </div>

              {/* ROL */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="form-label required text-right">
                  Rol
                </label>
                <div>
                  <Controller
                    name="rol"
                    control={control}
                    rules={{ required: { value: true, message: t.required_select } }}
                    render={({ field }) => (
                      <Select
                        options={roles}
                        value={roles.find(r => r.value === field.value)}
                        onChange={(selected) => field.onChange(selected?.value)}
                      />
                    )}
                  />
                  <div className='block'>
                    {errors.rol && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.rol?.message?.toString()}</span>}
                  </div>
                </div>
              </div>

              {/* CORREO */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="form-label required text-right">
                  Correo
                </label>

                <div className="relative flex-1">
                  <div className="relative flex-1">
                    {/* Input usuario */}
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="usuario"
                        className="form-input rounded-r-none"
                        {...register("emailUser", {
                          required: "Campo requerido",
                          pattern: {
                            value: /^[a-zA-Z0-9._]+$/,
                            message: "Solo letras, números, punto y guión bajo",
                          },
                        })}
                        onBlur={(e) => {
                          const username = e.target.value.trim();
                          if (username) {
                            setValue("email", `${username}@daxparts.com`, {
                              shouldValidate: true,
                            });
                            setValue("login", `${username}`);
                            setSMTPEmail(`${username}@daxparts.com`);
                          }
                        }}
                      />

                      {/* Dominio fijo */}
                      <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm">
                        @daxparts.com
                      </span>
                    </div>

                    {errors.emailUser && (
                      <span
                        className="text-red-400 error block text-xs mt-1"
                        role="alert"
                      >
                        {errors.emailUser?.message?.toString()}
                      </span>
                    )}

                  </div>

                  {/* Campo oculto registrado en RHF */}
                  <input
                    type="hidden"
                    {...register("email", {
                      required: { value: true, message: t.required_field },
                    })}
                  />

                  {errors.email && (
                    <span
                      className="text-red-400 error block text-xs mt-1"
                      role="alert"
                    >
                      {errors.email?.message?.toString()}
                    </span>
                  )}
                </div>
              </div>

              {/* PASSWORD SISTEMA */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="form-label required text-right">
                  Contraseña
                </label>
                <div className="relative flex-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      {...register("password_system", {
                        required: !isEdit
                          ? { value: true, message: t.required_field }
                          : false,

                        validate: (value) => {
                          // Si está en modo edición y está vacío → válido
                          if (isEdit && !value) return true;

                          // Si tiene valor → validar reglas
                          if (value.length < 6)
                            return "Debe tener mínimo 6 caracteres";

                          if (!/^[a-zA-Z0-9]+$/.test(value))
                            return "Solo caracteres alfanuméricos";

                          return true;
                        }
                      })}
                      className="form-input pr-20"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded-md hover:bg-gray-800 transition"
                    >
                      Generar
                    </button>
                  </div>
                  {errors.password_system && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.password_system?.message?.toString()}</span>}
                </div>
              </div>

              {/* ESTADO */}
              <div className={`grid grid-cols-[140px_1fr] items-center gap-3 ${errors.status ? "react-select-error" : ""} `}>
                <label className="form-label text-right">
                  {t.status}
                </label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: { value: true, message: t.required_select } }}
                  render={({ field }) => (
                    <Select
                      options={options_status}
                      value={options_status.find(o => o.value === field.value)}
                      onChange={(selected) => field.onChange(selected?.value)}
                    />
                  )}
                />
                <div className='block'>
                  {errors.status && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.status?.message?.toString()}</span>}
                </div>
              </div>

            </div>

            {/* 📧 CONFIGURACIÓN SMTP */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                📧 Configuración SMTP
              </h3>

              <div>
                <label className="form-label">Correo SMTP</label>
                <label className='form-input bg-gray-100'>{(smtp_email != "") ? smtp_email : "---"}</label>
                <p className="text-xs text-gray-500 mt-1">
                  Este correo también se utiliza para acceder al sistema.
                </p>
              </div>

              <div>
                <label className="form-label">
                  Contraseña del Correo (SMTP)
                </label>
                <input
                  type="password"
                  {...register("password_smtp", { required: false })}
                  className="form-input"
                />
              </div>

            </div>

          </div>

          {/* 🔹 FILA 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 🌎 UBICACIÓN */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                🌎 Ubicación
              </h3>

              <div>
                <label className="form-label required">{t.country}</label>
                <SelectCountry
                  setValue={setValue}
                  current={current_country}
                  t={t}
                  options={countries}
                  control={control}
                  errors={errors}
                  onChange={(e) => changeCountry(e)}
                  setLoading={setLoading}
                />
              </div>

              <div>
                <label className="form-label required">{t.city}</label>
                <SelectCity
                  setValue={setValue}
                  current={current_city}
                  t={t}
                  control={control}
                  errors={errors}
                  reset={reset}
                  cities={cities}
                  options_countries={countries}
                  onChange={(e) => changeCity(e)}
                />
              </div>
            </div>

            {/* ⚙️ PREFERENCIAS */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                ⚙️ Preferencias
              </h3>

              <div>
                <label className="form-label">{t.show_reports_in}</label>
                <Controller
                  name="report"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={options_reports}
                      value={options_reports.find(o => o.value === field.value)}
                      onChange={(selected) => field.onChange(selected?.value)}
                    />
                  )}
                />
              </div>

            </div>

          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={action_cancel}
              className="btn btn-outline-dark px-5"
            >
              {t.btn_cancel}
            </button>

            <button
              type="submit"
              className="btn btn-success px-5 shadow-sm"
            >
              {t.btn_save}
            </button>
          </div>

        </form>
      </div>

    </>
  );
};

export default UserForm;
