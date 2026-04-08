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

// ─────────────────────────────────────────────────────────────────────────────
export default function SpareDetail() {

  const router = useRouter();
  const params = useParams();
  const t      = useTranslation();
  const id     = Number(params.id);

  const [spare,   setSpare]   = useState(null);
  const [loading, setLoading] = useState(true);

  useDynamicTitle('Detalle Repuesto');

  // ── Carga ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDetail = async () => {
      Swal.fire({
        title:             t.loading ?? 'Cargando...',
        allowOutsideClick: false,
        allowEscapeKey:    false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const rs = await axiosClient.get(`${URL_DETAIL}/${id}`);
        setSpare(rs.data);
      } catch (err) {
        console.error('Error al cargar detalle', err);
        Swal.fire({
          title:              'Error',
          text:               'No se pudo cargar el repuesto',
          icon:               'error',
          confirmButtonColor: '#dc2626',
        }).then(() => router.push('/admin/register/spares'));
      } finally {
        Swal.close();
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (val) => val ?? '—';

  const fmtDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('es-BO', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    });
  };

  const fmtMoney = (val) =>
    val != null
      ? Number(val).toLocaleString('es-BO', { minimumFractionDigits: 2 })
      : '—';

  // ── Badge estado ──────────────────────────────────────────────────────────
  const BadgeEstado = ({ cod }) => {
    const isAC = cod === 'AC';
    return (
      <span className={`badge ${isAC ? 'badge-outline-success' : 'badge-outline-danger'}`}>
        {isAC ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  // ── Fila de dato ──────────────────────────────────────────────────────────
  const Row = ({ label, value }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-100 font-medium">
        {value ?? '—'}
      </span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return null;

  return (
    <div>

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-500">
          <button
            type="button"
            className="hover:text-primary transition"
            onClick={() => router.push('/admin/register/spares')}
          >
            Repuestos
          </button>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Detalle
        </li>
      </ul>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {spare?.nroParte ?? '—'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{spare?.desRepuesto ?? ''}</p>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/register/spares')}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300
            dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <IconArrowBackward className="h-4 w-4" />
            Volver
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/register/spares/form?id=${id}`)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white
            text-sm font-medium hover:bg-primary/90 transition"
          >
            <IconEdit className="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>

      {/* ── Secciones ──────────────────────────────────────────────────────── */}

      {/* Identificación */}
      <div className="panel mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Identificación
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Row label="Nro. Parte"   value={fmt(spare?.nroParte)}    />
          <Row label="Nro. Parte 2" value={fmt(spare?.nroParte2)}   />
          <Row label="Descripción"  value={fmt(spare?.desRepuesto)} />
          <Row label="Estado"       value={<BadgeEstado cod={spare?.codEstado} />} />
        </div>
      </div>

      {/* Clasificación */}
      <div className="panel mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Clasificación
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Row label="Proveedor"       value={fmt(spare?.proveedor)}    />
          <Row label="Marca"           value={fmt(spare?.marca)}        />
          <Row label="Aplicación"      value={fmt(spare?.aplicacion)}   />
          <Row label="Tipo Repuesto"   value={fmt(spare?.tipRepuesto)}  />
          <Row label="Estado Repuesto" value={fmt(spare?.estado)}       />
          <Row label="Vencimiento"     value={fmtDate(spare?.fecVencimiento)} />
        </div>
      </div>

      {/* Datos Comerciales */}
      <div className="panel mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Datos Comerciales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Row label="Peso (lb)"      value={fmt(spare?.peso)}              />
          <Row label="Costo"          value={fmtMoney(spare?.costo)}        />
          <Row label="Cant. Mínima"   value={fmt(spare?.canMin)}            />
          <Row label="Unidad"         value={fmt(spare?.uniMed)}            />
          <Row label="Stock"          value={fmt(spare?.canStock)}          />
        </div>
      </div>

      {/* Pedido Especial */}
      <div className="panel mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Pedido Especial
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Row
            label="Pedido Especial"
            value={spare?.blnPedidoEspecial ? 'Sí' : 'No'}
          />
          <Row label="Días"           value={fmt(spare?.canDias)}           />
          <Row
            label="Sin Fecha"
            value={spare?.blnPedEspecialSinFecha ? 'Sí' : 'No'}
          />
        </div>
      </div>

      {/* Auditoría */}
      <div className="panel">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Registro
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <Row label="Registrado por"   value={fmt(spare?.usuarioRegistra)}          />
          <Row label="Fecha registro"   value={fmtDate(spare?.fecRegistra)}          />
          <Row label="Modificado por"   value={fmt(spare?.usuarioModifica)}          />
          <Row label="Fecha modificación" value={fmtDate(spare?.fecModifica)}        />
        </div>
      </div>

    </div>
  );
}