'use client';
import { useRouter } from 'next/navigation';
import { Pagination } from '@mantine/core';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconTrash from '@/components/icon/icon-trash';
import IconSettings from '@/components/icon/icon-settings';
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalSuccess, swalError } from '@/app/lib/swal';
import { PERMISSIONS } from '@/constants/permissions';

const URL_STATUS = '/proveedores/status';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2 whitespace-nowrap";

const EstadoBadge = ({ codEst, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEst === 'AC'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    }`}>
    {codEst === 'AC' ? t.active : t.inactive}
  </span>
);

const SupplierCard = ({ s, t, onStatus, onSettings, hasPermission }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">{s.razSoc}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{s.nomPrv}</p>
      </div>
      <EstadoBadge codEst={s.codEst} t={t} />
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
      {(hasPermission(PERMISSIONS.ELIMINAR_PROVEEDORES)) &&
        <button onClick={() => onStatus(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          {s.codEst === 'AC' ? <IconTrash className="w-4 h-4 text-red-500" /> : <IconToggleOn className="w-4 h-4 text-gray-400" />}
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
  onPageChange, setData, setTotal, t, hasPermission = () => false,
  view = 'list',
}) => {
  const router = useRouter();

  const onSettings  = (s) => router.push(`/admin/register/suppliers/${s.codPrv}/general`);

  const handleStatus = async (s) => {
    const nuevoEstado = s.codEst === 'AC' ? 'IN' : 'AC';
    const accion = nuevoEstado === 'IN' ? 'eliminar' : 'activar';

    const { isConfirmed } = await swalConfirm(
      `¿Deseas ${accion} este proveedor?`,
      s.razSoc,
      { confirmText: `Sí, ${accion}`, confirmColor: nuevoEstado === 'IN' ? '#dc2626' : '#16a34a' }
    );
    if (!isConfirmed) return;

    try {
      const res = await axiosClient.post(URL_STATUS, { CodPrv: s.codPrv, CodEstado: nuevoEstado });
      setData(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      swalSuccess(nuevoEstado === 'AC' ? 'Proveedor activado' : 'Proveedor eliminado');
    } catch {
      swalError('Error', 'No se pudo cambiar el estado del proveedor');
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Vista lista ── */}
      {view === 'list' && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={`${thClass} w-[70px]`}></th>
                  <th className={thClass}>Nombre Empresa</th>
                  <th className={thClass}>Documento</th>
                  <th className={thClass}>Ubicación</th>
                  <th className={thClass}>Contacto</th>
                  <th className={thClass}>Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((s) => (
                  <tr key={s.codPrv} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} px-2`}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => onSettings(s)}
                          title="Configuraciones"
                        >
                          <IconSettings className="w-4 h-4 text-gray-500" />
                        </button>
                        {(hasPermission(PERMISSIONS.ELIMINAR_PROVEEDORES)) &&
                          <button
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleStatus(s)}
                            title={s.codEst === 'AC' ? 'Eliminar' : 'Activar'}
                          >
                            {s.codEst === 'AC'
                              ? <IconTrash className="w-4 h-4 text-red-500" />
                              : <IconToggleOn className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        }
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{s.razSoc || '—'}</div>
                      <div className="text-xs text-gray-400">{s.nomPrv || ''}</div>
                    </td>
                    <td className={tdClass}>
                      <span className="text-gray-500">{s.documento || '—'}</span>
                    </td>
                    <td className={tdClass}>
                      <div className="leading-tight">
                        <div className="text-gray-700 dark:text-gray-300 font-medium">
                          {[s.pais || s.codPais, s.ciudad || s.codCiudad].filter(Boolean).join(' · ') || '—'}
                        </div>
                        {s.dirPrv && (
                          <div className="text-gray-400 max-w-[220px] truncate">{s.dirPrv}</div>
                        )}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="leading-tight">
                        {s.perCon && <div className="text-gray-700 dark:text-gray-300 font-medium">{s.perCon}</div>}
                        {s.telPrv && <div className="text-gray-400">{s.telPrv}</div>}
                        {s.corEle && <div className="text-gray-400 max-w-[180px] truncate">{s.corEle}</div>}
                        {!s.perCon && !s.telPrv && !s.corEle && <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Reg:</span>
                          <span className="truncate max-w-[110px]">{s.usuarioRegistra || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{s.fecRegistra}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Mod:</span>
                          <span className="truncate max-w-[110px]">{s.usuarioModifica || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{s.fecModifica}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-400">
                      {t.no_matches ?? 'Sin resultados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {total > pageSize && (
            <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
              <Pagination
                total={Math.ceil(total / pageSize)}
                value={page}
                onChange={onPageChange}
                size="sm"
                radius="xl"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Vista grid ── */}
      {view === 'grid' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.map((s) => (
              <SupplierCard
                key={s.codPrv}
                s={s}
                t={t}
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
