'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconEdit from '@/components/icon/icon-edit';
import IconFile from '@/components/icon/icon-file';
import IconDollarSignCircle from '@/components/icon/icon-dollar-sign-circle';
import IconBox from '@/components/icon/icon-box';
import IconClock from '@/components/icon/icon-clock';
import IconTag from '@/components/icon/icon-tag';
import IconUser from '@/components/icon/icon-user';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconNotes from '@/components/icon/icon-notes';

const URL_DETAIL = 'repuestos/ver';

// ── Paleta de acentos por categoría ─────────────────────────────────────────
const COLORS = {
  green:  { stripe: 'bg-green-500',  chipBg: 'bg-green-50 dark:bg-green-900/20',   chipText: 'text-green-600 dark:text-green-400',
            badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', text: 'text-green-600 dark:text-green-400' },
  red:    { stripe: 'bg-red-500',    chipBg: 'bg-red-50 dark:bg-red-900/20',       chipText: 'text-red-600 dark:text-red-400',
            badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', text: 'text-red-600 dark:text-red-400' },
  amber:  { stripe: 'bg-amber-500',  chipBg: 'bg-amber-50 dark:bg-amber-900/20',   chipText: 'text-amber-600 dark:text-amber-400',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400' },
  blue:   { stripe: 'bg-blue-500',   chipBg: 'bg-blue-50 dark:bg-blue-900/20',     chipText: 'text-blue-600 dark:text-blue-400',
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', text: 'text-blue-600 dark:text-blue-400' },
  purple: { stripe: 'bg-purple-500', chipBg: 'bg-purple-50 dark:bg-purple-900/20', chipText: 'text-purple-600 dark:text-purple-400',
            badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400' },
  indigo: { stripe: 'bg-indigo-500', chipBg: 'bg-indigo-50 dark:bg-indigo-900/20', chipText: 'text-indigo-600 dark:text-indigo-400',
            badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', text: 'text-indigo-600 dark:text-indigo-400' },
  slate:  { stripe: 'bg-slate-400',  chipBg: 'bg-slate-100 dark:bg-slate-800/40',  chipText: 'text-slate-500 dark:text-slate-400',
            badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', text: 'text-gray-500 dark:text-gray-400' },
};

export default function SpareDetail() {

  const router = useRouter();
  const params = useParams();
  const t      = useTranslation();
  const id     = Number(params.id);

  const [spare,     setSpare]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [imgActiva, setImgActiva] = useState(null);

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
  const fmtDateTime = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return null;

  const isActive = spare?.codEstado === 'AC';

  // ── Estadísticas derivadas ────────────────────────────────────────────────
  const canStock = spare?.canStock ?? 0;
  const canMin   = spare?.canMin   ?? 0;
  const stockColor = canStock === 0 ? 'red' : canStock < canMin ? 'amber' : 'green';
  const stockLabel = canStock === 0 ? 'Sin stock' : canStock < canMin ? 'Stock bajo' : 'Stock normal';

  const vencInfo = (() => {
    if (!spare?.fecVencimiento) return null;
    const days = Math.ceil((new Date(spare.fecVencimiento) - new Date()) / 86400000);
    if (days < 0)   return { label: `${fmtDate(spare.fecVencimiento)} (vencido)`, color: 'red' };
    if (days <= 30) return { label: `${fmtDate(spare.fecVencimiento)} (${days} días)`, color: 'amber' };
    return { label: fmtDate(spare.fecVencimiento), color: null };
  })();

  const pedidoCaption = spare?.blnPedidoEspecial
    ? (spare?.blnPedEspecialSinFecha ? 'Sin fecha definida' : `${fmt(spare?.canDias)} días de espera`)
    : 'Sin pedido especial';

  const imgPrincipal = spare?.imagenes?.find(i => i.esPrincipal) ?? spare?.imagenes?.[0] ?? null;

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
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-md" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => imgPrincipal && setImgActiva(imgPrincipal.urlImagen)}
              disabled={!imgPrincipal}
              className={`flex-shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center
                ${imgPrincipal ? 'hover:ring-2 hover:ring-primary/40 transition cursor-pointer' : 'cursor-default'}`}
            >
              {imgPrincipal ? (
                <img src={imgPrincipal.urlImagen} alt={spare?.nroParte} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-lg tracking-tight">
                  {spare?.nroParte?.slice(0, 2).toUpperCase() ?? 'SP'}
                </span>
              )}
            </button>

            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Nro. de Parte</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                  {spare?.nroParte ?? '—'}
                </h1>
                {spare?.nroParte2 && spare.nroParte2 !== spare.nroParte && (
                  <span
                    title="Número de parte en formato alterno / normalizado"
                    className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-mono"
                  >
                    Alt: {spare.nroParte2}
                  </span>
                )}
                <Badge color={isActive ? 'green' : 'red'}>
                  {isActive ? t.active ?? 'Activo' : t.inactive ?? 'Inactivo'}
                </Badge>
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-2.5 mb-0.5">Descripción</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{spare?.desRepuesto || '—'}</p>

              <div className="flex items-center gap-x-5 gap-y-1.5 mt-2.5 flex-wrap">
                {spare?.proveedor && (
                  <span className="text-xs text-gray-500">
                    <span className="text-gray-400">Proveedor: </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{spare.proveedor}</span>
                  </span>
                )}
                {spare?.tipRepuesto && (
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    Tipo: <Badge color="blue">{spare.tipRepuesto}</Badge>
                  </span>
                )}
                {spare?.estado && (
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    Estado del producto: <Badge color="amber">{spare.estado}</Badge>
                  </span>
                )}
              </div>
            </div>
          </div>

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

      {/* ── Estadísticas ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard
          color="green"
          icon={<IconDollarSignCircle className="h-5 w-5" />}
          label="Costo"
          value={`$${fmtMoney(spare?.costo)}`}
        />
        <StatCard
          color={stockColor}
          icon={<IconBox className="h-5 w-5" />}
          label="Stock"
          value={fmt(spare?.canStock)}
          caption={`mín. ${fmt(spare?.canMin)} ${fmt(spare?.uniMed)}`}
          badge={<Badge color={stockColor}>{stockLabel}</Badge>}
        />
        <StatCard
          color="purple"
          icon={<IconTag className="h-5 w-5" />}
          label="Peso"
          value={`${fmt(spare?.peso)} KG`}
        />
        <StatCard
          color="indigo"
          icon={<IconClock className="h-5 w-5" />}
          label="Disponibilidad"
          value={spare?.blnPedidoEspecial ? 'Pedido Especial' : 'Disponible'}
          caption={pedidoCaption}
        />
      </div>

      {/* ── Clasificación + Disponibilidad + Registro ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <Panel color="blue" icon={<IconTag className="h-3.5 w-3.5" />} title="Clasificación">
          <dl className="space-y-3">
            <Field label="Proveedor"  value={fmt(spare?.proveedor)}   />
            <Field label="Marca"      value={fmt(spare?.marca)}       />
            <Field label="Aplicación" value={fmt(spare?.aplicacion)}  />
            <Field label="Tipo"       value={fmt(spare?.tipRepuesto)} />
            <Field label="Estado"     value={fmt(spare?.estado)}      />
            <Field
              label="Vencimiento"
              value={
                vencInfo
                  ? <span className={vencInfo.color ? COLORS[vencInfo.color].text + ' font-semibold' : ''}>{vencInfo.label}</span>
                  : '—'
              }
            />
          </dl>
        </Panel>

        <Panel color="purple" icon={<IconClock className="h-3.5 w-3.5" />} title="Disponibilidad">
          <dl className="space-y-3">
            <Field label="Pedido Especial" value={<BoolBadge val={spare?.blnPedidoEspecial} />} />
            <Field label="Sin Fecha"       value={<BoolBadge val={spare?.blnPedEspecialSinFecha} />} />
            <Field label="Días de Espera"  value={fmt(spare?.canDias)} />
            <Field label="Cant. Mínima"    value={`${fmt(spare?.canMin)} ${fmt(spare?.uniMed)}`} />
          </dl>
        </Panel>

        <Panel color="slate" icon={<IconUser className="h-3.5 w-3.5" />} title="Registro">
          <dl className="space-y-3">
            <Field label="Registrado por"     value={fmt(spare?.usuarioRegistra)} />
            <Field label="Fecha registro"     value={fmtDate(spare?.fecRegistra)} />
            <Field label="Modificado por"     value={fmt(spare?.usuarioModifica)} />
            <Field label="Fecha modificación" value={fmtDate(spare?.fecModifica)} />
          </dl>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 font-mono tracking-tight">
              ID {fmt(spare?.codRepuesto)} · Prv {fmt(spare?.codPrv)} · Marca {fmt(spare?.codMarca)} · Aplic {fmt(spare?.codAplicacion)}
            </p>
          </div>
        </Panel>

      </div>

      {/* ── Historial de Precios (a todo el ancho, solo si hay cambios) ─────── */}
      {spare?.historial?.length > 0 && (
        <Panel color="green" icon={<IconTrendingUp className="h-3.5 w-3.5" />} title="Historial de Precios" className="mt-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Costo</th>
                  <th className="pb-2 pr-4">Usuario</th>
                  <th className="pb-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {spare.historial.map((h) => (
                  <tr key={h.codRegistro}>
                    <td className="py-2 pr-4 font-semibold text-gray-800 dark:text-gray-100">${fmtMoney(h.costo)}</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{fmt(h.usuario)}</td>
                    <td className="py-2 text-gray-500">{fmtDateTime(h.fecRegistra)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ── Notas Adicionales (a todo el ancho, tarjetas compactas que no se
          estiran — así 1-2 notas cortas no dejan un bloque medio vacío) ────── */}
      {spare?.notasAdicionales?.length > 0 && (
        <Panel color="amber" icon={<IconNotes className="h-3.5 w-3.5" />} title="Notas Adicionales" className="mt-5">
          <div className="flex flex-wrap gap-3">
            {spare.notasAdicionales.map((n, i) => (
              <div key={i} className="w-full sm:w-72 rounded-lg bg-gray-50 dark:bg-gray-800/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{n.nomUsuario}</span>
                  <span className="text-[11px] text-gray-400">{fmtDate(n.fecha)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{n.nota}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Archivos: imágenes y documentos ─────────────────────────────────── */}
      {(spare?.imagenes?.length > 0 || spare?.documentos?.length > 0) && (
        <Panel color="indigo" icon={<IconFile className="h-3.5 w-3.5" />} title="Archivos" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {spare?.imagenes?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Imágenes ({spare.imagenes.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[...spare.imagenes].sort((a, b) => a.orden - b.orden).map((img) => (
                    <button
                      key={img.codImagen}
                      type="button"
                      onClick={() => setImgActiva(img.urlImagen)}
                      title={img.nombre}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary transition"
                    >
                      <img src={img.urlImagen} alt={img.nombre} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {spare?.documentos?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Documentos ({spare.documentos.length})</p>
                <div className="space-y-2">
                  {spare.documentos.map((doc) => (
                    <a
                      key={doc.codDocumento}
                      href={doc.urlDocumento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-primary hover:bg-primary/5 transition"
                    >
                      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <IconFile className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{doc.nombre}</p>
                        <p className="text-[11px] text-gray-400">{fmtDateTime(doc.fecRegistra)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Panel>
      )}

      {/* Lightbox */}
      {imgActiva && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImgActiva(null)}
        >
          <img
            src={imgActiva}
            alt="Vista previa"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setImgActiva(null)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

const Panel = ({ color = 'blue', icon, title, children, className = '' }) => {
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <div className={`panel overflow-hidden relative ${className}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.stripe}`} />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <span className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${c.chipBg} ${c.chipText}`}>
            {icon}
          </span>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
};

const StatCard = ({ color = 'blue', icon, label, value, caption, badge }) => {
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <div className="panel py-4 px-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
          {caption && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{caption}</p>}
        </div>
        <span className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${c.chipBg} ${c.chipText}`}>
          {icon}
        </span>
      </div>
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{label}</dt>
    <dd className="text-sm text-gray-800 dark:text-gray-100 font-medium text-right">{value ?? '—'}</dd>
  </div>
);

const Badge = ({ color = 'slate', children }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${(COLORS[color] ?? COLORS.slate).badge}`}>
    {children}
  </span>
);

const BoolBadge = ({ val }) => (
  <Badge color={val ? 'green' : 'slate'}>{val ? 'Sí' : 'No'}</Badge>
);
