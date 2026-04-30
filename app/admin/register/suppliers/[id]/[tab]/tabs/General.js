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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label={t.company}              value={general.razSoc} />
          <Field label={t.supplier}             value={general.nomPrv} />
          <Field label={t.country}              value={general.nomPais} />
          <Field label={t.city}                 value={general.nomCiudad} />
          <Field label={t.address}              value={general.dirPrv} />
          <Field label={t.website}              value={general.sitWeb} />
          <Field label={t.phone}                value={general.telPrv} />
          <Field label={t.email}                value={general.corEle} />
          <Field label="Name check"             value={general.nomChe} />
          <Field label={t.doc_type}             value={general.tipDoc} />
          <Field label={t.nro_nit}              value={general.numDoc} />
          <Field label={t.terms_of_payment}     value={general.conPago} />
          <Field label={t.utility}              value={general.mtoCredito != null ? `$${Number(general.mtoCredito).toLocaleString()}` : null} />
          <Field label={t.consider_stock}       value={general.blnStock   ? t.yes : t.no} />
          <Field label="No Express"             value={general.blnExpress ? t.yes : t.no} />
          <Field label={t.days_of_process}      value={general.diasProceso} />
          <Field label="Shipping Express Days"  value={general.diasShipingExpress} />
          <Field label="Shipping Standard Days" value={general.diasShipingStandard} />
          <Field label={t.show_reports_in}      value={idioma} />
        </div>

        {/* Contacto predeterminado */}
        {general.contacto && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t.contact}
                </span>
                {/* Visible siempre en móvil */}
                <button
                  onClick={() => router.push(`/admin/register/suppliers/${id}/contacts`)}
                  className="flex sm:hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs
                             text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition"
                >
                  <IconUsers className="h-3.5 w-3.5" />
                  {t.contacts}
                </button>
              </div>

              {/* Card con hover en desktop */}
              <div className="group relative flex flex-col sm:flex-row sm:items-center gap-4
                              rounded-xl border border-gray-100 dark:border-gray-700
                              bg-gray-50 dark:bg-gray-800/50 px-5 py-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center
                                rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {general.contacto.nomContacto
                    ?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div>
                    <span className="text-gray-400">{t.name}</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{general.contacto.nomContacto || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">{t.position}</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{general.contacto.carContacto || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">{t.phone}</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{general.contacto.telContacto || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">{t.email}</span>
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{general.contacto.corContacto || '—'}</div>
                  </div>
                </div>

                {/* Botón visible solo en hover desktop */}
                <button
                  onClick={() => router.push(`/admin/register/suppliers/${id}/contacts`)}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2
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