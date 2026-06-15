"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axiosClient from "@/app/lib/axiosClient";
import Link from "next/link";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Modal from '@/components/modal';
import { useForm } from "react-hook-form";
import IconSearch from "@/components/icon/icon-search";
import IconX from "@/components/icon/icon-x";
import AccessDenied from "@/components/AccessDenied";

const url_roles = "/roles";

export default function RolesPage() {
  const t            = useTranslation();
  const router = useRouter();

  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => r.nomRol.toLowerCase().includes(q));
  }, [search, roles]);

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState("");
  const [modal_size] = useState("w-1/5");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };



  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const fetchRoles = async () => {
    try {
      const res = await axiosClient.get(url_roles);
      setRoles(res.data);
    } catch (error) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      } else {
        Toast.fire({ icon: "error", title: "Error cargando roles" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const onSubmitRol = async (data) => {
    try {
      setSaving(true);

      const res = await axiosClient.post("/roles/registro", {
        nombre: data.nombre,
      });

      setRoles(res.data);

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Rol registrado correctamente",
        timer: 3000,
        showConfirmButton: false,
      });

      handleCloseModal();

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: error?.response?.data?.message || "Error al registrar",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id) => {
    router.push(`/admin/roles/settings/${id}`);
  };

  useDynamicTitle("Roles");

  if (forbidden) return <AccessDenied />;

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.admin}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.roles}</span>
        </li>
      </ul>
      <div className="pt-5 space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t.roles ?? "Roles"}{" "}
              <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
            </h2>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar rol..."
                className="w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                >
                  <IconX className="h-4 w-4" />
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                  <IconSearch className="h-4 w-4" />
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setModalTitle("Crear nuevo Rol");
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shrink-0"
            >
              + Crear nuevo Rol
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            {roles.length === 0 ? "No existen roles registrados." : "Sin resultados para la búsqueda."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((rol) => (
              <button
                key={rol.codRol}
                onClick={() => handleEdit(rol.codRol)}
                className="group relative flex flex-col p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
              >
                {/* Ícono */}
                <div className="w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-4.5 h-4.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>

                {/* Nombre */}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {rol.nomRol}
                </span>

                {/* Stats: usuarios + permisos */}
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="text-xs text-gray-400">{rol.cantUsuarios}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span className="text-xs text-gray-400">{rol.cantPermisos}</span>
                  </div>
                </div>

                {/* Flecha hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Modal
        size={modal_size}
        closeModal={handleCloseModal}
        showModal={show_modal}
        title={modal_title}
      >
        <form onSubmit={handleSubmit(onSubmitRol)} className="space-y-4">

          {/* INPUT NOMBRE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre del Rol
            </label>
            <input
              type="text"
              {...register("nombre", { required: "El nombre es obligatorio" })}
              className="
          w-full
          rounded-lg
          border border-gray-300 dark:border-gray-700
          px-3 py-2
          text-sm
          focus:outline-none
          focus:ring-2 focus:ring-blue-500
        "
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={handleCloseModal}
              className="
          px-4 py-2
          rounded-lg
          border border-gray-300 dark:border-gray-700
          text-sm
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition
        "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
          px-4 py-2
          rounded-lg
          bg-blue-600
          text-white
          text-sm font-medium
          hover:bg-blue-700
          disabled:opacity-50
          transition
        "
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>

          </div>
        </form>
      </Modal>
    </>
  );
}