'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import axiosClient from '@/app/lib/axiosClient';
import AccessDenied from '@/components/AccessDenied';

const ROL_REPRESENTANTE = 'Representante';

const TABS = [
  { key: 'general',   label: 'Datos Generales' },
  { key: 'billing',   label: 'Facturación'     },
  { key: 'documents', label: 'Documentos'      },
];

export default function MePage() {
  const user = useSelector(selectUser);
  const t    = useTranslation();
  useDynamicTitle('Mi Empresa');

  const [activeTab, setActiveTab] = useState('general');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.countryCode) { setLoading(false); return; }
    axiosClient.get(`/representantes/detalle-por-pais/${user.countryCode}`)
      .then(res => setData(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.countryCode]);

  if (user?.rol !== ROL_REPRESENTANTE) {
    return <AccessDenied message={`Esta sección es exclusiva para Representantes. Tu rol actual es: ${user?.rol ?? '—'}`} />;
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <li>{t.register}</li>
        <li className="before:content-['/'] before:mx-2">Mi Empresa</li>
      </ul>

      {/* Profile banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#4f46e5] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 -right-4 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl uppercase ring-4 ring-white/30 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white/70 text-xs mb-0.5">Representante</p>
            <h1 className="text-xl font-bold truncate">{user?.name ?? '—'}</h1>
            <span className="inline-block mt-1 text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full">
              {data?.razSoc ?? 'Sin empresa registrada'}
            </span>
          </div>
          {user?.countryCode && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <img
                src={`/assets/flags/${user.countryCode.toLowerCase()}.svg`}
                alt={user.countryCode}
                className="h-7 w-7 rounded object-cover shadow ring-2 ring-white/30"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
              ${activeTab === tab.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === 'general'   && <TabGeneral   data={data} user={user} t={t} />}
            {activeTab === 'billing'   && <TabBilling   data={data} t={t} />}
            {activeTab === 'documents' && <TabDocuments t={t} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Datos Generales ──────────────────────────────────────────────────────
function TabGeneral({ data, user, t }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="rounded-xl border border-primary/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-primary border-b border-gray-100 dark:border-gray-700 pb-2">
          Información Personal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre completo" value={user?.name} />
          <Field label="Usuario"         value={user?.login} />
          <Field label="Rol"             value={user?.rol} />
          <Field label="País"            value={data?.nomPais ?? user?.countryCode} />
          <Field label="Ciudad"          value={data?.nomCiudad ?? user?.cityCode} />
          <Field label="Estado"          value={
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
              Activo
            </span>
          } />
        </div>
      </div>

      <div className="rounded-xl border border-secondary/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-secondary border-b border-gray-100 dark:border-gray-700 pb-2">
          Datos de la Empresa
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Razón Social"    value={data?.razSoc} />
          <Field label="NIT / Documento" value={data?.nitEmp} />
          <Field label="Email"           value={data?.corEle} />
          <Field label="Teléfono"        value={data?.telEmp} />
          <Field label="WhatsApp"        value={data?.numCelWp} />
          <Field label="Sitio Web"       value={data?.dirWeb} />
        </div>
        {data?.dirEmp && (
          <Field label="Dirección" value={data.dirEmp} />
        )}
        {!data && (
          <p className="text-xs text-gray-400 mt-2">* Sin datos registrados</p>
        )}
      </div>

    </div>
  );
}

// ── Tab: Facturación ──────────────────────────────────────────────────────────
function TabBilling({ data, t }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="rounded-xl border border-info/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-info border-b border-gray-100 dark:border-gray-700 pb-2">
          Datos de Facturación
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Razón Social"     value={data?.razSoc} />
          <Field label="NIT"              value={data?.nitEmp} />
          <Field label="Doc. Facturación" value={data?.docFactura} />
          <Field label="Dirección Fiscal" value={data?.dirEmp} />
          <Field label="Ciudad"           value={data?.nomCiudad} />
          <Field label="País"             value={data?.nomPais} />
        </div>
        {!data && (
          <p className="text-xs text-gray-400 mt-2">* Sin datos registrados</p>
        )}
      </div>

      <div className="rounded-xl border border-warning/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-warning border-b border-gray-100 dark:border-gray-700 pb-2">
          Configuración Comercial
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="% Fee"            value={data?.porFee != null ? `${data.porFee}%` : null} />
          <Field label="Destino Entrega"  value={data?.nomDestinoEntrega} />
          <Field label="IVA en precio"    value={data?.blnIvaEnPrecio != null
            ? (data.blnIvaEnPrecio
                ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Sí</span>
                : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800">No</span>)
            : null} />
          <Field label="Es Representante" value={data?.blnEsRepresentante != null
            ? (data.blnEsRepresentante
                ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Sí</span>
                : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800">No</span>)
            : null} />
        </div>
        {!data && (
          <p className="text-xs text-gray-400 mt-2">* Sin datos registrados</p>
        )}
      </div>

    </div>
  );
}

// ── Tab: Documentos ───────────────────────────────────────────────────────────
function TabDocuments({ t }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
      <p className="text-sm font-medium">Documentos</p>
      <p className="text-xs">Próximamente — conectar endpoint</p>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{value ?? '—'}</div>
    </div>
  );
}
