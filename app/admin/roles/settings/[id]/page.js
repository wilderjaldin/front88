"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axiosClient from "@/app/lib/axiosClient";
import Link from "next/link";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_detail_rol = "/roles/detalle";
const url_update_rol = "/roles/actualizar";

export default function SettingsRol() {
  const { id } = useParams();
  const t = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [rolInfo, setRolInfo] = useState(null);


  useEffect(() => {
    if (!id) return;

    const fetchRol = async () => {
      try {
        setLoading(true);

        const { data } = await axiosClient.get(url_detail_rol, {
          params: { id },
        });

        const { rol, usuarios, permisos } = data;

        setRolInfo(rol);
        setUsuarios(usuarios || []);
        setPermisos(permisos || []);

        const defaultValues = {
          nombre: rol?.nombre || ""
        };

        (permisos || []).forEach((p) => {
          defaultValues[p.codPermiso] = p.final;
        });

        reset(defaultValues);

      } catch (error) {
        console.error("Error cargando rol:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRol();
  }, [id, reset]);



  const onSubmit = async (formData) => {
    try {
      setSaving(true);

      const permisosActualizados = permisos.map((p) => ({
        codPermiso: p.codPermiso,
        check: formData[p.codPermiso] === true,
      }));

      const payload = {
        codRol: parseInt(id),
        nombre: formData.nombre,
        permisos: permisosActualizados,
      };

      await axiosClient.post(url_update_rol, payload);

      Swal.fire({
        position: "top-end",
        icon: 'success',
        title: 'Rol actualizado correctamente',
        timer: 3000,
        showConfirmButton: false
      }).then(r => {
        router.push("/admin/roles");
      });

    } catch (error) {

      Swal.fire({
        position: "top-end",
        icon: 'error',
        title: error?.response?.data?.message || "Error al actualizar",
        timer: 3000,
        showConfirmButton: false
      });


    } finally {
      setSaving(false);
    }
  };

  useDynamicTitle(`Roles | ${t.permissions}`);
  if (loading) {
    return <div className="p-6">Cargando información del rol...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Configuración del Rol ({rolInfo.nombre})
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">


        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow space-y-4">

          <h2 className="text-lg font-medium">
            Información General
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre del Rol
            </label>
            <input
              type="text"
              {...register("nombre", { required: true })}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800"
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1">
                El nombre es obligatorio
              </p>
            )}
          </div>

        </div>


        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">

          <h2 className="text-lg font-medium mb-4">
            Permisos del Rol
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-3">

            {permisos.map((permiso) => (
              <label
                key={permiso.codPermiso}
                className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register(permiso.codPermiso)}
                    className="w-4 h-4"
                  />
                  {permiso.etiqueta}
                </div>
              </label>
            ))}

          </div>

        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">

          <h2 className="text-lg font-medium mb-4">
            Usuarios con este Rol ({usuarios.length})
          </h2>

          {usuarios.length === 0 ? (
            <p className="text-sm text-gray-500">
              No existen usuarios asignados a este rol.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">

              {usuarios.map((u) => (
                <div
                  key={u.codUsuario}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border
            ${u.activo
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400"
                    }
          `}
                >
                  <span>{u.nomUsuario} ( {u.pais} )</span>

                  {!u.activo && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                      Inactivo
                    </span>
                  )}
                </div>
              ))}

            </div>
          )}

        </div>


        <div className="flex justify-end gap-3">

          <Link
            href="/admin/roles"
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