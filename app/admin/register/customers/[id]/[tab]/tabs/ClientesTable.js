'use client';
import { useRouter } from 'next/navigation';
import { DataTable } from 'mantine-datatable';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';

export default function ClientesTable({ data, total, page, pageSize, loading, onPageChange, onStatus, t }) {
  const router = useRouter();

  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">Sin clientes registrados</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <DataTable
        records={data}
        fetching={loading}
        totalRecords={total}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={onPageChange}
        minHeight={200}
        loaderType="dots"
        loaderColor="#4361ee"
        noRecordsText="Sin resultados"
        columns={[
          {
            accessor: 'NomCliente',
            title: 'Cliente',
            render: (c) => (
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{c.NomCliente}</p>
                {c.ActPrincipal && <p className="text-xs text-gray-400 mt-0.5">{c.ActPrincipal}</p>}
              </div>
            ),
          },
          {
            accessor: 'NumNit',
            title: 'Documento',
            render: (c) => c.NumNit
              ? <span className="text-sm">{c.TipDocumento} {c.NumNit}</span>
              : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>,
          },
          {
            accessor: 'NomPais',
            title: 'País / Ciudad',
            render: (c) => (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {[c.NomPais, c.CodCiudad].filter(Boolean).join(' · ')}
              </span>
            ),
          },
          {
            accessor: 'DirCliente',
            title: 'Dirección',
            render: (c) => c.DirCliente
              ? <span className="text-sm text-gray-600 dark:text-gray-400">{c.DirCliente}</span>
              : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>,
          },
          {
            accessor: 'CodEstado',
            title: 'Estado',
            textAlign: 'center',
            render: (c) => (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                ${c.CodEstado === 'AC'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {c.CodEstado === 'AC' ? t.active : t.inactive}
              </span>
            ),
          },
          {
            accessor: 'actions',
            title: '',
            textAlign: 'right',
            render: (c) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  title="Ver / Editar"
                  onClick={() => router.push(`/admin/register/customers/${c.CodCliente}`)}
                  className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition"
                >
                  <IconPencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title={c.CodEstado === 'AC' ? 'Desactivar' : 'Activar'}
                  onClick={() => onStatus(c, c.CodEstado === 'AC' ? 'IN' : 'AC')}
                  className={`rounded-lg p-1.5 transition
                    ${c.CodEstado === 'AC'
                      ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'}`}
                >
                  <IconTrashLines className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        rowClassName="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        classNames={{
          root: 'text-sm',
          header: 'bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
          pagination: 'border-t border-gray-200 dark:border-gray-700 py-3 px-4',
        }}
      />
    </div>
  );
}
