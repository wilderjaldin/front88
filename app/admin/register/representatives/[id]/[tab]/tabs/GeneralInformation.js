'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { useRepresentative } from '../../RepresentativeContext';
import RepresentanteFormPage from '../../../form/page';
import IconPencil from '@/components/icon/icon-pencil';
import { useTranslation } from '@/app/locales';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function Field({ label, value, className = '' }) {
  return (
    <div className={`space-y-0.5 min-w-0 ${className}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{value ?? '—'}</div>
    </div>
  );
}

// Todas las secciones viven en un único panel continuo (divide-y) en vez de
// cards sueltas en una grilla de 2 columnas — así la lectura va de arriba
// hacia abajo en un solo carril, sin tener que ir de un lado al otro de la
// pantalla para comparar secciones relacionadas que antes quedaban una al
// lado de la otra.
function Section({ label, children }) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-primary shrink-0" />
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Vista read-only ───────────────────────────────────────────────────────────
function ReadOnlyView({ r, canEdit, onEdit, t }) {
  return (
    <div className="space-y-5">

      {canEdit ? (
        <div className="flex justify-end">
          <button type="button" onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2
                       text-sm font-medium text-warning hover:bg-warning/10 transition">
            <IconPencil className="h-4 w-4" />
            {t.edit_information}
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-4 py-2.5">
          <p className="text-xs text-blue-500 dark:text-blue-400">
            {t.read_only_contact_admin}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">

        <Section label={t.identification}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            <Field label={t.razon_social} value={r.razSoc} className="col-span-2" />
            <Field label={t.doc_invoice}         value={r.docFactura} />
            <Field label={t.nit_identification} value={r.nitEmp} />
            <Field label={t.status} value={
              r.codEstado
                ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${r.codEstado === 'AC' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {r.codEstado === 'AC' ? t.active : t.inactive}
                  </span>
                : null
            } />
            <Field label={t.country}          value={r.pais    ?? r.codPais}   />
            <Field label={t.city}             value={r.ciudad  ?? r.codCiudad} />
            {r.estadoEmp && <Field label={t.state_province} value={r.estadoEmp} />}
            {r.codZipEmp && <Field label={t.zip_code}       value={r.codZipEmp} />}
            <Field label={t.address} value={r.dirEmp} className="col-span-2 sm:col-span-4" />
          </div>
        </Section>

        <Section label={t.contact}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {r.nomContacto && <Field label={t.contact_name} value={r.nomContacto} className="col-span-2" />}
            <Field label={t.phone} value={r.telEmp} />
            <Field label={t.email}    value={r.corEle} />
            <Field label={t.whatsapp} value={r.numCelWp
              ? <span className="flex items-center gap-1 text-green-600">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {r.numCelWp}
                </span>
              : null
            } />
            <Field label={t.web_site} value={r.dirWeb
              ? <a href={r.dirWeb} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">{r.dirWeb}</a>
              : null
            } />
          </div>
        </Section>

        <Section label={t.commercial_conditions}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            <Field label={t.currency}  value={r.nomMoneda ?? r.tipMoneda} />
            <Field label={t.pct_fee}   value={r.porFee != null ? `${Number(r.porFee).toFixed(2)}%` : null} />
            <Field label={t.vat_in_price} value={
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                ${r.blnIvaEnPrecio ? 'bg-success/10 text-success' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {r.blnIvaEnPrecio ? t.yes_cap : t.no_cap}
              </span>
            } />
            <Field label={t.is_representative} value={
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                ${r.blnEsRepresentante
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {r.blnEsRepresentante ? t.yes_cap : t.no_cap}
              </span>
            } />
            {r.nomDestinoEntrega && (
              <Field label={t.delivery_destination} value={r.nomDestinoEntrega} className="col-span-2 sm:col-span-4" />
            )}
          </div>
        </Section>

        <Section label={t.assigned_users}>
          {(() => {
            // Una empresa ahora puede tener varios usuarios asignados — se
            // contempla el array nuevo (usuarios) y, por compatibilidad, el
            // objeto único viejo (usuario).
            const asignados = Array.isArray(r.usuarios) ? r.usuarios : (r.usuario ? [r.usuario] : []);
            return asignados.length > 0 ? (
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {asignados.map((u, i) => (
                  <div key={u.codUsuario ?? i} className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(u.nomUsuario)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{u.nomUsuario ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.corElectronico ?? u.logUsuario ?? '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t.no_assigned_users}</p>
            );
          })()}
        </Section>

        <Section label={t.parameters}>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            <Field label={t.without_invoice}  value={r.parSFac != null ? Number(r.parSFac).toFixed(2) : null} />
            <Field label={t.invoiced}    value={r.parPor  != null ? Number(r.parPor).toFixed(2)  : null} />
            <Field label={t.import}  value={r.parImp  != null ? Number(r.parImp).toFixed(2)  : null} />
          </div>
        </Section>

      </div>
    </div>
  );
}

// ── Vista edición inline ──────────────────────────────────────────────────────
function EditView({ representante, onSaved, onCancel, t }) {
  const [controles,   setControles]   = useState(null);
  const [formData,    setFormData]    = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Datos propios del formulario (endpoint /editar), no los de /detalle que ya
  // trae `representante` — así el form no depende de la forma que tenga la vista
  // de solo lectura si esta cambia con el tiempo.
  useEffect(() => {
    Promise.all([
      axiosClient.get('/representantes/controles'),
      axiosClient.get(`/representantes/editar/${representante.codEmp}`),
    ])
      .then(([ctrlRes, formRes]) => {
        setControles(ctrlRes.data ?? {});
        setFormData(formRes.data ?? representante);
      })
      .catch(() => {
        setControles({});
        setFormData(representante);
      })
      .finally(() => setLoadingData(false));
  }, []);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">{t.edit_representative}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.edit_representative_hint}</p>
        </div>
      </div>
      <RepresentanteFormPage
        representante={formData}
        controles={controles ?? {}}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GeneralInformation({ representante, isAdmin }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();
  const { setRepresentante, basePath } = useRepresentative();

  // Un representante no edita los datos de la empresa que representa — eso lo
  // pide a un administrador. Solo isAdmin puede entrar en modo edición (esto
  // también bloquea el acceso directo por URL con ?edit=1, no solo el botón).
  const canEdit   = isAdmin;
  const isEditing = canEdit && searchParams.get('edit') === '1';
  const baseUrl   = `${basePath}/general`;

  const handleEdit   = () => router.push(`${baseUrl}?edit=1`);
  const handleCancel = () => router.push(baseUrl);

  const handleSaved = async () => {
    try {
      const res = await axiosClient.get(`/representantes/detalle/${representante.codEmp}`);
      setRepresentante(res.data);
    } catch {}
    router.push(baseUrl);
  };

  if (isEditing) {
    return (
      <EditView
        representante={representante}
        onSaved={handleSaved}
        onCancel={handleCancel}
        t={t}
      />
    );
  }

  return (
    <ReadOnlyView
      r={representante}
      canEdit={canEdit}
      onEdit={handleEdit}
      t={t}
    />
  );
}
