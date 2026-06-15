'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "@/app/locales";
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Select from 'react-select';
import Loading from '@/components/layouts/loading';
import axiosClient from "@/app/lib/axiosClient";
import Swal from 'sweetalert2';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_REGISTRO_USUARIO = "/usuarios/registro";
const URL_EDITAR_USUARIO   = "/usuarios/editar";
const URL_CIUDADES         = "/usuarios/ciudades";

const UserForm = ({ action_cancel, user, token, updateList, roles, mode, countries }) => {
  const [isLoading,     setLoading]       = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const t = useTranslation();

  const [cities,          setCities]         = useState([]);
  const [current_country, setCurrentCountry] = useState('');
  const [smtp_email,      setSMTPEmail]      = useState('');

  const isEdit = mode === "edit";

  const options_reports = useMemo(() => [
    { value: 'ES', label: t.spanish },
    { value: 'US', label: t.english },
  ], [t]);

  const options_status = useMemo(() => [
    { value: 'AC', label: t.active },
    { value: 'IN', label: t.inactive },
  ], [t]);

  const {
    register, reset,
    handleSubmit, setValue, control, watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', email: '', rol: null, report: 'ES', status: 'AC', blnSeguimiento: false, blnMensaje: false }
  });

  // ── Carga ciudades desde la API dado un codPais ───────────────────────────
  const loadCities = async (codPais, selectedCity = null) => {
    if (!codPais) { setCities([]); return; }
    try {
      setLoadingCities(true);
      const rs = await axiosClient.get(URL_CIUDADES, { params: { codPais } });
      const lista = rs.data ?? [];
      setCities(lista);
      if (selectedCity) {
        const found = lista.find(c => c.value === selectedCity);
        setValue('city', found ?? null);
      }
    } catch (error) {
      console.error("Error cargando ciudades", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // ── Poblar formulario al abrir el modal ──────────────────────────────────
  useEffect(() => {
    if (!user) {
      reset({ name: '', email: '', rol: null, report: 'ES', status: 'AC',
              password_system: '', password_smtp: '' });
      setCities([]);
      setCurrentCountry('');
      setSMTPEmail('');
      return;
    }

    reset({
      rol:             user?.rol      ?? null,
      login:           user?.Username ?? "",
      name:            user?.nombre   ?? '',
      emailUser:       user?.correo   ?? '',
      country:         user?.pais     ?? '',
      city:            null,
      report:          user?.idioma          ?? 'ES',
      status:          user?.estado          ?? 'AC',
      blnSeguimiento:  user?.blnSeguimiento  ?? false,
      blnMensaje:      user?.blnMensaje      ?? false,
      password_system: '',
      password_smtp:   '',
    });

    if (user?.correo) {
      const email = `${user.correo}@daxparts.com`;
      setValue('email', email);
      setSMTPEmail(email);
    }

    setCurrentCountry(user?.pais ?? '');

    if (user?.pais) {
      loadCities(user.pais, user?.ciudad ?? null);
    }
  }, [user]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const data_user = {
        codRol:         data.rol ?? null,
        nomUsuario:     data.name,
        logUsuario:     data.login,
        claUsuario:     data.password_system || null,
        corElectronico: data.email,
        pwdMail:        data.password_smtp,
        usuIdioma:      data.report,
        codPais:        (data.country?.value ?? data.country).toString(),
        codCiudad:      (data.city?.value    ?? data.city   ).toString(),
        codEstado:      data.status,
        blnSeguimiento: data.blnSeguimiento ?? false,
        blnMensaje:     data.blnMensaje     ?? false,
      };

      let rs;
      if (isEdit) {
        rs = await axiosClient.put(URL_EDITAR_USUARIO, { codUsuario: user.codUsuario, ...data_user });
      } else {
        rs = await axiosClient.post(URL_REGISTRO_USUARIO, data_user);
      }

      Swal.fire({
        title: t.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        text: t.customer_success_save,
        confirmButtonText: t.close,
      }).then(() => {
        updateList(rs.data);
        action_cancel();
      });

    } catch (error) {
      const message =
        error.response?.data?.message ??
        (error.request ? "No se pudo conectar con el servidor" : t.customer_error_save);

      Swal.fire({
        title: t.error, text: message, icon: 'error',
        confirmButtonColor: '#dc2626', confirmButtonText: t.close,
      });
    }
  };

  // ── Cambio de país: limpia ciudad y carga nuevas ──────────────────────────
  const changeCountry = (select) => {
    setValue('country', select ?? null);
    setValue('city', null);
    setCities([]);
    if (select?.value) {
      loadCities(select.value);
    }
  };

  // ── Generador de contraseña ───────────────────────────────────────────────
  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums  = "0123456789";
    const spec  = "@#$%&*!";
    const all   = upper + lower + nums + spec;

    let pwd =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      nums [Math.floor(Math.random() * nums.length )] +
      spec [Math.floor(Math.random() * spec.length )];

    for (let i = 4; i < 8; i++) pwd += all[Math.floor(Math.random() * all.length)];
    setValue("password_system", pwd.split('').sort(() => 0.5 - Math.random()).join(''));
  };

  return (
    <>
      {isLoading && <Loading />}
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="text"     name="fakeuser" autoComplete="username"     className="hidden" />
          <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />

          {/* 🔹 FILA 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 🔐 ACCESO AL SISTEMA */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">🔐 Acceso al Sistema</h3>

              {/* NOMBRE */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">Nombre</label>
                <div>
                  <input
                    type="text"
                    {...register("name", { required: { value: true, message: t.required_field } })}
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="Nombre completo"
                  />
                  {errors.name && <span className='text-red-400 block text-xs mt-1'>{errors.name?.message?.toString()}</span>}
                </div>
              </div>

              {/* ROL */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">Rol</label>
                <div>
                  <Controller
                    name="rol"
                    control={control}
                    rules={{ required: { value: true, message: t.required_select } }}
                    render={({ field }) => (
                      <Select
                        options={roles}
                        value={roles.find(r => r.value === field.value) ?? null}
                        onChange={(selected) => field.onChange(selected?.value)}
                      />
                    )}
                  />
                  {errors.rol && <span className='block text-red-400 text-xs mt-1'>{errors.rol?.message?.toString()}</span>}
                </div>
              </div>

              {/* CORREO */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">Correo</label>
                <div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="usuario"
                      className="form-input rounded-r-none"
                      {...register("emailUser", {
                        required: "Campo requerido",
                        pattern: { value: /^[a-zA-Z0-9._]+$/, message: "Solo letras, números, punto y guión bajo" },
                      })}
                      onBlur={(e) => {
                        const username = e.target.value.trim();
                        if (username) {
                          setValue("email", `${username}@daxparts.com`, { shouldValidate: true });
                          setValue("login", username);
                          setSMTPEmail(`${username}@daxparts.com`);
                        }
                      }}
                    />
                    <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm">
                      @daxparts.com
                    </span>
                  </div>
                  {errors.emailUser && <span className="text-red-400 block text-xs mt-1">{errors.emailUser?.message?.toString()}</span>}
                  <input type="hidden" {...register("email", { required: { value: true, message: t.required_field } })} />
                  {errors.email && <span className="text-red-400 block text-xs mt-1">{errors.email?.message?.toString()}</span>}
                </div>
              </div>

              {/* PASSWORD SISTEMA — botón Generar anclado al input, error fuera del relative */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">Contraseña</label>
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("password_system", {
                        required: !isEdit ? { value: true, message: t.required_field } : false,
                        validate: (value) => {
                          if (isEdit && !value) return true;
                          if (value.length < 6) return "Debe tener mínimo 6 caracteres";
                          if (!/^[a-zA-Z0-9]+$/.test(value)) return "Solo caracteres alfanuméricos";
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
                  {/* Error fuera del div relative → el botón no se desplaza */}
                  {errors.password_system && (
                    <span className='text-red-400 block text-xs mt-1'>
                      {errors.password_system?.message?.toString()}
                    </span>
                  )}
                </div>
              </div>

              {/* ESTADO */}
              <div className={`grid grid-cols-[140px_1fr] items-start gap-3 ${errors.status ? "react-select-error" : ""}`}>
                <label className="form-label text-right pt-2">{t.status}</label>
                <div>
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: { value: true, message: t.required_select } }}
                    render={({ field }) => (
                      <Select
                        options={options_status}
                        value={options_status.find(o => o.value === field.value) ?? null}
                        onChange={(selected) => field.onChange(selected?.value)}
                      />
                    )}
                  />
                  {errors.status && <span className='block text-red-400 text-xs mt-1'>{errors.status?.message?.toString()}</span>}
                </div>
              </div>
            </div>

            {/* 📧 CONFIGURACIÓN SMTP */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">📧 Configuración SMTP</h3>
              <div>
                <label className="form-label">Correo SMTP</label>
                <label className='form-input bg-gray-100'>{smtp_email || "---"}</label>
                <p className="text-xs text-gray-500 mt-1">Este correo también se utiliza para acceder al sistema.</p>
              </div>
              <div>
                <label className="form-label">Contraseña del Correo (SMTP)</label>
                <input type="text" {...register("password_smtp")} className="form-input" />
              </div>
            </div>

          </div>

          {/* 🔹 FILA 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <div>
                <label className="form-label required">{t.country}</label>
                <SelectCountry
                  setValue={setValue}
                  current={current_country}
                  t={t}
                  options={countries}
                  control={control}
                  errors={errors}
                  onChange={changeCountry}
                  setLoading={setLoading}
                />
              </div>

              <div>
                <label className="form-label required">{t.city}</label>
                <SelectCity
                  t={t}
                  control={control}
                  errors={errors}
                  cities={cities}
                  isLoading={loadingCities}
                  setValue={setValue}
                  selectedCountry={watch('country')}
                  onCityAdded={({ newCity, ciudades }) => {
                    setCities(ciudades);
                    setValue('city', newCity, { shouldValidate: false });
                  }}
                  instanceId="select-city-user"
                />
              </div>
            </div>

            {/* ⚙️ PREFERENCIAS */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">⚙️ Preferencias</h3>
              <div>
                <label className="form-label">{t.show_reports_in}</label>
                <Controller
                  name="report"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={options_reports}
                      value={options_reports.find(o => o.value === field.value) ?? null}
                      onChange={(selected) => field.onChange(selected?.value)}
                    />
                  )}
                />
              </div>
              <div className="pt-1">
                <label className="form-label mb-2">Notificaciones</label>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("blnSeguimiento")}
                      className="form-checkbox h-4 w-4 rounded text-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Seguimiento</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("blnMensaje")}
                      className="form-checkbox h-4 w-4 rounded text-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mensaje</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={action_cancel} className="btn btn-outline-dark px-5">
              {t.btn_cancel}
            </button>
            <button type="submit" className="btn btn-success px-5 shadow-sm">
              {t.btn_save}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default UserForm;