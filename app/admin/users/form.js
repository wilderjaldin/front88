'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "@/app/locales";
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Select from 'react-select';
import Loading from '@/components/layouts/loading';
import IconMail from '@/components/icon/icon-mail';
import axiosClient from "@/app/lib/axiosClient";
import { swalSuccess, swalSuccessModal, swalError } from '@/app/lib/swal';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_REGISTRO_USUARIO = "/usuarios/registro";
const URL_EDITAR_USUARIO   = "/usuarios/editar";
const URL_CIUDADES         = "/usuarios/ciudades";
const URL_PROBAR_SMTP      = "/usuarios/probar-smtp";

const UserForm = ({ action_cancel, user, token, updateList, roles, mode, countries }) => {
  const [isLoading,     setLoading]       = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const t = useTranslation();

  const [cities,          setCities]         = useState([]);
  const [current_country, setCurrentCountry] = useState('');

  // ── Prueba de conexión SMTP (stateless — no depende de que el usuario ya exista) ──
  const [testingSmtp, setTestingSmtp] = useState(false);
  // Combinación correo+password sobre la que la última prueba dio "Ok". Si
  // cualquiera de los dos cambia después, deja de contar como verificado.
  const [verifiedSmtp, setVerifiedSmtp] = useState(null);

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
      setVerifiedSmtp(null);
      return;
    }

    reset({
      rol:             user?.rol      ?? null,
      login:           user?.username ?? user?.correo ?? "",
      name:            user?.nombre   ?? '',
      country:         user?.pais     ?? '',
      city:            null,
      report:          user?.idioma          ?? 'ES',
      status:          user?.estado          ?? 'AC',
      blnSeguimiento:  user?.blnSeguimiento  ?? false,
      blnMensaje:      user?.blnMensaje      ?? false,
      password_system: '',
      password_smtp:   '',
    });

    // corElectronico es exclusivo del SMTP y siempre es @daxparts.com; si el
    // detalle no lo trae todavía, cae al viejo derivado desde correo (username local-part).
    const smtpEmail = user?.corElectronico || (user?.correo ? `${user.correo}@daxparts.com` : '');
    if (smtpEmail) {
      setValue('email', smtpEmail);
      setValue('smtpUser', smtpEmail.split('@')[0] ?? '');
    }

    // Si el backend ya tiene la conexión verificada para lo que hay guardado,
    // reflejarlo de entrada (password vacío = "no cambiada" en este load).
    setVerifiedSmtp(user?.smtpVerificado && smtpEmail ? { email: smtpEmail, password: '' } : null);

    setCurrentCountry(user?.pais ?? '');

    if (user?.pais) {
      loadCities(user.pais, user?.ciudad ?? null);
    }
  }, [user]);

  // ── Prueba de conexión SMTP ────────────────────────────────────────────────
  // El backend responde 200 siempre, con { exitoso, mensaje } — el mensaje viene
  // técnico/en inglés (ej. "No se pudo conectar: 535: Authentication Failed"),
  // así que acá lo traducimos a algo entendible en vez de mostrarlo tal cual.
  const translateSmtpError = (rawMessage = '') => {
    const msg = rawMessage.toLowerCase();
    if (msg.includes('535') || msg.includes('authentication') || msg.includes('usuario o contraseña')) {
      return 'Usuario o contraseña incorrectos';
    }
    if (msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('getaddrinfo') || msg.includes('enotfound')) {
      return 'No se pudo conectar con el servidor de correo';
    }
    return 'No se pudo verificar la conexión SMTP';
  };

  const testSmtp = async () => {
    const email    = watch('email');
    const password = watch('password_smtp');

    if (!email) {
      swalError(t.error, "Ingresa el correo primero", t.close);
      return;
    }

    setTestingSmtp(true);
    try {
      const rs = await axiosClient.post(URL_PROBAR_SMTP, { corElectronico: email, pwdMail: password });

      if (rs.data?.exitoso) {
        setVerifiedSmtp({ email, password });
        swalSuccess('Conexión exitosa');
      } else {
        setVerifiedSmtp(null);
        swalError(t.error, translateSmtpError(rs.data?.mensaje), t.close);
      }
    } catch (error) {
      setVerifiedSmtp(null);
      const message = error.request ? "No se pudo conectar con el servidor" : "No se pudo verificar la conexión SMTP";
      swalError(t.error, message, t.close);
    } finally {
      setTestingSmtp(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      // Solo cuenta como verificado si el correo/contraseña no cambiaron desde
      // la última prueba exitosa (si Editar no cambió ninguno de los dos, el
      // backend deja el flag guardado tal cual, sin importar lo que mandemos acá).
      const smtpVerificado = !!(
        verifiedSmtp &&
        verifiedSmtp.email === data.email &&
        verifiedSmtp.password === data.password_smtp
      );

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
        smtpVerificado,
      };

      let rs;
      if (isEdit) {
        rs = await axiosClient.put(URL_EDITAR_USUARIO, { codUsuario: user.codUsuario, ...data_user });
      } else {
        rs = await axiosClient.post(URL_REGISTRO_USUARIO, data_user);
      }

      const successText = isEdit ? "El usuario fue actualizado correctamente" : "El usuario fue registrado correctamente";
      swalSuccessModal(t.success, successText, t.close).then(() => {
        updateList(rs.data);
        action_cancel();
      });

    } catch (error) {
      const message =
        error.response?.data?.message ??
        (error.request ? "No se pudo conectar con el servidor" : "Ocurrió un error al guardar el usuario");

      swalError(t.error, message, t.close);
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

  // Verificado solo cuenta si corresponde al correo/contraseña actuales del form
  const isSmtpVerified = !!(
    verifiedSmtp &&
    verifiedSmtp.email === watch('email') &&
    verifiedSmtp.password === watch('password_smtp')
  );

  return (
    <>
      {isLoading && <Loading />}
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="text"     name="fakeuser" autoComplete="username"     className="hidden" />
          <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />

          {/* 🔹 FILA 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ACCESO AL SISTEMA */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

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

              {/* CORREO (login) — puede ser cualquier dominio: gmail.com, propio.com, etc. */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">Correo</label>
                <div>
                  <input
                    type="email"
                    placeholder="usuario@dominio.com"
                    className="form-input"
                    {...register("login", {
                      required: "Campo requerido",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo inválido" },
                    })}
                  />
                  {errors.login && <span className="text-red-400 block text-xs mt-1">{errors.login?.message?.toString()}</span>}
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
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 border-b pb-1">
                <IconMail className="h-4 w-4 shrink-0" />
                Configuración SMTP
              </h3>

              {isEdit && !isSmtpVerified && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠️ La conexión SMTP no ha sido verificada. Usa "Probar Conexión" antes de guardar.
                </div>
              )}

              <div>
                <label className="form-label required">Correo SMTP</label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="usuario"
                    className="form-input rounded-r-none"
                    {...register("smtpUser", {
                      required: "Campo requerido",
                      pattern: { value: /^[a-zA-Z0-9._]+$/, message: "Solo letras, números, punto y guión bajo" },
                    })}
                    onChange={(e) => {
                      const username = e.target.value.trim();
                      setValue("email", username ? `${username}@daxparts.com` : '', { shouldValidate: true });
                    }}
                  />
                  <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm">
                    @daxparts.com
                  </span>
                </div>
                {errors.smtpUser && <span className="text-red-400 block text-xs mt-1">{errors.smtpUser?.message?.toString()}</span>}
                <input type="hidden" {...register("email", { required: { value: true, message: t.required_field } })} />
              </div>
              <div>
                <label className="form-label">Contraseña del Correo (SMTP)</label>
                <input type="text" {...register("password_smtp")} className="form-input" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={testSmtp}
                  disabled={testingSmtp}
                  className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingSmtp ? "Probando…" : "Probar Conexión"}
                </button>
                {isSmtpVerified && (
                  <span className="text-xs text-green-600 font-medium">✓ Conexión verificada</span>
                )}
              </div>
            </div>

          </div>

          {/* 🔹 FILA 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">

              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">{t.country}</label>
                <div>
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
              </div>

              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label required text-right pt-2">{t.city}</label>
                <div>
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
            </div>

            {/* PREFERENCIAS */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border">
              <div className="grid grid-cols-[140px_1fr] items-start gap-3">
                <label className="form-label text-right pt-2">{t.show_reports_in}</label>
                <div>
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