'use client';
import { useRouter } from 'next/navigation';
import { Pagination } from '@mantine/core';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconTrash from '@/components/icon/icon-trash';
import IconSettings from '@/components/icon/icon-settings';
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalSuccess, swalError } from '@/app/lib/swal';
import { PERMISSIONS } from '@/constants/permissions';

const URL_STATUS = '/clientes/status';

const IDIOMA_LABEL = { ES: 'Español', US: 'Inglés' };

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2 whitespace-nowrap";

const EstadoBadge = ({ codEstado, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEstado === 'AC'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    }`}>
    {codEstado === 'AC' ? t.active : t.inactive}
  </span>
);

// ── Tarjeta grid ──────────────────────────────────────────────────────────────
const ClienteCard = ({ c, onStatus, onSettings, t, hasPermission }) => (
  <div className="group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">

    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
          {c.nomCliente}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {c.tipDocumento} {c.numNit}
        </p>
      </div>
      <EstadoBadge codEstado={c.codEstado} t={t} />
    </div>

    <div className="px-4 py-3 space-y-1.5 text-xs">
      {c.dirCliente && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">Dirección</span>
          <span className="text-gray-700 dark:text-gray-300 truncate">{c.dirCliente}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0">Ubicación</span>
        <span className="text-gray-700 dark:text-gray-300">
          {[c.nomPais, c.nomCiudad].filter(Boolean).join(' · ') || '—'}
        </span>
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
      <button onClick={() => onStatus(c)} title={c.codEstado === 'AC' ? 'Eliminar' : 'Activar'}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        {c.codEstado === 'AC'
          ? <IconTrash className="w-4 h-4 text-red-500" />
          : <IconToggleOn className="w-4 h-4 text-gray-400" />
        }
      </button>
      {(hasPermission(PERMISSIONS.ELIMINAR_CLIENTE)) &&
        <button onClick={() => onSettings(c)} title="Configuraciones"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <IconSettings className="w-4 h-4 text-gray-500" />
        </button>
      }
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
  setData,
  t,
  hasPermission = () => false,
  view = 'list',
}) => {
  const router = useRouter();

  const onSettings = (c) => {
    router.push(`/admin/register/customers/${c.codCliente}/general`);
  };

  const handleStatus = async (c) => {
    const nuevoEstado = c.codEstado === 'AC' ? 'IN' : 'AC';
    const accion = nuevoEstado === 'IN' ? 'eliminar' : 'activar';

    const { isConfirmed } = await swalConfirm(
      `¿Deseas ${accion} este cliente?`,
      c.nomCliente,
      { confirmText: `Sí, ${accion}`, confirmColor: nuevoEstado === 'IN' ? '#dc2626' : '#16a34a' }
    );
    if (!isConfirmed) return;

    try {
      await axiosClient.post(URL_STATUS, {
        codCliente: c.codCliente,
        codEstado: nuevoEstado,
      });
      setData(prev => prev.map(item =>
        item.codCliente === c.codCliente ? { ...item, codEstado: nuevoEstado } : item
      ));
      swalSuccess(nuevoEstado === 'AC' ? 'Cliente activado' : 'Cliente eliminado');
    } catch {
      swalError('Error', 'No se pudo cambiar el estado del cliente');
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
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Documento</th>
                  <th className={thClass}>Ubicación</th>
                  <th className={thClass}>Idioma</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((c) => (
                  <tr key={c.codCliente} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} px-2`}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => onSettings(c)}
                          title="Configuraciones"
                        >
                          <IconSettings className="w-4 h-4 text-gray-500" />
                        </button>
                        {(hasPermission(PERMISSIONS.ELIMINAR_CLIENTE)) &&
                          <button
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleStatus(c)}
                            title={c.codEstado === 'AC' ? 'Eliminar' : 'Activar'}
                          >
                            {c.codEstado === 'AC'
                              ? <IconTrash className="w-4 h-4 text-red-500" />
                              : <IconToggleOn className="w-4 h-4 text-gray-400" />
                            }
                          </button>
                        }
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{c.nomCliente}</span>
                    </td>
                    <td className={tdClass}>
                      <span className="text-gray-500">{c.tipDocumento} {c.numNit}</span>
                    </td>
                    <td className={tdClass}>
                      <div className="leading-tight">
                        <div className="text-gray-700 dark:text-gray-300 font-medium">
                          {[c.nomPais || c.codPais, c.nomCiudad].filter(Boolean).join(' · ') || '—'}
                        </div>
                        {c.dirCliente && (
                          <div className="text-gray-400 max-w-[220px] truncate">{c.dirCliente}</div>
                        )}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className="text-gray-500">{IDIOMA_LABEL[c.cliIdioma] ?? c.cliIdioma}</span>
                    </td>
                    <td className={tdClass}>
                      <EstadoBadge codEstado={c.codEstado} t={t} />
                    </td>
                    <td className={tdClass}>
                      <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Reg:</span>
                          <span className="truncate max-w-[110px]">{c.usuarioRegistra || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{c.fecRegistra}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Mod:</span>
                          <span className="truncate max-w-[110px]">{c.usuarioModifica || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0">{c.fecModifica}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-400">
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
            {data.map((c) => (
              <ClienteCard
                key={c.codCliente}
                c={c}
                onStatus={handleStatus}
                onSettings={onSettings}
                t={t}
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

export default DatatablesCustomers;