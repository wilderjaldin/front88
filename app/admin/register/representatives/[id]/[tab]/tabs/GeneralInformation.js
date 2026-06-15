'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { useRepresentative } from '../../RepresentativeContext';
import RepresentanteFormPage from '../../../form/page';
import IconPencil from '@/components/icon/icon-pencil';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{value ?? '—'}</div>
    </div>
  );
}

function Card({ label, color = 'primary', children }) {
  const border = {
    primary:   'border-primary/20',
    secondary: 'border-secondary/20',
    info:      'border-info/20',
    warning:   'border-warning/20',
  }[color] ?? 'border-gray-200';
  const text = {
    primary:   'text-primary',
    secondary: 'text-secondary',
    info:      'text-info',
    warning:   'text-warning',
  }[color] ?? 'text-gray-700';

  return (
    <div className={`rounded-xl border bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4 ${border}`}>
      <h3 className={`text-sm font-semibold border-b border-gray-100 dark:border-gray-700 pb-2 ${text}`}>
        {label}
      </h3>
      {children}
    </div>
  );
}

// ── Vista read-only ───────────────────────────────────────────────────────────
function ReadOnlyView({ r, canEdit, onEdit }) {
  return (
    <div className="space-y-5">

      {canEdit ? (
        <div className="flex justify-end">
          <button type="button" onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-2
                       text-sm font-medium text-warning hover:bg-warning/10 transition">
            <IconPencil className="h-4 w-4" />
            Editar información
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 px-4 py-2.5">
          <p className="text-xs text-blue-500 dark:text-blue-400">
            Solo lectura. Contacta al administrador para modificar estos datos.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <Card label="Identificación" color="primary">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Razón Social" value={r.razSoc} /></div>
            <Field label="Doc. Factura"         value={r.docFactura} />
            <Field label="NIT / Identificación" value={r.nitEmp} />
            <Field label="Estado" value={
              r.codEstado
                ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${r.codEstado === 'AC' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {r.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                  </span>
                : null
            } />
          </div>
        </Card>

        <Card label="Ubicación" color="secondary">
          <div className="grid grid-cols-2 gap-4">
            <Field label="País"               value={r.pais    ?? r.codPais}   />
            <Field label="Ciudad"             value={r.ciudad  ?? r.codCiudad} />
            {r.estadoEmp && <Field label="Estado / Provincia" value={r.estadoEmp} />}
            {r.codZipEmp && <Field label="Código ZIP"         value={r.codZipEmp} />}
            <div className="col-span-2"><Field label="Dirección" value={r.dirEmp} /></div>
          </div>
        </Card>

        <Card label="Contacto" color="info">
          <div className="grid grid-cols-2 gap-4">
            {r.nomContacto && <div className="col-span-2"><Field label="Nombre de Contacto" value={r.nomContacto} /></div>}
            <Field label="Teléfono" value={r.telEmp} />
            <Field label="Email"    value={r.corEle} />
            <Field label="WhatsApp" value={r.numCelWp
              ? <span className="flex items-center gap-1 text-green-600">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {r.numCelWp}
                </span>
              : null
            } />
            <Field label="Sitio Web" value={r.dirWeb
              ? <a href={r.dirWeb} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block max-w-[160px]">{r.dirWeb}</a>
              : null
            } />
          </div>
        </Card>

        <Card label="Condiciones Comerciales" color="warning">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Moneda"  value={r.nomMoneda ?? r.tipMoneda} />
            <Field label="% Fee"   value={r.porFee != null ? `${Number(r.porFee).toFixed(2)}%` : null} />
            {r.nomDestinoEntrega && (
              <div className="col-span-2"><Field label="Destino Entrega" value={r.nomDestinoEntrega} /></div>
            )}
            <Field label="IVA en precio" value={
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                ${r.blnIvaEnPrecio ? 'bg-success/10 text-success' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {r.blnIvaEnPrecio ? 'Sí' : 'No'}
              </span>
            } />
            <div className="space-y-0.5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Es Representante</p>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border
                ${r.blnEsRepresentante
                  ? 'bg-primary/[0.07] border-primary/30 text-primary dark:bg-primary/15'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {r.blnEsRepresentante ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card label="Parámetros" color="secondary">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Sin Factura"  value={r.parSFac != null ? Number(r.parSFac).toFixed(2) : null} />
              <Field label="Facturado"    value={r.parPor  != null ? Number(r.parPor).toFixed(2)  : null} />
              <Field label="Importación"  value={r.parImp  != null ? Number(r.parImp).toFixed(2)  : null} />
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

// ── Vista edición inline ──────────────────────────────────────────────────────
function EditView({ representante, onSaved, onCancel }) {
  const [controles,       setControles]       = useState(null);
  const [loadingControles, setLoadingControles] = useState(true);

  useEffect(() => {
    axiosClient.get('/representantes/controles')
      .then(res => setControles(res.data))
      .catch(() => setControles({}))
      .finally(() => setLoadingControles(false));
  }, []);

  if (loadingControles) {
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
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">Editar Representante</h2>
          <p className="text-xs text-gray-400 mt-0.5">Modifica los datos del representante</p>
        </div>
      </div>
      <RepresentanteFormPage
        representante={representante}
        controles={controles ?? {}}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GeneralInformation({ representante, isAdmin, isRepresentante }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setRepresentante, basePath } = useRepresentative();

  const canEdit   = isAdmin || isRepresentante;
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
      />
    );
  }

  return (
    <ReadOnlyView
      r={representante}
      canEdit={canEdit}
      onEdit={handleEdit}
    />
  );
}
