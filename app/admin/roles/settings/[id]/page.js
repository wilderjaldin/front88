"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axiosClient from "@/app/lib/axiosClient";
import Link from "next/link";
import IconSave from '@/components/icon/icon-save';
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

        const { data } = await axiosClient.get(url_detail_rol, { params: { id } });
        const { rol, usuarios, permisos } = data;

        setRolInfo(rol);
        setUsuarios(usuarios || []);
        setPermisos(permisos || []);

        const defaultValues = { nombre: rol?.nombre || "" };
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
        icon: "success",
        title: "Rol actualizado correctamente",
        timer: 3000,
        showConfirmButton: false,
      }).then(() => router.push("/admin/roles"));

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: error?.response?.data?.message || "Error al actualizar",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  useDynamicTitle(`Roles | ${t.permissions}`);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      Cargando configuración del rol...
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.admin}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <Link href="/admin/roles" className="text-primary hover:underline">{t.roles}</Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>Configuración</span>
        </li>
      </ul>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {rolInfo?.nombre}
          </h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* General info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Información General</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Nombre del Rol
              </label>
              <input
                type="text"
                {...register("nombre", { required: true })}
                className="form-input w-full max-w-sm"
              />
              {errors.nombre && (
                <p className="text-red-500 text-xs mt-1">El nombre es obligatorio</p>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Permisos</h2>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded-full dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                {permisos.length} permisos
              </span>
            </div>
            {permisos.length === 0 ? (
              <p className="text-sm text-gray-500">No existen permisos registrados</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {permisos.map((permiso) => (
                  <label
                    key={permiso.codPermiso}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition dark:border-gray-700 dark:hover:bg-blue-900/10 dark:hover:border-blue-800/40"
                  >
                    <input
                      type="checkbox"
                      {...register(permiso.codPermiso)}
                      className="w-4 h-4 accent-blue-600 shrink-0"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{permiso.etiqueta}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Users */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Usuarios</h2>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded-full dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                {usuarios.length} asignados
              </span>
            </div>
            {usuarios.length === 0 ? (
              <p className="text-sm text-gray-500">No existen usuarios asignados a este rol.</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {usuarios.map((u) => {
                  const initials = u.nomUsuario?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
                  return (
                    <div
                      key={u.codUsuario}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm ${
                        u.activo
                          ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        u.activo
                          ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                          : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {initials}
                      </span>
                      <span className="text-xs font-medium">{u.nomUsuario}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({u.pais})</span>
                      {!u.activo && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <Link
              href="/admin/roles"
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
