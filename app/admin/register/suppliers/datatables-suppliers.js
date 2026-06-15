'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'mantine-datatable';
import { Pagination } from '@mantine/core';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconTrash from '@/components/icon/icon-trash';
import IconSettings from '@/components/icon/icon-settings';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import { useDevice } from '@/context/device-context';
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';
import { PERMISSIONS } from '@/constants/permissions';

const URL_STATUS = '/proveedores/status';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const SupplierCard = ({ s, t, onEdit, onStatus, onSettings, hasPermission }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">{s.razSoc}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{s.nomPrv}</p>
      </div>
      <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        s.codEst === 'AC'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
      }`}>
        {s.codEst === 'AC' ? t.active : t.inactive}
      </span>
    </div>
    <div className="px-4 py-3 space-y-1.5 text-xs">
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0">📍</span>
        <span className="text-gray-600 dark:text-gray-300">
          {[s.pais || s.codPais, s.ciudad || s.codCiudad].filter(Boolean).join(', ')}
          {s.dirPrv && <span className="block text-gray-400 truncate">{s.dirPrv}</span>}
        </span>
      </div>
      {(s.perCon || s.telPrv || s.corEle) && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">👤</span>
          <div className="text-gray-600 dark:text-gray-300 min-w-0">
            {s.perCon && <div className="truncate">{s.perCon}</div>}
            {s.telPrv && <div className="text-gray-400">{s.telPrv}</div>}
            {s.corEle && <div className="text-gray-400 truncate">{s.corEle}</div>}
          </div>
        </div>
      )}
    </div>
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
      <button onClick={() => onEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <IconPencil className="w-4 h-4 text-blue-500" />
      </button>
      {(hasPermission(PERMISSIONS.ELIMINAR_PROVEEDORES)) &&
        <button onClick={() => onStatus(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          {s.codEst === 'AC' ? <IconTrash className="w-4 h-4 text-red-500" /> : <IconToggleOn className="w-6 h-6 text-gray-400" />}
        </button>
      }
      <button onClick={() => onSettings(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <IconSettings className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  </div>
);

const DatatablesSuppliers = ({
  data = [], total = 0, page = 1, pageSize = 20,
  onPageChange, onEdit, setData, setTotal, t, hasPermission = () => false,
}) => {
  const router = useRouter();
  const { isMobile } = useDevice();
  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  const onSettings  = (s) => router.push(`/admin/register/suppliers/${s.codPrv}/general`);
  const handleEdit   = (s) => onEdit(s);

  const handleStatus = async (s) => {
    const nuevoEstado = s.codEst === 'AC' ? 'IN' : 'AC';
    const accion = nuevoEstado === 'IN' ? 'eliminar' : 'activar';
    const result = await Swal.fire({
      title: `¿Deseas ${accion} este proveedor?`,
      text: s.razSoc,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'IN' ? '#dc2626' : '#16a34a',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await axiosClient.post(URL_STATUS, { CodPrv: s.codPrv, CodEstado: nuevoEstado });
      setData(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      Toast.fire({ icon: 'success', title: nuevoEstado === 'AC' ? 'Proveedor activado' : 'Proveedor eliminado' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cambiar estado' });
    }
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-end">
        <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button type="button"
            className={`p-2 transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => setView('list')}>
            <IconListCheck className="h-4 w-4" />
          </button>
          <button type="button"
            className={`p-2 transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => setView('grid')}>
            <IconLayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="datatables">
            <DataTable
              className="
                whitespace-nowrap text-xs
                [&_thead]:bg-gray-50 [&_thead]:dark:bg-gray-800
                [&_thead_th]:text-[11px] [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide
                [&_thead_th]:text-gray-500 [&_thead_th]:dark:text-gray-400
                [&_tbody_td]:text-xs [&_tbody_td]:text-gray-700 [&_tbody_td]:dark:text-gray-300
                [&_tbody_tr]:transition [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700
              "
              idAccessor="codPrv"
              records={data}
              columns={[
                {
                  title: '', accessor: 'acciones', width: 110,
                  render: (s) => (
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleEdit(s)}>
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => onSettings(s)}>
                        <IconSettings className="w-4 h-4 text-gray-500" />
                      </button>
                      {(hasPermission(PERMISSIONS.ELIMINAR_PROVEEDORES)) &&
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleStatus(s)}>
                        {s.codEst === 'AC'
                          ? <IconTrash className="w-4 h-4 text-red-500" />
                          : <IconToggleOn className="w-8 h-8 text-gray-400" />}
                      </button>
                      }
                    </div>
                  ),
                },
                {
                  accessor: 'razSoc', title: 'Nombre Empresa', sortable: false,
                  render: (s) => (
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{s.razSoc || '—'}</div>
                      <div className="text-xs text-gray-400">{s.nomPrv || ''}</div>
                    </div>
                  ),
                },
                {
                  accessor: 'documento', title: 'Documento', sortable: false,
                  render: (s) => <span className="text-gray-500">{s.documento || '—'}</span>,
                },
                {
                  // País + Ciudad + Dirección en una sola columna
                  accessor: 'pais', title: 'Ubicación', sortable: false,
                  render: (s) => (
                    <div className="text-xs space-y-0.5">
                      <div className="text-gray-700 dark:text-gray-300 font-medium">
                        {[s.pais || s.codPais, s.ciudad || s.codCiudad].filter(Boolean).join(' · ')}
                      </div>
                      {s.dirPrv && (
                        <div className="text-gray-400 max-w-[220px] truncate">{s.dirPrv}</div>
                      )}
                    </div>
                  ),
                },
                {
                  // Contacto + Teléfono + Correo en una sola columna
                  accessor: 'perCon', title: 'Contacto', sortable: false,
                  render: (s) => (
                    <div className="text-xs space-y-0.5">
                      {s.perCon && <div className="text-gray-700 dark:text-gray-300 font-medium">{s.perCon}</div>}
                      {s.telPrv && <div className="text-gray-400">{s.telPrv}</div>}
                      {s.corEle && <div className="text-gray-400 max-w-[180px] truncate">{s.corEle}</div>}
                      {!s.perCon && !s.telPrv && !s.corEle && <span className="text-gray-300">—</span>}
                    </div>
                  ),
                },
                {
                  accessor: 'auditoria', title: 'Auditoría', sortable: false,
                  render: (s) => (
                    <div className="text-xs leading-tight">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400">Registrado</span>
                          <span className="text-gray-500 font-mono">{s.fecRegistra}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{s.usuarioRegistra}</div>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400">Modificado</span>
                          <span className="text-gray-500 font-mono">{s.fecModifica}</span>
                        </div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{s.usuarioModifica}</div>
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
              paginationText={({ from, to, totalRecords }) => `${from} - ${to} / ${totalRecords}`}
            />
          </div>
        </div>
      )}

      {view === 'grid' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.map((s) => (
              <SupplierCard
                key={s.codPrv}
                s={s}
                t={t}
                onEdit={handleEdit}
                onStatus={handleStatus}
                onSettings={onSettings}
                hasPermission={hasPermission}
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

export default DatatablesSuppliers;