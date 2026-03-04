"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosClient from "@/app/lib/axiosClient";
import Link from "next/link";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Modal from '@/components/modal';
import { useForm } from "react-hook-form"

const url_roles = "/roles";

export default function RolesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

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
      Toast.fire({
        icon: "error",
        title: "Error cargando roles",
      });
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
    router.push(`/admin/register/roles/settings/${id}`);
  };

  useDynamicTitle("Roles");

  return (
    <>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Roles ({roles.length})
          </h1>

          <button
            onClick={() => {
              setModalTitle("Crear nuevo Rol");
              setShowModal(true);
            }}
            className="
              inline-flex items-center justify-center
              px-4 py-2
              rounded-lg
              bg-blue-600
              text-white
              text-sm font-medium
              hover:bg-blue-700
              transition
            "
          >
            + Crear nuevo Rol
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">

          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500">
              No existen roles registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b dark:border-gray-700 text-left">
                  <tr>
                    <th className="py-2">Nombre</th>
                    <th className="py-2 w-40 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((rol) => (
                    <tr
                      key={rol.codRol}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="py-3">
                        {rol.nomRol}
                      </td>

                      <td className="py-3 text-right space-x-2">

                        <button
                          onClick={() => handleEdit(rol.codRol)}
                          className="
                          px-3 py-1.5
                          rounded-lg
                          border border-gray-300 dark:border-gray-700
                          text-xs
                          hover:bg-gray-100 dark:hover:bg-gray-800
                          transition
                        "
                        >
                          Configurar
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
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