'use client';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconUser from '@/components/icon/icon-user';
import IconUsers from '@/components/icon/icon-users';
import IconChartSquare from '@/components/icon/icon-chart-square';
import IconSettings from '@/components/icon/icon-settings';

export default function UserDashboard() {
  const user = useSelector(selectUser);
  const t    = useTranslation();
  useDynamicTitle('Mi Dashboard');

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const kpiCards = [
    {
      label:   'Cotizaciones Pendientes',
      value:   '—',
      icon:    <IconChartSquare className="h-7 w-7" />,
      bg:      'bg-warning',
      light:   'bg-warning/10 text-warning',
      border:  'border-warning/30',
    },
    {
      label:   'En Proceso',
      value:   '—',
      icon:    <IconChartSquare className="h-7 w-7" />,
      bg:      'bg-info',
      light:   'bg-info/10 text-info',
      border:  'border-info/30',
    },
    {
      label:   'Cotizaciones Finalizadas',
      value:   '—',
      icon:    <IconChartSquare className="h-7 w-7" />,
      bg:      'bg-success',
      light:   'bg-success/10 text-success',
      border:  'border-success/30',
    },
    {
      label:   'Clientes',
      value:   '—',
      icon:    <IconUsers className="h-7 w-7" />,
      bg:      'bg-primary',
      light:   'bg-primary/10 text-primary',
      border:  'border-primary/30',
    },
  ];

  const quotesBreakdown = [
    { label: 'Pendientes',  value: '—', color: 'text-warning',  dot: 'bg-warning'  },
    { label: 'En Proceso',  value: '—', color: 'text-info',     dot: 'bg-info'     },
    { label: 'Finalizadas', value: '—', color: 'text-success',  dot: 'bg-success'  },
    { label: 'Anuladas',    value: '—', color: 'text-danger',   dot: 'bg-danger'   },
    { label: 'Total',       value: '—', color: 'text-gray-700 dark:text-gray-200 font-bold', dot: 'bg-gray-400' },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#4f46e5] p-6 text-white shadow-lg">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-14 -right-4 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl uppercase shrink-0 ring-4 ring-white/30">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm mb-0.5">Bienvenido de nuevo</p>
            <h1 className="text-xl sm:text-2xl font-bold truncate">{user?.name ?? '—'}</h1>
            <span className="inline-block mt-1.5 text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full">
              {user?.rol ?? '—'}
            </span>
          </div>

          {user?.countryCode && (
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <img
                src={`/assets/flags/${user.countryCode.toLowerCase()}.svg`}
                alt={user.countryCode}
                className="h-8 w-8 rounded-md object-cover shadow ring-2 ring-white/30"
              />
              <span className="text-sm font-medium opacity-90">{user.countryCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`panel flex items-center gap-4 border ${card.border}`}
          >
            <div className={`${card.light} rounded-xl p-3 shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: PERFIL + PAÍSES ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Datos del usuario (3/5) */}
        <div className="lg:col-span-3 panel space-y-5">
          <SectionHeader icon={<IconUser className="h-4 w-4" />} title="Datos del Usuario" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DataRow label="Nombre"   value={user?.name        ?? '—'} />
            <DataRow label="Usuario"  value={user?.login       ?? '—'} />
            <DataRow label="Rol"      value={user?.rol         ?? '—'} />
            <DataRow label="País"     value={user?.countryCode ?? '—'} />
            <DataRow label="Ciudad"   value={user?.cityCode    ?? '—'} />
            <DataRow label="Estado"   value={
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                Activo
              </span>
            } />
          </div>
        </div>

        {/* Países permitidos (2/5) */}
        <div className="lg:col-span-2 panel space-y-5">
          <SectionHeader icon={<IconUsers className="h-4 w-4" />} title="Países Permitidos" />

          <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-center h-[120px] text-sm text-gray-400 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide">Sin datos</span>
              <span className="text-xs text-gray-300 dark:text-gray-600">Conectar endpoint</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW 3: COTIZACIONES + AUDITORÍA ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Detalle cotizaciones (3/5) */}
        <div className="lg:col-span-3 panel space-y-4">
          <SectionHeader icon={<IconChartSquare className="h-4 w-4" />} title="Cotizaciones" />

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Cantidad</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pr-2">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {quotesBreakdown.map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                    <span className={`text-sm ${row.color}`}>{row.label}</span>
                  </td>
                  <td className={`py-2.5 text-right font-semibold ${row.color}`}>{row.value}</td>
                  <td className="py-2.5 text-right text-gray-400 pr-2 text-xs">—</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-gray-300 dark:text-gray-600 pt-1">* Datos pendientes de endpoint</p>
        </div>

        {/* Auditoría (2/5) */}
        <div className="lg:col-span-2 panel space-y-4">
          <SectionHeader icon={<IconSettings className="h-4 w-4" />} title="Auditoría" />

          <div className="space-y-3">
            <AuditCard label="Registrado por" name="—" date="—" />
            <AuditCard label="Modificado por" name="—" date="—" />
          </div>

          <p className="text-xs text-gray-300 dark:text-gray-600 pt-1">* Datos pendientes de endpoint</p>
        </div>

      </div>

      {/* ── REPORTES PLACEHOLDER ─────────────────────────────────────────────── */}
      <div className="panel space-y-4">
        <SectionHeader icon={<IconChartSquare className="h-4 w-4" />} title="Reportes" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Ventas', 'Metas', 'Avance'].map((rep) => (
            <div
              key={rep}
              className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-6 flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <IconChartSquare className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{rep}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Próximamente</span>
            </div>
          ))}
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

function DataRow({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{value}</div>
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
