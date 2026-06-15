'use client';
import { useEffect } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import { useParams, useRouter } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import IconPencil from '@/components/icon/icon-pencil';
import IconUsers from '@/components/icon/icon-users';

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value || '—'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500
                 border-b border-gray-100 dark:border-gray-800 pb-1.5 mb-4">
    {children}
  </h3>
);

// Soporta ";" y espacios como separador
const splitValues = (val) => {
  if (!val?.trim()) return [];
  if (val.includes(';')) return val.split(';').map(s => s.trim()).filter(Boolean);
  return val.split(/\s+/).map(s => s.trim()).filter(Boolean);
};

const PhoneBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-sm font-mono text-slate-700 dark:text-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
};

const EmailBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-sm text-sky-700 dark:text-sky-400">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 dark:bg-sky-500 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
};

export default function GeneralSupplier() {
  const { proveedor, onEdit, general, setGeneral, loadGeneral, setLoadGeneral } = useSupplier();
  const t      = useTranslation();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!loadGeneral) return;
    axiosClient.get(`/proveedores/general/${id}`)
      .then(res => setGeneral(res.data))
      .catch(() => setGeneral(null))
      .finally(() => setLoadGeneral(false));
  }, []);

  if (loadGeneral) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!general) return null;

  const idioma = general.prvIdioma === 'US' ? (t.english ?? 'Inglés') : (t.spanish ?? 'Español');

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          {t.general_data}
        </h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600
                     px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <IconPencil className="h-3.5 w-3.5" />
          {t.btn_edit}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-6">

        {/* ── Identificación ───────────────────────────────────────── */}
        <div>
          <SectionTitle>Identificación</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label={t.supplier}  value={general.nomPrv} />
            <Field label={t.company}   value={general.razSoc} />
            <Field label={t.doc_type}  value={general.desTipDoc || general.tipDoc} />
            <Field label={t.nro_nit}   value={general.numDoc} />
            <Field label="Name check"  value={general.nomChe} />
          </div>
        </div>

        {/* ── Ubicación ─────────────────────────────────────────────── */}
        <div>
          <SectionTitle>Ubicación</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label={t.country}  value={general.nomPais} />
            <Field label={t.city}     value={general.nomCiudad} />
            <Field label={t.address}  value={general.dirPrv} />
            <Field label={t.website}  value={general.sitWeb} />
            <Field label={t.phone}    value={general.telPrv} />
            <Field label={t.email}    value={general.corEle} />
          </div>
        </div>

        {/* ── Condiciones Comerciales ───────────────────────────────── */}
        <div>
          <SectionTitle>Condiciones Comerciales</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label={t.terms_of_payment} value={general.desConPago || general.conPago} />
            <Field label={t.utility}          value={general.mtoCredito != null ? `${Number(general.mtoCredito).toLocaleString()}` : null} />
            <Field label={t.show_reports_in}  value={idioma} />
            <Field label={t.consider_stock}   value={general.blnStock   ? t.yes : t.no} />
            <Field label="No Express"         value={general.blnExpress ? t.yes : t.no} />
          </div>
        </div>

        {/* ── Tiempos Operativos ────────────────────────────────────── */}
        {(general.diasProceso != null || general.diasShipingExpress != null || general.diasShipingStandard != null) && (
          <div>
            <SectionTitle>Tiempos Operativos</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label={t.days_of_process}      value={general.diasProceso} />
              <Field label="Días Shipping Express"  value={general.diasShipingExpress} />
              <Field label="Días Shipping Estándar" value={general.diasShipingStandard} />
            </div>
          </div>
        )}

        {/* ── Contacto predeterminado ───────────────────────────────────── */}
        {general.contacto && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t.contact}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]
                                   font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    Predeterminado
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/admin/register/suppliers/${id}/contacts`)}
                  className="flex sm:hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs
                             text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition"
                >
                  <IconUsers className="h-3.5 w-3.5" />
                  {t.contacts}
                </button>
              </div>

              <div className="group relative flex flex-col sm:flex-row sm:items-start gap-4
                              rounded-xl border border-yellow-200 dark:border-yellow-800/40
                              bg-yellow-50/40 dark:bg-yellow-900/10 px-5 py-4">

                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center
                                rounded-full bg-primary/10 text-primary font-bold text-sm uppercase
                                ring-2 ring-primary/20">
                  {general.contacto.nomContacto
                    ?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nombre y cargo */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {general.contacto.nomContacto || '—'}
                    </div>
                    {general.contacto.carContacto && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {general.contacto.carContacto}
                      </div>
                    )}
                  </div>

                  {/* Teléfonos y correos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        {t.phone}
                      </span>
                      <PhoneBadges value={general.contacto.telContacto} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        {t.email}
                      </span>
                      <EmailBadges value={general.contacto.corContacto} />
                    </div>
                  </div>
                </div>

                {/* Botón hover desktop */}
                <button
                  onClick={() => router.push(`/admin/register/suppliers/${id}/contacts`)}
                  className="hidden sm:flex absolute right-4 top-4
                             items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs
                             text-primary border border-primary/30 bg-white dark:bg-gray-900
                             opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <IconUsers className="h-3.5 w-3.5" />
                  {t.contacts}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Auditoría */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4
                        grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-gray-400">Registrado por</span>
            <div className="font-medium text-gray-700 dark:text-gray-200">{general.usuarioRegistra || '—'}</div>
            <span className="text-gray-400 font-mono">{general.fecRegistra || '—'}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-400">Modificado por</span>
            <div className="font-medium text-gray-700 dark:text-gray-200">{general.usuarioModifica || '—'}</div>
            <span className="text-gray-400 font-mono">{general.fecModifica || '—'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
