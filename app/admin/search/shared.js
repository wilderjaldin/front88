import { createPortal } from 'react-dom';
import Link from 'next/link';

// Portal a document.body: la página está dentro de un ancestro con transform
// (animaciones de layout), que crea un containing block para position:fixed
// y recorta el overlay por debajo del header global. Mismo problema que
// resuelve el Modal de la app usando el Portal interno de Headless UI.
export const SearchingOverlay = () => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Buscando...</p>
    </div>,
    document.body
  );
};

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtMoney = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);

export const CountryFlag = ({ codPais, nomPais }) => {
  if (!codPais) return null;
  return (
    <img
      src={`/assets/flags/${String(codPais).toLowerCase()}.svg`}
      alt={nomPais || codPais}
      title={nomPais || codPais}
      className="h-3 w-4 rounded-sm object-cover shrink-0 inline-block align-middle"
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
};

export const NameWithFlag = ({ name, codPais, nomPais }) => (
  <div className="inline-flex items-center gap-1.5">
    <CountryFlag codPais={codPais} nomPais={nomPais} />
    <span>{name ?? '—'}</span>
  </div>
);

export const EstadoBadge = ({ value, activeLabel = 'Activo' }) => {
  const isActive = value === 'AC';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
      isActive
        ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    }`}>
      {isActive ? activeLabel : (value || '—')}
    </span>
  );
};

export const BoolBadge = ({ val, yesLabel = 'Sí', noLabel = 'No' }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
    val
      ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }`}>
    {val ? yesLabel : noLabel}
  </span>
);

// Mismo patrón que app/admin/queries/orders-placed/page.js, para que esta
// página de búsqueda avanzada se sienta parte del mismo sistema.
export const CreadoPorBadge = ({ creadoPor }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
    creadoPor === 1
      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  }`}>
    {creadoPor === 1 ? 'Cliente' : 'Usuario'}
  </span>
);

const CAT_META = {
  NR: { label: 'Normal',   dot: 'bg-sky-500',    cls: 'bg-sky-50    text-sky-700    border border-sky-200    dark:bg-sky-900/30   dark:text-sky-400   dark:border-sky-800'    },
  SC: { label: 'Sin Cod.', dot: 'bg-amber-500',  cls: 'bg-amber-50  text-amber-700  border border-amber-200  dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'  },
  MA: { label: 'Manual',   dot: 'bg-violet-500', cls: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' },
};
export const CatBadge = ({ cat }) => {
  const m = CAT_META[cat] ?? { label: cat, dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

const QUOTE_OPTION_BY_CAT = { NR: 'quotes', SC: 'quotes-without-code', MA: 'manual' };
export const quoteUrl = (o) =>
  `/admin/revision/quotes?customer=${o.codCliente}&option=${QUOTE_OPTION_BY_CAT[o.tipCot] ?? 'quotes'}&id=${o.nroCotizacion}`;

// Mismo formato que la tabla "Cotizaciones" de searches/nro-parte — reusado
// donde sea que aparezca una lista de cotizaciones (p.ej. "Órdenes de Origen"
// en la búsqueda por Orden de Compra).
export const cotizacionListColumns = [
  { key: 'nomCliente', label: 'Cliente', render: r => (
    <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
  ) },
  { key: 'creadoPor', label: 'Cre.', className: 'text-center', render: r => <CreadoPorBadge creadoPor={r.creadoPor} /> },
  { key: 'nroCotizacion', label: 'Nro. Cotización', className: 'text-center', render: r => (
    <div className="inline-flex items-center gap-2">
      <Link className="font-semibold text-primary hover:underline" href={quoteUrl(r)}>{r.nroCotizacion}</Link>
      <CatBadge cat={r.tipCot} />
    </div>
  ) },
  { key: 'nroItems', label: 'Nro. de Items', className: 'text-center' },
  { key: 'totalSus', label: 'Total $us', className: 'text-right', render: r => fmtMoney(r.totalSus) },
  { key: 'codPais', label: 'País', render: r => <NameWithFlag name={r.nomPais} codPais={r.codPais} nomPais={r.nomPais} /> },
  { key: 'nomCiudad', label: 'Ciudad' },
  { key: 'estado', label: 'Estado', render: r => r.estado || '—' },
  { key: 'fecCotizacion', label: 'Fecha Cotización' },
  { key: 'fecOrden', label: 'Fecha Orden' },
];

// Columnas compartidas entre by-part.js y by-quote.js — mismo shape de
// ordenesCompra/recepciones/embalajes/despachos en ambos endpoints.
export const ordenCompraListColumns = [
  { key: 'numOrdenCompra', label: 'Nro. OC', render: r => (
    <Link className="font-semibold text-primary hover:underline" href={`/admin/queries/purchase-orders?oc=${r.numOrdenCompra}`}>{r.numOrdenCompra}</Link>
  ) },
  { key: 'nroCotizacion', label: 'Nro. Cotización', render: r => (
    <div className="inline-flex items-center gap-2">
      <Link className="text-primary hover:underline" href={quoteUrl({ codCliente: r.codCliente, nroCotizacion: r.nroCotizacion, tipCot: r.tipCot })}>{r.nroCotizacion}</Link>
      <CatBadge cat={r.tipCot} />
    </div>
  ) },
  { key: 'proveedor', label: 'Proveedor', render: r => <NameWithFlag name={r.proveedor} codPais={r.codPaisProveedor} nomPais={r.nomPaisProveedor} /> },
  { key: 'nomPaisDestino', label: 'País Destino', render: r => <NameWithFlag name={r.nomPaisDestino} codPais={r.codPaisDestino} nomPais={r.nomPaisDestino} /> },
  { key: 'canPedida', label: 'Pedida', className: 'text-center' },
  { key: 'canComprada', label: 'Comprada', className: 'text-center' },
  { key: 'canRecibida', label: 'Recibida', className: 'text-center' },
  { key: 'canFaltante', label: 'Faltante', className: 'text-center' },
  { key: 'total', label: 'Total', className: 'text-right', render: r => fmtMoney(r.total) },
  { key: 'fecOrdenCompra', label: 'Fecha', render: r => fmtDate(r.fecOrdenCompra) },
];

export const recepcionListColumns = [
  { key: 'numRecepcion', label: 'Nro. Recepción', className: 'text-center' },
  { key: 'numOrdenCompra', label: 'Nro. Orden Compra', className: 'text-center', render: r => (
    <Link className="text-primary hover:underline" href={`/admin/queries/purchase-orders?oc=${r.numOrdenCompra}`}>{r.numOrdenCompra}</Link>
  ) },
  { key: 'nroCotizacion', label: 'Nro. Orden', className: 'text-center', render: r => (
    <div className="inline-flex items-center gap-1.5">
      <span title={r.tieneNota ? 'Tiene nota' : undefined} className={`h-2 w-2 rounded-full shrink-0 ${r.tieneNota ? 'bg-amber-400 dark:bg-amber-500' : 'invisible'}`} />
      <Link className="text-primary hover:underline" href={quoteUrl({ codCliente: r.codCliente, nroCotizacion: r.nroCotizacion, tipCot: r.catCotizacion })}>{r.nroCotizacion}</Link>
      <CatBadge cat={r.catCotizacion} />
    </div>
  ) },
  { key: 'proveedor', label: 'Proveedor', render: r => (
    <div className="inline-flex items-center gap-1.5">
      <CountryFlag codPais={r.codPaisProveedor} />
      <Link className="text-primary hover:underline" href={`/admin/register/suppliers/${r.codPrv}/general`}>{r.proveedor}</Link>
    </div>
  ) },
  { key: 'canRecibida', label: 'Cant. Recibida', className: 'text-center' },
  { key: 'origen', label: 'Origen', render: r => r.origen || '—' },
  { key: 'intDias', label: 'Días de Proceso', className: 'text-center' },
  { key: 'diasEntrega', label: 'Días Entrega', className: 'text-center' },
  { key: 'nomCliente', label: 'Cliente', render: r => (
    <div className="inline-flex items-center gap-1.5">
      <CountryFlag codPais={r.codPaisCliente} nomPais={r.nomPaisCliente} />
      <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
    </div>
  ) },
  { key: 'numTracking', label: 'Tracking', render: r => r.numTracking || '—' },
  { key: 'nota', label: 'Nota', render: r => r.nota || '—' },
  { key: 'fecRecepcion', label: 'Fecha', render: r => fmtDate(r.fecRecepcion) },
];

export const embalajeListColumns = [
  { key: 'numEmbalaje', label: 'Nro. Embalaje' },
  { key: 'numRecepcion', label: 'Nro. Recepción' },
  { key: 'numOrdenCompra', label: 'Nro. Orden Compra', render: r => (
    <Link className="text-primary hover:underline" href={`/admin/queries/purchase-orders?oc=${r.numOrdenCompra}`}>{r.numOrdenCompra}</Link>
  ) },
  { key: 'nroCotizacion', label: 'Nro. Cotización', render: r => (
    <div className="inline-flex items-center gap-2">
      <Link className="text-primary hover:underline" href={quoteUrl({ codCliente: r.codCliente, nroCotizacion: r.nroCotizacion, tipCot: r.tipCot })}>{r.nroCotizacion}</Link>
      <CatBadge cat={r.tipCot} />
    </div>
  ) },
  { key: 'nomCliente', label: 'Cliente', render: r => (
    <div className="inline-flex items-center gap-1.5">
      <CountryFlag codPais={r.codPaisCliente} nomPais={r.nomPaisCliente} />
      <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
    </div>
  ) },
  { key: 'dirEntrega', label: 'Dirección Entrega', render: r => r.dirEntrega || '—' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'monto', label: 'Monto', className: 'text-right', render: r => fmtMoney(r.monto) },
  { key: 'cantidad', label: 'Cantidad', className: 'text-center' },
  { key: 'origen', label: 'Origen', render: r => r.origen || '—' },
  { key: 'fecEmbalaje', label: 'Fecha', render: r => fmtDate(r.fecEmbalaje) },
];

export const despachoListColumns = [
  { key: 'numEntrega', label: 'Nro. Entrega', render: r => (
    <Link className="font-semibold text-primary hover:underline" href={`/admin/queries/delivery-report/${r.numEntrega}`}>{r.numEntrega}</Link>
  ) },
  { key: 'nomCliente', label: 'Cliente', render: r => (
    <div className="inline-flex items-center gap-1.5">
      <CountryFlag codPais={r.codPaisCliente} />
      <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
    </div>
  ) },
  { key: 'cantidad', label: 'Cantidad', className: 'text-center' },
  { key: 'recibidoPor', label: 'Recibido Por', render: r => r.recibidoPor || '—' },
  { key: 'entregadoPor', label: 'Entregado Por', render: r => r.entregadoPor || '—' },
  { key: 'fecEntrega', label: 'Fecha', render: r => fmtDate(r.fecEntrega) },
];
