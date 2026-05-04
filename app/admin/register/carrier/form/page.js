"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { selectToken } from "@/store/authSlice";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import axios from "axios";
import Swal from "sweetalert2";
import Link from "next/link";

const URL_GET  = process.env.NEXT_PUBLIC_API_URL + 'transportistas/Obtener';
const URL_SAVE = process.env.NEXT_PUBLIC_API_URL + 'transportistas/Guardar';

const COUNTRIES = [
  'ARGENTINA', 'BOLIVIA', 'BRASIL', 'CHILE', 'COLOMBIA', 'ECUADOR',
  'ESTADOS UNIDOS', 'MÉXICO', 'PANAMÁ', 'PARAGUAY', 'PERÚ', 'URUGUAY',
  'VENEZUELA', 'CHINA', 'ALEMANIA', 'ESPAÑA', 'ITALIA', 'JAPÓN', 'REINO UNIDO',
];

const CURRENCIES = ['DÓLARES', 'BOLIVIANOS', 'PESOS', 'SOLES', 'REALES', 'EUROS'];

const TYPES = ['AÉREO', 'TERRESTRE', 'MARÍTIMO', 'COURIER', 'MULTIMODAL'];

export default function CarrierFormPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const id           = searchParams.get("id");
  const isEdit       = Boolean(id);

  useDynamicTitle(isEdit ? "Editar Transportista" : "Nuevo Transportista");

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      NomTransportista:  '',
      Pais:              '',
      NomContacto:       '',
      Direccion:         '',
      Moneda:            '',
      DestinoEntrega:    '',
      TipoTransportista: '',
      TelefonoOficina:   '',
      TelefonoCelular:   '',
      Correo:            '',
      Comision:          0,
      IVAenPrecio:       false,
      EsRepresentacion:  false,
    },
  });

  useEffect(() => {
    if (isEdit) loadCarrier();
  }, [id]);

  const loadCarrier = async () => {
    try {
      const rs = await axios.post(URL_GET, { CodTransportista: id, ValToken: token });
      if (rs.data.estado === 'Ok') reset(rs.data.dato);
    } catch (e) {}
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, ValToken: token };
      if (isEdit) payload.CodTransportista = id;

      const rs = await axios.post(URL_SAVE, payload);
      if (rs.data.estado === 'Ok') {
        Swal.fire({
          title: 'Guardado',
          text: isEdit ? 'Transportista actualizado correctamente.' : 'Transportista registrado correctamente.',
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: 'Cerrar',
        }).then(() => router.push('/admin/register/carrier'));
      } else {
        Swal.fire({ title: 'Error', text: rs.data.mensaje ?? 'No se pudo guardar.', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: 'Cerrar' });
        setIsLoading(false);
      }
    } catch (e) {
      Swal.fire({ title: 'Error de conexión', text: 'No se pudo conectar con el servidor.', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: 'Cerrar' });
      setIsLoading(false);
    }
  };

  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1 block";
  const inputCls = (err) => `form-input w-full${err ? ' border-red-400' : ''}`;
  const selectCls = (err) => `form-select w-full${err ? ' border-red-400' : ''}`;

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex items-center space-x-2 rtl:space-x-reverse text-sm mb-6">
        <li className="text-gray-400">Registro</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <Link href="/admin/register/carrier" className="text-primary hover:text-primary/80 hover:underline">
            Transportistas
          </Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-600 dark:text-gray-400 font-medium">
          {isEdit ? 'Editar' : 'Nuevo'}
        </li>
      </ul>

      <div className="panel">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">

            {/* Columna 1 */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Transportista <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Nombre del transportista"
                  {...register("NomTransportista", { required: "Campo requerido" })}
                  className={inputCls(errors.NomTransportista)}
                />
                {errors.NomTransportista && <span className={errorCls}>{errors.NomTransportista.message}</span>}
              </div>

              <div>
                <label className={labelCls}>País <span className="text-red-500">*</span></label>
                <select
                  {...register("Pais", { required: "Campo requerido" })}
                  className={selectCls(errors.Pais)}
                >
                  <option value="">Seleccionar...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.Pais && <span className={errorCls}>{errors.Pais.message}</span>}
              </div>

              <div>
                <label className={labelCls}>Nombre Contacto</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Nombre del contacto"
                  {...register("NomContacto")}
                  className={inputCls(false)}
                />
              </div>

              <div>
                <label className={labelCls}>Dirección</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Dirección"
                  {...register("Direccion")}
                  className={inputCls(false)}
                />
              </div>

              <div>
                <label className={labelCls}>Moneda</label>
                <select {...register("Moneda")} className={selectCls(false)}>
                  <option value="">Seleccionar...</option>
                  {CURRENCIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Destino Entrega</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Ciudad / destino"
                  {...register("DestinoEntrega")}
                  className={inputCls(false)}
                />
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Tipo</label>
                <select {...register("TipoTransportista")} className={selectCls(false)}>
                  <option value="">Seleccionar...</option>
                  {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Teléfono Oficina</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="+591 2 XXXXXXX"
                  {...register("TelefonoOficina")}
                  className={inputCls(false)}
                />
              </div>

              <div>
                <label className={labelCls}>Celular</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="+591 XXXXXXXX"
                  {...register("TelefonoCelular")}
                  className={inputCls(false)}
                />
              </div>
            </div>

            {/* Columna 3 */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="correo@ejemplo.com"
                  {...register("Correo", {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                  })}
                  className={inputCls(errors.Correo)}
                />
                {errors.Correo && <span className={errorCls}>{errors.Correo.message}</span>}
              </div>

              <div>
                <label className={labelCls}>Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...register("Comision", {
                    min: { value: 0, message: "Debe ser mayor o igual a 0" },
                  })}
                  className={inputCls(errors.Comision)}
                />
                {errors.Comision && <span className={errorCls}>{errors.Comision.message}</span>}
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("IVAenPrecio")}
                    className="form-checkbox w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Incluir IVA en Precio
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("EsRepresentacion")}
                    className="form-checkbox w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Es Representación
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-success disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
                  </span>
                : isEdit ? 'Actualizar' : 'Guardar'
              }
            </button>
            <Link href="/admin/register/carrier" className="btn btn-outline-dark">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
