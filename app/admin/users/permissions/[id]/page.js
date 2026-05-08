'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import axiosClient from "@/app/lib/axiosClient";
import Link from 'next/link';
import IconSave from '@/components/icon/icon-save';
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_get_user = '/usuarios/permisos';
const url_update = '/usuarios/permisos/update';

export default function UserPermissions() {
  const params = useParams();
  const id = params?.id;
  const t = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permissionsRol, setPermissionsRol] = useState([]);
  const [permissionsUser, setPermissionsUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (!id) return;

    const fetchUserPermissions = async () => {
      try {
        setLoading(true);

        const response = await axiosClient.get(url_get_user, { params: { id } });
        const data = response.data;

        setUser(data.usuario);
        setPermissions(data.permisos || []);
        setPermissionsRol(data.permisos.filter(p => p.rol === true));
        setPermissionsUser(data.permisos.filter(p => p.rol === false));

        const defaultValues = {};
        data.permisos.forEach((permiso) => {
          defaultValues[permiso.codPermiso] = permiso.final;
        });
        reset(defaultValues);

      } catch (err) {
        setError('Error al obtener información del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [id, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);

    if (!user?.codUsuario) return;
    const selected = permissions.map(p => ({
      codPermiso: p.codPermiso,
      rol: p.rol === true,
      check: !!formData[p.codPermiso],
    }));

    const payload = {
      codUsuario: Number(user.codUsuario),
      permisos: selected,
    };

    try {
      await axiosClient.post(url_update, payload);
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Permisos actualizados correctamente',
        timer: 3000,
        showConfirmButton: false,
      });
      router.push('/admin/users');
    } catch (err) {
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: err?.response?.data?.message || 'Error al actualizar',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  useDynamicTitle(`${t.users} | ${t.permissions}`);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      Cargando permisos...
    </div>
  );
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const initials = user?.nomUsuario?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.admin}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <Link href="/admin/users" className="text-primary hover:underline">{t.users}</Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.permissions}</span>
        </li>
      </ul>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{t.permissions}</h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>

        {/* User info card */}
        {user && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 dark:text-white text-sm">{user.nomUsuario}</p>
              <Link
                href={`/admin/roles/settings/${user.codRol}`}
                className="text-xs text-primary hover:underline"
              >
                {user.rol}
              </Link>
            </div>
            <div className="ml-auto flex gap-2 shrink-0">
              <span className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30">
                {permissionsRol.length} del Rol
              </span>
              <span className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/30">
                {permissionsUser.length} Individuales
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {permissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 text-sm text-gray-500">
              No existen permisos registrados
            </div>
          ) : (
            <>
              {/* ROL permissions */}
              {permissionsRol.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Permisos del Rol</h2>
                    <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30">
                      Heredados · {permissionsRol.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {permissionsRol.map(permiso => (
                      <label
                        key={permiso.codPermiso}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition dark:bg-amber-900/10 dark:border-amber-800/30 dark:hover:bg-amber-900/20"
                      >
                        <input
                          type="checkbox"
                          {...register(permiso.codPermiso)}
                          className="w-4 h-4 accent-amber-500 shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{permiso.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual permissions */}
              {permissionsUser.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Permisos Individuales</h2>
                    <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/30">
                      Personalizados · {permissionsUser.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {permissionsUser.map(permiso => (
                      <label
                        key={permiso.codPermiso}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-blue-100 bg-blue-50/30 hover:bg-blue-50/60 cursor-pointer transition dark:bg-blue-900/10 dark:border-blue-800/30 dark:hover:bg-blue-900/20"
                      >
                        <input
                          type="checkbox"
                          {...register(permiso.codPermiso)}
                          className="w-4 h-4 accent-blue-500 shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{permiso.etiqueta}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {t.btn_cancel}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <IconSave className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
