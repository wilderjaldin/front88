'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import axiosClient from '@/app/lib/axiosClient';
import IconUser from '@/components/icon/icon-user';
import IconUsers from '@/components/icon/icon-users';
import IconChartSquare from '@/components/icon/icon-chart-square';
import IconSettings from '@/components/icon/icon-settings';
import IconHome from '@/components/icon/icon-home';
import IconBox from '@/components/icon/icon-box';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';

const URL_DASHBOARD = 'usuarios/dashboard';

export default function UserDashboard() {
  const user = useSelector(selectUser);
  const t    = useTranslation();
  useDynamicTitle('Mi Dashboard');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_DASHBOARD);
      setData(rs.data ?? null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const usuario     = data?.usuario ?? {};
  const empresa      = data?.empresa ?? null; // solo viene para usuarios con rol Representante
  const paises       = data?.paisesPermitidos ?? [];
  // El backend separa "creadas" (las que este usuario originó) de
  // "asignadas" (las que le tocan a él trabajar). Ya no trae pendientes/
  // finalizadas/anuladas ni un bloque "porSeguimiento" aparte — ahora es un
  // único desglose plano por estado de seguimiento (CodSeguimiento).
  const cotizacionesVacias = { enProceso: 0, enviadas: 0, porIdentificar: 0, na: 0, total: 0 };
  const cotizacionesCreadas   = data?.cotizaciones?.creadas   ?? cotizacionesVacias;
  const cotizacionesAsignadas = data?.cotizaciones?.asignadas ?? cotizacionesVacias;
  const ordenes      = data?.ordenes ?? {};
  const pendientesRecibir = ordenes.pendientesRecibir ?? { items: 0, unidades: 0 };
  const productividad     = ordenes.productividad ?? {};
  const mesActual         = productividad.mesActual   ?? { ocs: 0, items: 0 };
  const mesAnterior       = productividad.mesAnterior ?? { ocs: 0, items: 0 };
  const clientes      = data?.clientes ?? 0;
  const repuestosActivos    = data?.repuestosActivosRegistrados    ?? 0;
  const proveedoresActivos  = data?.proveedoresActivosRegistrados  ?? 0;
  const auditoria     = data?.auditoria ?? {};

  const initials = (usuario.nomUsuario ?? user?.name ?? '')
    .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const pct = (value, total) => total > 0 ? `${Math.round((value / total) * 100)}%` : '—';

  // Cada estado de seguimiento tiene su vista filtrada en Órdenes Realizadas
  // (status + supplier=codUsuario del usuario de este dashboard).
  const ordersLink = (statusCode) => `/admin/queries/orders-placed?status=${statusCode}&supplier=${usuario.codUsuario}`;

  const kpiCards = [
    {
      label:  'Cotizaciones en Proceso',
      value:  cotizacionesCreadas.enProceso,
      code:   'EP',
      icon:   <IconChartSquare className="h-7 w-7" />,
      light:  'bg-info/10 text-info',
      border: 'border-info/30',
    },
    {
      label:  'Cotizaciones Enviadas',
      value:  cotizacionesCreadas.enviadas,
      code:   'EN',
      icon:   <IconChartSquare className="h-7 w-7" />,
      light:  'bg-success/10 text-success',
      border: 'border-success/30',
    },
    {
      label:  'Cotizaciones por Identificar',
      value:  cotizacionesCreadas.porIdentificar,
      code:   'ID',
      icon:   <IconChartSquare className="h-7 w-7" />,
      light:  'bg-warning/10 text-warning',
      border: 'border-warning/30',
    },
    {
      label:  'Clientes',
      value:  clientes,
      icon:   <IconUsers className="h-7 w-7" />,
      light:  'bg-primary/10 text-primary',
      border: 'border-primary/30',
    },
    {
      label:  'Repuestos Activos',
      value:  repuestosActivos,
      icon:   <IconBox className="h-7 w-7" />,
      light:  'bg-secondary/10 text-secondary',
      border: 'border-secondary/30',
    },
    {
      label:  'Proveedores Activos',
      value:  proveedoresActivos,
      icon:   <IconShoppingBag className="h-7 w-7" />,
      light:  'bg-danger/10 text-danger',
      border: 'border-danger/30',
    },
  ];

  // Solo "creadas" tiene vista filtrada válida en Órdenes Realizadas — el link
  // por status+supplier no corresponde a "asignadas", así que esa tabla va sin
  // "Detalles" (withLinks = false).
  const breakdownFor = (c, withLinks = true) => [
    { label: 'Cotizaciones en Proceso',      value: c.enProceso,      color: 'text-info',     dot: 'bg-info',    code: withLinks ? 'EP' : null },
    { label: 'Cotizaciones Enviadas',        value: c.enviadas,        color: 'text-success',  dot: 'bg-success', code: withLinks ? 'EN' : null },
    { label: 'Cotizaciones por Identificar', value: c.porIdentificar, color: 'text-warning',  dot: 'bg-warning', code: withLinks ? 'ID' : null },
    { label: 'N/A',                          value: c.na,              color: 'text-gray-500', dot: 'bg-gray-400', code: withLinks ? 'NA' : null },
    { label: 'Total',                        value: c.total,           color: 'text-gray-700 dark:text-gray-200 font-bold', dot: 'bg-gray-400' },
  ];
  const creadasBreakdown   = breakdownFor(cotizacionesCreadas, true);
  const asignadasBreakdown = breakdownFor(cotizacionesAsignadas, false);

  // enProceso = CM, recibidas = LE, anuladas = AN (estados de la OC)
  const ordersBreakdown = [
    { label: 'En Proceso', value: ordenes.enProceso ?? 0, color: 'text-info',    dot: 'bg-info'    },
    { label: 'Recibidas',  value: ordenes.recibidas ?? 0, color: 'text-success', dot: 'bg-success' },
    { label: 'Anuladas',   value: ordenes.anuladas  ?? 0, color: 'text-danger',  dot: 'bg-danger'  },
    { label: 'Total',      value: ordenes.total     ?? 0, color: 'text-gray-700 dark:text-gray-200 font-bold', dot: 'bg-gray-400' },
  ];

  // variacionPorcentaje viene null si el mes anterior tuvo 0 OC
  const variacionOcs = productividad.variacionOcs ?? 0;
  const variacionPct = productividad.variacionPorcentaje;
  const varColor = variacionOcs > 0 ? 'text-success' : variacionOcs < 0 ? 'text-danger' : 'text-gray-500';
  const varSign  = variacionOcs > 0 ? '+' : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="panel flex flex-col sm:flex-row items-start sm:items-center gap-5 border border-primary/20">
        {/* Avatar */}
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl uppercase shrink-0 ring-4 ring-primary/10">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate">{usuario.nomUsuario ?? user?.name ?? '—'}</h1>
          <span className="inline-block mt-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {usuario.rol ?? user?.rol ?? '—'}
          </span>
        </div>

        {usuario.codPais && (
          <div className="flex items-center gap-2 sm:ml-auto shrink-0">
            <img
              src={`/assets/flags/${usuario.codPais.toLowerCase()}.svg`}
              alt={usuario.codPais}
              className="h-8 w-8 rounded-md object-cover shadow ring-2 ring-gray-100 dark:ring-gray-700"
            />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{usuario.nomPais ?? usuario.codPais}</span>
          </div>
        )}
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`panel relative flex items-center gap-4 border ${card.border} ${card.code ? 'pb-6' : ''}`}
          >
            <div className={`${card.light} rounded-xl p-3 shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{card.label}</p>
            </div>
            {card.code && (
              <Link href={ordersLink(card.code)} className="absolute bottom-2 right-3 text-[11px] font-medium text-primary hover:underline">
                Ver más →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── ROW 2: PERFIL (usuario + SMTP + países, agrupado en sub-secciones) ── */}
      <div className="panel space-y-4">
        <SectionHeader icon={<IconUser className="h-4 w-4" />} title="Datos del Usuario" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
          <div>
            <DataRow label="Nombre" value={usuario.nomUsuario ?? '—'} />
            <DataRow label="Rol"    value={usuario.rol        ?? '—'} className="mt-4" />
          </div>
          <div>
            <DataRow label="País"   value={usuario.nomPais   ?? '—'} />
            <DataRow label="Ciudad" value={usuario.nomCiudad ?? '—'} className="mt-4" />
          </div>
          <div>
            <DataRow label="Correo de Acceso" value={usuario.logUsuario ?? '—'} />
            <DataRow label="Estado" value={
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                usuario.codEstado === 'AC' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {usuario.estado ?? '—'}
              </span>
            } className="mt-4" />
          </div>
          <div>
            <DataRow label="Correo SMTP" value={usuario.corElectronico ?? '—'} />
            <DataRow label="Estado SMTP" value={
              !usuario.tienePwdMail ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Sin configurar
                </span>
              ) : usuario.smtpVerificado ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  Verificado
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                  No verificado
                </span>
              )
            } className="mt-4" />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {paises.length === 1 ? 'País Habilitado' : 'Países Habilitados'}
          </p>
          {paises.length === 0 ? (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">—</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {paises.map((p) => (
                <span
                  key={p.value}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 pl-1.5 pr-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  <img
                    src={`/assets/flags/${p.value.toLowerCase()}.svg`}
                    alt={p.label}
                    className="h-3.5 w-[18px] rounded-sm object-cover shrink-0"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MI EMPRESA (solo para usuarios con empresa representada) ─────────── */}
      {empresa && (
        <div className="panel space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SectionHeader icon={<IconHome className="h-4 w-4" />} title="Mi Empresa" />
            <Link href="/admin/register/representative/general" className="no-load text-xs font-medium text-primary hover:underline shrink-0">
              Ver detalle →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
            <div>
              <DataRow label="Razón Social" value={empresa.razSoc ?? '—'} />
              <DataRow label="NIT"          value={empresa.nitEmp ?? '—'} className="mt-4" />
              <DataRow label="Estado" value={
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  empresa.codEstado === 'AC' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {empresa.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                </span>
              } className="mt-4" />
            </div>
            <div>
              <DataRow label="País"      value={empresa.nomPais   ?? '—'} />
              <DataRow label="Ciudad"    value={empresa.nomCiudad ?? '—'} className="mt-4" />
              <DataRow label="Dirección" value={empresa.dirEmp    ?? '—'} className="mt-4" />
            </div>
            <div>
              <DataRow label="Teléfono" value={empresa.telEmp ?? '—'} />
              <DataRow label="Email"    value={empresa.corEle ?? '—'} className="mt-4" />
            </div>
            <div>
              <DataRow label="Moneda" value={empresa.nomMoneda ?? '—'} />
              <DataRow label="% Fee"  value={empresa.porFee != null ? `${Number(empresa.porFee).toFixed(2)}%` : '—'} className="mt-4" />
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 3: COTIZACIONES CREADAS / ASIGNADAS / ÓRDENES DE COMPRA ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="panel space-y-4">
          <SectionHeader icon={<IconChartSquare className="h-4 w-4" />} title="Cotizaciones Creadas" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Cant.</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pr-2">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {creadasBreakdown.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                      <span className={`text-sm ${row.color}`}>{row.label}</span>
                      {row.code && (
                        <Link href={ordersLink(row.code)} className="text-[10px] font-medium text-primary hover:underline shrink-0">
                          Detalles
                        </Link>
                      )}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-semibold ${row.color}`}>{row.value}</td>
                  <td className="py-2.5 text-right text-gray-400 pr-2 text-xs">{row.label === 'Total' ? '' : pct(row.value, cotizacionesCreadas.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel space-y-4">
          <SectionHeader icon={<IconChartSquare className="h-4 w-4" />} title="Cotizaciones Asignadas" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Cant.</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pr-2">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {asignadasBreakdown.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                      <span className={`text-sm ${row.color}`}>{row.label}</span>
                      {row.code && (
                        <Link href={ordersLink(row.code)} className="text-[10px] font-medium text-primary hover:underline shrink-0">
                          Detalles
                        </Link>
                      )}
                    </span>
                  </td>
                  <td className={`py-2.5 text-right font-semibold ${row.color}`}>{row.value}</td>
                  <td className="py-2.5 text-right text-gray-400 pr-2 text-xs">{row.label === 'Total' ? '' : pct(row.value, cotizacionesAsignadas.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel space-y-4">
          <SectionHeader icon={<IconChartSquare className="h-4 w-4" />} title="Órdenes de Compra" />
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {ordersBreakdown.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                    <span className={`text-sm ${row.color}`}>{row.label}</span>
                  </td>
                  <td className={`py-2.5 text-right font-semibold ${row.color}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">OC últimos 30 días</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{ordenes.ultimoMes ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">Pendientes por recibir</span>
              <span className="font-semibold text-warning text-right">
                {pendientesRecibir.items} ítems
                <span className="text-xs font-normal text-gray-400"> · {pendientesRecibir.unidades} unid.</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Productividad</p>
              <span className={`text-xs font-semibold ${varColor}`}>
                {varSign}{variacionOcs} OC{variacionPct != null ? ` (${varSign}${variacionPct}%)` : ''}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-1.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Mes</th>
                  <th className="pb-1.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">OC</th>
                  <th className="pb-1.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Ítems</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                <tr>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Actual</td>
                  <td className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{mesActual.ocs}</td>
                  <td className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{mesActual.items}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600 dark:text-gray-300">Anterior</td>
                  <td className="py-2 text-right text-gray-500">{mesAnterior.ocs}</td>
                  <td className="py-2 text-right text-gray-500">{mesAnterior.items}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── ROW 4: AUDITORÍA ─────────────────────────────────────────────────── */}
      <div className="panel space-y-4">
        <SectionHeader icon={<IconSettings className="h-4 w-4" />} title="Auditoría" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuditCard label="Registrado por" name={auditoria.registradoPor ?? '—'} date={auditoria.fecRegistra ?? '—'} />
          <AuditCard label="Modificado por" name={auditoria.modificadoPor ?? '—'} date={auditoria.fecModifica ?? '—'} />
        </div>
      </div>

    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
      <span className="text-primary">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
    </div>
  );
}

function DataRow({ label, value, className = '' }) {
  return (
    <div className={`space-y-0.5 min-w-0 ${className}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{value}</div>
    </div>
  );
}

function AuditCard({ label, name, date }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-0.5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{name}</p>
      <p className="text-xs text-gray-400">{date}</p>
    </div>
  );
}
