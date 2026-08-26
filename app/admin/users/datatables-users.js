'use client';
import Link from 'next/link';
import { useDispatch } from "react-redux";
import { Pagination } from '@mantine/core';
import SearchFilter from '@/components/SearchFilter';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconCheck from '@/components/icon/icon-check';
import IconBan from '@/components/icon/icon-ban';
import IconLock from '@/components/icon/icon-lock';
import IconEye from '@/components/icon/icon-eye';
import IconMapPin from '@/components/icon/icon-map-pin';
import axiosClient from "@/app/lib/axiosClient";
import { setImpersonation } from "@/store/authSlice";
import { swalConfirm, swalError } from '@/app/lib/swal';

const PAGE_SIZE = 20;

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric' })
    : '—';

const formatText = (text) => text?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

const DatatablesUser = ({
  data = [], t, total, page, term, handlePageChange, currentUserId,
  handleSearchChange, toggleUserStatus, addUser, editUser, handleCountries,
}) => {
  const dispatch = useDispatch();
  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

  const handleViewAs = async (user) => {
    const result = await swalConfirm(
      '¿Ver como este usuario?',
      `Ingresarás como ${user.nomUsuario}`,
      { confirmText: 'Sí, continuar', cancelText: 'Cancelar', confirmColor: '#10b981' }
    );
    if (!result.isConfirmed) return;

    try {
      const res = await axiosClient.post(`/usuarios/vercomo/${user.codUsuario}`);
      dispatch(setImpersonation({ token: res.data.token, user: res.data.user, permissions: res.data.permissions }));
    } catch (error) {
      swalError(t.error, 'No se pudo iniciar sesión como este usuario', t.close);
    }
  };

  return (
    <div className="pt-5 space-y-4">

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.users ?? "Usuarios"} <span className="text-base font-normal text-gray-400">({total ?? 0})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchFilter t={t} value={term} onSearch={handleSearchChange} onClear={() => handleSearchChange('')} />
          <button
            type="button"
            onClick={addUser}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
          >
            <IconPlus className="h-4 w-4" />
            Agregar Usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-32 text-center`}>{t.actions ?? 'Acciones'}</th>
                <th className={thClass}>Rol</th>
                <th className={thClass}>{t.name}</th>
                <th className={thClass}>{t.email}</th>
                <th className={thClass}>{t.country} / {t.city}</th>
                <th className={thClass}>Notificaciones</th>
                <th className={thClass}>{t.status}</th>
                <th className={`${thClass} w-56`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td></tr>
              ) : data.map((user, i) => {
                const isSelf = user.codUsuario === currentUserId;
                return (
                  <tr key={user.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className={`${tdClass} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => editUser(user)}
                          title="Editar"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition"
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user)}
                          disabled={isSelf}
                          title={user.codEstado === 'AC' ? 'Inactivar' : 'Reactivar'}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed ${
                            user.codEstado === 'AC'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                        >
                          {user.codEstado === 'AC' ? <IconBan className="h-3.5 w-3.5" /> : <IconCheck className="h-3.5 w-3.5" />}
                        </button>
                        <Link
                          href={`/admin/users/permissions/${user.codUsuario}`}
                          title="Permisos"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 transition"
                        >
                          <IconLock className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCountries(user)}
                          title="Países permitidos"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 transition"
                        >
                          <IconMapPin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewAs(user)}
                          disabled={isSelf}
                          title="Ver como usuario"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <IconEye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className={tdClass}>{user.nomRol}</td>
                    <td className={`${tdClass} font-medium text-gray-800 dark:text-gray-200`}>{user.nomUsuario}</td>
                    <td className={`${tdClass} leading-tight`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-[10px] shrink-0">Login:</span>
                          <span>{user.logUsuario || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-[10px] shrink-0">SMTP:</span>
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${user.smtpVerificado ? 'bg-green-500' : 'bg-amber-400'}`}
                            title={user.smtpVerificado ? 'SMTP verificado' : 'SMTP no verificado'}
                          />
                          <span>{user.corElectronico || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="inline-flex items-center gap-1.5">
                        {user.codPais && (
                          <img
                            src={`/assets/flags/${user.codPais.trim().toLowerCase()}.svg`}
                            alt={user.nombrePais || user.codPais}
                            className="h-3 w-4 rounded-sm object-cover shrink-0"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span>{user.nombrePais}{user.nombreCiudad ? ` / ${user.nombreCiudad}` : ''}</span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${user.blnSeguimiento ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          Seg
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${user.blnMensaje ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          Msg
                        </span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.codEstado === 'AC'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {user.codEstado === 'AC' ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className={`${tdClass} leading-tight w-56`}>
                      <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <div>
                          <div className="flex gap-1">
                            <span className="text-gray-400 shrink-0">Reg:</span>
                            <span className="truncate" title={formatText(user.usuarioRegistra)}>{formatText(user.usuarioRegistra) || '—'}</span>
                          </div>
                          <div className="text-gray-400">{formatDate(user.fecRegistra)}</div>
                        </div>
                        <div>
                          <div className="flex gap-1">
                            <span className="text-gray-400 shrink-0">Mod:</span>
                            <span className="truncate" title={formatText(user.usuarioModifica)}>{formatText(user.usuarioModifica) || '—'}</span>
                          </div>
                          <div className="text-gray-400">{formatDate(user.fecModifica)}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={handlePageChange} size="sm" radius="xl" />
        </div>
      )}
    </div>
  );
};

export default DatatablesUser;
