'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconEdit from '@/components/icon/icon-edit';

const URL_DETAIL = 'repuestos/ver';

export default function SpareDetail() {

  const router = useRouter();
  const params = useParams();
  const t      = useTranslation();
  const id     = Number(params.id);

  const [spare,   setSpare]   = useState(null);
  const [loading, setLoading] = useState(true);

  useDynamicTitle('Detalle Repuesto');

  useEffect(() => {
    const fetchDetail = async () => {
      Swal.fire({
        title: t.loading ?? 'Cargando...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      try {
        const rs = await axiosClient.get(`${URL_DETAIL}/${id}`);
        setSpare(rs.data);
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el repuesto',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        }).then(() => router.push('/admin/register/spares'));
      } finally {
        Swal.close();
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const fmt     = (val) => val ?? '—';
  const fmtDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const fmtMoney = (val) =>
    val != null ? Number(val).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '—';

  if (loading) return null;

  const isActive = spare?.codEstado === 'AC';

  return (
    <div className="pb-10">

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-500">
          <button type="button" className="hover:text-primary transition"
            onClick={() => router.push('/admin/register/spares')}>
            Repuestos
          </button>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Detalle
        </li>
      </ul>

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="panel mb-5 overflow-hidden relative">
        {/* Franja de color izquierda */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-md" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-4">
          {/* Info principal */}
          <div className="flex items-center gap-4">
            {/* Avatar con iniciales del nroParte */}
            <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg tracking-tight">
                {spare?.nroParte?.slice(0, 2).toUpperCase() ?? 'SP'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                  {spare?.nroParte ?? '—'}
                </h1>
                {spare?.nroParte2 && spare.nroParte2 !== spare.nroParte && (
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-mono">
                    {spare.nroParte2}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {isActive ? t.active ?? 'Activo' : t.inactive ?? 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{spare?.desRepuesto ?? ''}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {spare?.proveedor && (
                  <span className="text-xs text-gray-400">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{spare.proveedor}</span>
                  </span>
                )}
                {spare?.tipRepuesto && (
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {spare.tipRepuesto}
                  </span>
                )}
                {spare?.estado && (
                  <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    {spare.estado}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push('/admin/register/spares')}
              className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300
              dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <IconArrowBackward className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/register/spares/form?id=${id}`)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white
              text-sm font-medium hover:bg-primary/90 transition shadow-sm"
            >
              <IconEdit className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs rápidos ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">

        <div className="panel py-4 px-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Costo</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            ${fmtMoney(spare?.costo)}
          </p>
        </div>

        <div className="panel py-4 px-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Peso (lb)</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {fmt(spare?.peso)}
          </p>
        </div>

        <div className="panel py-4 px-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Stock</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {fmt(spare?.canStock)}
          </p>
        </div>

        <div className="panel py-4 px-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cant. Mínima</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {fmt(spare?.canMin)}
            <span className="text-sm font-normal text-gray-400 ml-1">{fmt(spare?.uniMed)}</span>
          </p>
        </div>

      </div>

      {/* ── Fila inferior: Clasificación + Pedido + Auditoría ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Clasificación */}
        <div className="panel">
          <SectionTitle>Clasificación</SectionTitle>
          <dl className="space-y-3">
            <Field label="Proveedor"       value={fmt(spare?.proveedor)}   />
            <Field label="Marca"           value={fmt(spare?.marca)}       />
            <Field label="Aplicación"      value={fmt(spare?.aplicacion)}  />
            <Field label="Tipo Repuesto"   value={fmt(spare?.tipRepuesto)} />
            <Field label="Estado"          value={fmt(spare?.estado)}      />
            <Field label="Est. Nro. Parte" value={fmt(spare?.estNroParte)} />
            <Field label="Vencimiento"     value={fmtDate(spare?.fecVencimiento)} />
          </dl>
        </div>

        {/* Pedido Especial */}
        <div className="panel">
          <SectionTitle>Pedido Especial</SectionTitle>
          <dl className="space-y-3">
            <Field
              label="Pedido Especial"
              value={
                <BoolBadge val={spare?.blnPedidoEspecial} />
              }
            />
            <Field label="Días" value={fmt(spare?.canDias)} />
            <Field
              label="Sin Fecha"
              value={
                <BoolBadge val={spare?.blnPedEspecialSinFecha} />
              }
            />
          </dl>
        </div>

        {/* Auditoría */}
        <div className="panel">
          <SectionTitle>Registro</SectionTitle>
          <dl className="space-y-3">
            <Field label="Registrado por"      value={fmt(spare?.usuarioRegistra)} />
            <Field label="Fecha registro"      value={fmtDate(spare?.fecRegistra)} />
            <Field label="Modificado por"      value={fmt(spare?.usuarioModifica)} />
            <Field label="Fecha modificación"  value={fmtDate(spare?.fecModifica)} />
          </dl>

          {/* Placeholder secciones futuras */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Próximamente</p>
            <div className="space-y-2">
              {['Repuestos similares', 'Cotizar desde aquí', 'Historial de precios'].map(item => (
                <div key={item}
                  className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 pb-2
    border-b border-gray-100 dark:border-gray-700">
    {children}
  </h2>
);

const Field = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{label}</dt>
    <dd className="text-sm text-gray-800 dark:text-gray-100 font-medium text-right">{value ?? '—'}</dd>
  </div>
);

const BoolBadge = ({ val }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
    val
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }`}>
    {val ? 'Sí' : 'No'}
  </span>
);