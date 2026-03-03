'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import axiosClient from "@/app/lib/axiosClient";

const url_get_user = '/usuarios/permisos';
const url_update = '/usuarios/permisos/update';

export default function UserPermissions() {
  const params = useParams();
  const id = params?.id;

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
        setPermissionsUser(data.permisos.filter(p => p.rol === null));


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

    console.log("Payload limpio:", payload);
    try {
      await axiosClient.post(url_update, payload);
      alert("Permisos actualizados correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar permisos");
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Permisos de Usuario</h1>

      {user && (
        <div className="bg-white dark:bg-gray-900 shadow rounded-xl p-4">
          <p><strong>Nombre:</strong> {user.nomUsuario}</p>
          <p><strong>Rol:</strong> {user.rol}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* Columna R */}
              <div className="md:col-span-1 space-y-3">
                {permissions
                  .filter(p => p.rol === true)
                  .map((permiso) => (
                    <label
                      key={permiso.codigo}
                      className={`${permiso.usuario !== null
                        ? ""
                        : permiso.rol !== null
                          ? "bg-gray-300"
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
                        {permiso.usuario !== null
                          ? "Personalizado"
                          : permiso.rol !== null
                            ? "ROL"
                            : ""}
                      </span>
                    </label>
                  ))
                }
              </div>

              {/* Columna U */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {permissions
                  .filter(p => p.rol === null)
                  .map((permiso) => (
                    <label
                      key={permiso.codigo}
                      className={`${permiso.usuario !== null
                        ? ""
                        : permiso.rol !== null
                          ? "bg-gray-300"
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
                        {permiso.usuario !== null
                          ? "Personalizado"
                          : permiso.rol !== null
                            ? "ROL"
                            : ""}
                      </span>
                    </label>
                  ))
                }
              </div>

            </div>
          </>
        )}

        <div className="pt-4 text-center justify-center">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Guardar Permisos
          </button>
        </div>
      </form>
    </div>
  );
}