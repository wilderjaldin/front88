'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'mantine-datatable';
import { Pagination } from '@mantine/core';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconToggleOff from '@/components/icon/icon-toggle-off';
import IconSettings from '@/components/icon/icon-settings';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import { useDevice } from '@/context/device-context';
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';

const URL_STATUS = '/clientes/status';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const IDIOMA_LABEL = { ES: 'Español', US: 'Inglés' };

// ── Tarjeta grid ──────────────────────────────────────────────────────────────
const ClienteCard = ({ c, onEdit, onStatus, onSettings }) => (
  <div className="group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">

    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
          {c.nomCliente}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {c.tipDocumento} {c.numNit}
        </p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${c.codEstado === 'AC'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
        }`}>
        {c.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
      </span>
    </div>

    <div className="px-4 py-3 space-y-1.5 text-xs">
      {c.dirCliente && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">Dirección</span>
          <span className="text-gray-700 dark:text-gray-300 truncate">{c.dirCliente}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0">País</span>
        <span className="text-gray-700 dark:text-gray-300">{c.nomPais || '—'}</span>
      </div>
      {c.sitWeb && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">Web</span>
          <a href={c.sitWeb} target="_blank" rel="noopener noreferrer"
            className="text-primary truncate hover:underline">{c.sitWeb}</a>
        </div>
      )}
    </div>

    <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
      <button onClick={() => onEdit(c)} title="Editar"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <IconPencil className="w-4 h-4 text-blue-500" />
      </button>
      <button onClick={() => onStatus(c)} title={c.codEstado === 'AC' ? 'Desactivar' : 'Activar'}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        {c.codEstado === 'AC'
          ? <IconToggleOn className="w-6 h-6 fill-green-500" />
          : <IconToggleOff className="w-6 h-6 text-gray-400" />
        }
      </button>
      <button onClick={() => onSettings(c)} title="Configuraciones"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <IconSettings className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const DatatablesCustomers = ({
  data = [],
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onEdit,
  setData,
  setTotal,
}) => {
  const router = useRouter();
  const { isMobile } = useDevice();
  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  const onSettings = (c) => {
    router.push(`/admin/register/customers?customer=${c.codCliente}&option=general`);
  };

  const handleStatus = async (c) => {
    const nuevoEstado = c.codEstado === 'AC' ? 'IN' : 'AC';
    const accion = nuevoEstado === 'IN' ? 'desactivar' : 'activar';

    const result = await Swal.fire({
      title: `¿Deseas ${accion} este cliente?`,
      text: c.nomCliente,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'IN' ? '#dc2626' : '#16a34a',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axiosClient.post(URL_STATUS, {
        codCliente: c.codCliente,
        codEstado: nuevoEstado,
      });
      setData(res.data.data);
      setTotal(res.data.total);
      Toast.fire({ icon: 'success', title: `Cliente ${nuevoEstado === 'AC' ? 'activado' : 'desactivado'}` });
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cambiar estado' });
    }
  };

  return (
    <div className="space-y-4">

      {/* Toggle lista / grid */}
      <div className="flex items-center justify-end">
        <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button type="button"
            className={`p-2 transition ${view === 'list'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
            onClick={() => setView('list')}>
            <IconListCheck className="h-4 w-4" />
          </button>
          <button type="button"
            className={`p-2 transition ${view === 'grid'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
            onClick={() => setView('grid')}>
            <IconLayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Vista lista — DataTable ── */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="datatables">
            <DataTable
              className="table-hover whitespace-nowrap"
              records={data}
              columns={[
                {
                  title: '',
                  accessor: 'codCliente',
                  render: (c) => (
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => onEdit(c)}
                        title="Editar"
                      >
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => onSettings(c)}
                        title="Configuraciones"
                      >
                        <IconSettings className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleStatus(c)}
                        title={c.codEstado === 'AC' ? 'Desactivar' : 'Activar'}
                      >
                        {c.codEstado === 'AC'
                          ? <IconToggleOn className="w-8 h-8 fill-green-500" />
                          : <IconToggleOff className="w-8 h-8 text-gray-400" />
                        }
                      </button>
                    </div>
                  ),
                },
                {
                  accessor: 'nomCliente',
                  title: 'Cliente',
                  sortable: false,
                },
                {
                  accessor: 'documento',
                  title: 'Documento',
                  sortable: false,
                  render: (c) => (
                    <span className="text-gray-500">
                      {c.tipDocumento} {c.numNit}
                    </span>
                  ),
                },
                {
                  accessor: 'nomPais',
                  title: 'País',
                  sortable: false,
                  render: (c) => <span className="text-gray-500">{c.nomPais || '—'}</span>,
                },
                {
                  accessor: 'codCiudad',
                  title: 'Ciudad',
                  sortable: false,
                  render: (c) => <span className="text-gray-500">{c.codCiudad || '—'}</span>,
                },
                {
                  accessor: 'dirCliente',
                  title: 'Dirección',
                  sortable: false,
                  render: (c) => (
                    <span className="text-gray-500 max-w-[200px] truncate block">
                      {c.dirCliente || '—'}
                    </span>
                  ),
                },
                {
                  accessor: 'cliIdioma',
                  title: 'Idioma',
                  sortable: false,
                  render: (c) => (
                    <span className="text-gray-500">{IDIOMA_LABEL[c.cliIdioma] ?? c.cliIdioma}</span>
                  ),
                },
                {
                  accessor: 'codEstado',
                  title: 'Estado',
                  sortable: false,
                  render: (c) => (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.codEstado === 'AC'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                      }`}>
                      {c.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                    </span>
                  ),
                },
                {
                  accessor: 'auditoria',
                  title: 'Auditoría',
                  sortable: false,
                  render: (c) => (
                    <div className="text-xs space-y-1 leading-tight">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registrado</span>
                          <span className="text-gray-500">{c.fecRegistra}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">
                          {c.usuarioRegistra}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">Modificado</span>
                          <span className="text-gray-500">{c.fecModifica}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">
                          {c.usuarioModifica}
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
              highlightOnHover
              page={page}
              onPageChange={onPageChange}
              totalRecords={total}
              recordsPerPage={pageSize}
              paginationText={({ from, to, totalRecords }) =>
                `${from} - ${to} / ${totalRecords}`
              }
            />
          </div>
        </div>
      )}

      {/* ── Vista grid ── */}
      {view === 'grid' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.map((c) => (
              <ClienteCard
                key={c.codCliente}
                c={c}
                onEdit={onEdit}
                onStatus={handleStatus}
                onSettings={onSettings}
              />
            ))}
          </div>

          {total > pageSize && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(total / pageSize)}
                value={page}
                onChange={onPageChange}
                size="sm"
                radius="xl"
              />
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default DatatablesCustomers;