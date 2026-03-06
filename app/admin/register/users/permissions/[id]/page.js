'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import axiosClient from "@/app/lib/axiosClient";
import Link from 'next/link';
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

        const response = await axiosClient.get(url_get_user, {
          params: { id }
        });

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
      check: !!formData[p.codPermiso] // true o false
    }));



    const payload = {
      codUsuario: Number(user.codUsuario),
      permisos: selected
    };

    try {
      await axiosClient.post(url_update, payload);
      Swal.fire({
        position: "top-end",
        icon: 'success',
        title: 'Permisos actualizados correctamente',
        timer: 3000,
        showConfirmButton: false
      });
      router.push("/admin/register/users");
    } catch (err) {
      console.error('err', err);
      Swal.fire({
        position: "top-end",
        icon: 'error',
        title: err?.response?.data?.message || "Error al actualizar",
        timer: 3000,
        showConfirmButton: false
      });
    } finally {
      setSaving(false);
    }
  };

  useDynamicTitle(`${t.users} | ${t.permissions}`);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;



  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Permisos de Usuario</h1>

      {user && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-xl p-4">
          <p><strong>Nombre:</strong> {user.nomUsuario}</p>
          <p><strong>Rol:</strong> <Link href={`/admin/register/roles/settings/${user.codRol}`} className="text-blue-600 hover:text-blue-800 underline font-medium" >{user.rol}</Link></p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-900 shadow rounded-xl p-4 space-y-4"
      >
        <h2 className="text-lg font-medium">Permisos</h2>

        {permissions.length === 0 ? (
          <p className="text-gray-500">No existen permisos registrados</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

              {/* Columna R */}
              <div className="md:col-span-1 space-y-3">
                {permissions
                  .filter(p => p.rol === true)
                  .map((permiso) => (
                    <label
                      key={permiso.codigo}
                      className={`${(permiso.rol === true && permiso.final === true)
                        ? "bg-gray-200"
                        : ""} flex items-center justify-between border rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register(permiso.codPermiso)}
                          className="w-4 h-4"
                        />
                        {permiso.etiqueta}
                      </div>

                      <span className="text-xs text-gray-500">
                        {permiso.rol === true
                          ? "ROL"
                          : permiso.usuario === true
                            ? "Personalizado"
                            : ""}

                      </span>
                    </label>
                  ))
                }
              </div>

              {/* Columna U */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                {permissions
                  .filter(p => p.rol === false)
                  .map((permiso) => (
                    <label
                      key={permiso.codigo}
                      className={`${permiso.usuario !== null
                        ? ""
                        : permiso.rol !== false
                          ? "bg-gray-300"
                          : ""} 
          flex items-center justify-between 
          border rounded-lg px-3 py-2 text-sm 
          cursor-pointer hover:bg-gray-50 
          dark:hover:bg-gray-800`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register(permiso.codPermiso)}
                          className="w-4 h-4"
                        />
                        {permiso.etiqueta}
                      </div>

                      <span className="text-xs text-gray-500">
                        {permiso.usuario !== null
                          ? "Personalizado"
                          : permiso.rol !== false
                            ? "ROL"
                            : ""}
                      </span>
                    </label>
                  ))}
              </div>

            </div>
          </>
        )}

        <div className="flex justify-end gap-3">

          <Link
            href="/admin/register/users"
            className="inline-flex items-center justify-center
                              px-4 py-2
                              rounded-lg
                              border border-gray-300 dark:border-gray-700
                              bg-white dark:bg-gray-800
                              text-sm font-medium
                              text-gray-700 dark:text-gray-200
                              hover:bg-gray-50 dark:hover:bg-gray-700
                              transition-colors"
          >
            {t.btn_cancel}
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>

        </div>
      </form>
    </div>
  );
}