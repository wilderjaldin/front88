'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import IconPencil from '@/components/icon/icon-pencil';
import IconUsers from '@/components/icon/icon-users';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import IconBox from '@/components/icon/icon-box';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconClock from '@/components/icon/icon-clock';
import IconLink from '@/components/icon/icon-link';

const URL_GENERAL = (id) => `/clientes/general/${id}`;

// ── Paleta de acentos, mismo lenguaje visual que el detalle de repuesto ────
const COLORS = {
  blue:   { chipBg: 'bg-blue-50 dark:bg-blue-900/20',     chipText: 'text-blue-600 dark:text-blue-400' },
  green:  { chipBg: 'bg-green-50 dark:bg-green-900/20',   chipText: 'text-green-600 dark:text-green-400' },
  amber:  { chipBg: 'bg-amber-50 dark:bg-amber-900/20',   chipText: 'text-amber-600 dark:text-amber-400' },
  purple: { chipBg: 'bg-purple-50 dark:bg-purple-900/20', chipText: 'text-purple-600 dark:text-purple-400' },
  indigo: { chipBg: 'bg-indigo-50 dark:bg-indigo-900/20', chipText: 'text-indigo-600 dark:text-indigo-400' },
  red:    { chipBg: 'bg-red-50 dark:bg-red-900/20',       chipText: 'text-red-600 dark:text-red-400' },
  slate:  { chipBg: 'bg-slate-100 dark:bg-slate-800/40',  chipText: 'text-slate-500 dark:text-slate-400' },
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800 dark:text-gray-100">
      {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
    </span>
  </div>
);

const SectionTitle = ({ children, color = 'slate', icon, action }) => {
  const c = COLORS[color] ?? COLORS.slate;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center ${c.chipBg} ${c.chipText}`}>
            {icon}
          </span>
        )}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {children}
        </h3>
      </div>
      {action}
    </div>
  );
};

const Badge = ({ color = 'slate', children }) => {
  const map = {
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    red:    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    slate:  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color] ?? map.slate}`}>
      {children}
    </span>
  );
};

const StatCard = ({ color = 'blue', icon, label, value, caption, href, footer }) => {
  const c = COLORS[color] ?? COLORS.blue;
  const IconTag = href ? 'a' : 'span';
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-2 py-3 px-4">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
          {caption && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{caption}</p>}
        </div>
        <IconTag
          {...(href ? { href, target: '_blank', rel: 'noopener noreferrer', title: 'Ver cotizaciones' } : {})}
          className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${c.chipBg} ${c.chipText} ${href ? 'no-load hover:brightness-90 dark:hover:brightness-125 transition cursor-pointer' : ''}`}
        >
          {icon}
        </IconTag>
      </div>
      {footer}
    </div>
  );
};

const splitValues = (val) => {
  if (!val?.trim()) return [];
  if (val.includes(';')) return val.split(';').map(s => s.trim()).filter(Boolean);
  return val.split(/\s+/).map(s => s.trim()).filter(Boolean);
};

const PhoneBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
};

const EmailBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-400">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 dark:bg-sky-500 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function GeneralInformation({ cliente, onEdit, t, general, setGeneral, loadGeneral, setLoadGeneral }) {
  const router = useRouter();

  useEffect(() => {
    if (!loadGeneral) return;
    axiosClient.get(URL_GENERAL(cliente.codCliente))
      .then(res => setGeneral(res.data))
      .catch(() => {})
      .finally(() => setLoadGeneral(false));
  }, [loadGeneral]);

  if (loadGeneral || !general) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const g = general;
  const idioma = g.cliIdioma === 'ES' ? 'Español' : g.cliIdioma === 'US' ? 'English' : g.cliIdioma;

  // ── Datos nuevos del contrato (confirmado contra GET /clientes/general/{id}) ──
  const comercial   = g.resumenComercial ?? null;
  const entregas    = g.resumenEntregas ?? null;

  // ultimaCotizacion: { nroCotizacion, fecCotizacion (ya viene formateada como
  // texto, no se re-parsea), estado } — sin monto en este contrato
  const ultimaCot      = comercial?.ultimaCotizacion;
  const ultimaCotNro   = ultimaCot?.nroCotizacion;
  const ultimaCotFecha = ultimaCot?.fecCotizacion;

  const quotesListUrl = `/admin/queries/orders-placed?customer=${cliente.codCliente}`;
  const quoteUrl = ultimaCotNro
    ? `/admin/revision/quotes?customer=${cliente.codCliente}&option=quotes&id=${ultimaCotNro}`
    : null;

  const goToTab = (tab) => router.push(`/admin/register/customers/${cliente.codCliente}/${tab}`);

  const hasResumen = comercial || entregas;

  return (
    <div className="space-y-6">

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-6">

        {/* Información (incluye Ubicación, ya no queda una sección casi vacía aparte) */}
        <div>
          <SectionTitle
            color="blue"
            icon={<IconInfoCircle className="h-3.5 w-3.5" />}
            action={
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-medium
                           text-white shadow-sm hover:bg-primary/90 transition"
              >
                <IconPencil className="h-3 w-3" />
                Editar
              </button>
            }
          >
            Información
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Field label="Cliente"       value={g.nomCliente} />
            <Field label="Num. NIT / CI" value={[g.tipDocumento, g.numNit].filter(Boolean).join(' ')} />
            <Field label="Dir. Oficina"  value={g.dirCliente} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Página web</span>
              {g.sitWeb ? (
                <a
                  href={g.sitWeb.match(/^https?:\/\//) ? g.sitWeb : `https://${g.sitWeb}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-load inline-flex items-center gap-1 text-sm text-primary hover:underline truncate"
                >
                  <IconLink className="h-3.5 w-3.5 shrink-0" />
                  {g.sitWeb}
                </a>
              ) : (
                <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
              )}
            </div>
            <Field label="Actividad"     value={g.actPrincipal} />
            <Field label="Reportes en"   value={idioma} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">País</span>
              <span className="flex items-center gap-1.5 text-sm text-gray-800 dark:text-gray-100">
                {g.codPais && (
                  <img
                    src={`/assets/flags/${g.codPais.trim().toLowerCase()}.svg`}
                    alt={g.codPais}
                    className="h-3.5 w-5 rounded-sm object-cover border border-gray-200 dark:border-gray-600 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                {g.nomPais || <span className="text-gray-300 dark:text-gray-600">—</span>}
              </span>
            </div>
            <Field label="Ciudad"        value={g.nomCiudad} />
          </div>
        </div>

        {/* Condiciones Comerciales */}
        <div>
          <SectionTitle color="green" icon={<IconCreditCard className="h-3.5 w-3.5" />}>Condiciones Comerciales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Condición de Pago</span>
              {(g.desConPago || g.conPago)
                ? <Badge color="blue">{g.desConPago || g.conPago}</Badge>
                : <span className="text-sm text-gray-300 dark:text-gray-600">—</span>}
            </div>
            <Field label="Crédito $us" value={g.mtoCredito != null ? Number(g.mtoCredito).toFixed(2) : null} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">% Descuento</span>
              {g.porDescuento ? <Badge color="green">{g.porDescuento}% OFF</Badge> : <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">% IVA</span>
              {g.noConsiderarIva
                ? <Badge color="amber">No considera IVA</Badge>
                : <Badge color="indigo">{g.porIva ?? 0}%</Badge>}
            </div>
            <Field label="Vendedor" value={g.nomVendedor} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Es Revendedor</span>
              <Badge color={g.esRevendedor ? 'green' : 'slate'}>{g.esRevendedor ? 'Sí' : 'No'}</Badge>
            </div>
          </div>
        </div>

        {/* Contacto principal — compacto, sin recuadro destacado (poca info, no amerita tanto peso) */}
        {g.contacto && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <SectionTitle color="amber" icon={<IconUsers className="h-3.5 w-3.5" />}>Contacto Principal</SectionTitle>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center
                                  rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                    {g.contacto.nomContacto?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {g.contacto.nomContacto || '—'}
                    </span>
                    {g.contacto.carContacto && (
                      <span className="text-xs text-gray-400 ml-1.5">· {g.contacto.carContacto}</span>
                    )}
                  </div>
                </div>

                <PhoneBadges value={g.contacto.telContacto} />
                <EmailBadges value={g.contacto.corContacto} />

                <button
                  onClick={() => goToTab('contacts')}
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <IconUsers className="h-3.5 w-3.5" />
                  Contactos
                </button>
              </div>
            </div>
          </>
        )}

        {/* Auditoría */}
        {(g.usuarioRegistra || g.usuarioModifica) && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <SectionTitle color="slate" icon={<IconClock className="h-3.5 w-3.5" />}>Auditoría</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                  bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold text-xs uppercase">
                    {g.usuarioRegistra?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?'}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Registrado por</span>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{g.usuarioRegistra || '—'}</div>
                    {g.fecRegistra && <span className="text-[11px] text-gray-400">{g.fecRegistra}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                  bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold text-xs uppercase">
                    {g.usuarioModifica?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?'}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Modificado por</span>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{g.usuarioModifica || '—'}</div>
                    {g.fecModifica && <span className="text-[11px] text-gray-400">{g.fecModifica}</span>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── Resumen: cotizaciones/órdenes y entregas ─────────────────────────── */}
      {hasResumen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {comercial && (
            <StatCard
              color="blue"
              icon={<IconClipboardText className="h-4.5 w-4.5" />}
              label="Cotizaciones"
              value={comercial.cotizaciones ?? '—'}
              caption={`${comercial.ordenesAbiertas ?? 0} abiertas · ${comercial.ordenesCompletadas ?? 0} completadas`}
              href={quotesListUrl}
              footer={ultimaCot && (
                <a
                  href={quoteUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-load flex items-center justify-between gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Última: </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {ultimaCotNro ? `#${ultimaCotNro}` : '—'}
                    </span>
                    {ultimaCot.estado && (
                      <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        {ultimaCot.estado}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">{ultimaCotFecha ?? '—'}</span>
                </a>
              )}
            />
          )}
          {entregas && (
            <StatCard
              color="indigo"
              icon={<IconBox className="h-4.5 w-4.5" />}
              label="Entregas"
              value={entregas.total ?? '—'}
              caption={entregas.pendientesDespacho != null ? `${entregas.pendientesDespacho} pendientes de despacho` : undefined}
              footer={entregas.ultimaEntrega && (
                <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Última: </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {entregas.ultimaEntrega.numEntrega ? `#${entregas.ultimaEntrega.numEntrega}` : '—'}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">{entregas.ultimaEntrega.fecha ?? '—'}</span>
                </div>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
