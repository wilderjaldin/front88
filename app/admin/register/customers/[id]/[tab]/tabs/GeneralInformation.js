// app/admin/register/customers/[id]/[tab]/tabs/GeneralInformation.js
'use client';

const Field = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800 dark:text-gray-100">
      {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
    </span>
  </div>
);

export default function GeneralInformation({ cliente, onEdit, t }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6 space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Datos Generales</h2>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white
                     hover:bg-primary/90 transition shadow-sm"
        >
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Cliente"           value={cliente.nomCliente} />
        <Field label="Num. NIT / CI"     value={[cliente.tipDocumento, cliente.numNit].filter(Boolean).join(' ')} />
        <Field label="Dir. Oficina"      value={cliente.dirCliente} />
        <Field label="Página web"        value={cliente.sitWeb} />
        <Field label="País"              value={cliente.nomPais} />
        <Field label="Ciudad"            value={cliente.codCiudad} />
        <Field label="Actividad"         value={cliente.actPrincipal} />
        <Field label="Reportes en"       value={cliente.cliIdioma === 'ES' ? 'Español' : 'English'} />
        <Field label="Estado"            value={cliente.codEstado === 'AC' ? t.active : t.inactive} />
      </div>

      {(cliente.usuarioRegistra || cliente.usuarioModifica) && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 text-xs text-gray-400">
          <span>Registrado por: <strong className="text-gray-600 dark:text-gray-300">{cliente.usuarioRegistra ?? '—'}</strong></span>
          <span>Modificado por: <strong className="text-gray-600 dark:text-gray-300">{cliente.usuarioModifica ?? '—'}</strong></span>
        </div>
      )}

    </div>
  );
}
