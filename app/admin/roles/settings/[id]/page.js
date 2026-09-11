"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axiosClient from "@/app/lib/axiosClient";
import Link from "next/link";
import IconSave from '@/components/icon/icon-save';
import IconSearch from "@/components/icon/icon-search";
import IconX from "@/components/icon/icon-x";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_detail_rol = "/roles/detalle";
const url_update_rol = "/roles/actualizar";

const PERM_TABS = [
  { key: "all",        label: "Todos"       },
  { key: "assigned",   label: "Asignados"   },
  { key: "unassigned", label: "Sin asignar" },
];

const USER_TABS = [
  { key: "all",      label: "Todos"     },
  { key: "active",   label: "Activos"   },
  { key: "inactive", label: "Inactivos" },
];

function PermisoLabel({ permiso, checked, register }) {
  return (
    <label
      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
        checked
          ? "border-primary/40 bg-primary/5 dark:bg-primary/10 dark:border-primary/30"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <input type="checkbox" {...register(permiso.codPermiso)} className="w-4 h-4 accent-primary shrink-0" />
      <span className={`text-xs leading-snug ${checked ? "text-primary font-medium" : "text-gray-600 dark:text-gray-300"}`}>
        {permiso.etiqueta}
      </span>
    </label>
  );
}

// Checkbox del encabezado de módulo: marca/desmarca todos sus permisos, con
// estado "indeterminado" cuando solo algunos están marcados.
function ModuloCheck({ total, marcados, onToggle }) {
  const ref = (el) => { if (el) el.indeterminate = marcados > 0 && marcados < total; };
  return (
    <input
      type="checkbox"
      ref={ref}
      checked={total > 0 && marcados === total}
      onChange={(e) => onToggle(e.target.checked)}
      title="Seleccionar / deseleccionar todo el módulo"
      className="w-3.5 h-3.5 accent-primary cursor-pointer shrink-0"
    />
  );
}

function FilterTabs({ tabs, active, counts, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px]">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors font-medium ${
            active === tab.key
              ? "bg-slate-700 text-white dark:bg-slate-600"
              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${
            active === tab.key
              ? "bg-white/20 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}>
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function SettingsRol() {
  const { id }  = useParams();
  const t       = useTranslation();
  const router  = useRouter();

  const [saving,       setSaving]       = useState(false);
  const [filterPerm,   setFilterPerm]   = useState("all");
  const [filterModulo, setFilterModulo] = useState("all");
  const [searchPerm,   setSearchPerm]   = useState("");
  const [filterUsers,  setFilterUsers]  = useState("active");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  // Marca/desmarca una lista de permisos de una sola vez.
  const setAllPermisos = (list, value) => {
    list.forEach(p => setValue(p.codPermiso, value, { shouldDirty: true }));
  };

  const [loading,  setLoading]  = useState(true);
  // La API ahora agrupa: [{ modulo, permisos: [{ codPermiso, etiqueta, final }] }]
  const [modulos,  setModulos]  = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [rolInfo,  setRolInfo]  = useState(null);

  const watchedValues = watch();

  // Lista plana de todos los permisos — para contadores, defaults y el payload.
  const flatPermisos = useMemo(() => modulos.flatMap(m => m.permisos || []), [modulos]);

  useEffect(() => {
    if (!id) return;
    const fetchRol = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get(url_detail_rol, { params: { id } });
        const { rol, usuarios, permisos } = data;

        setRolInfo(rol);
        setUsuarios(usuarios || []);
        setModulos(permisos || []);

        const defaultValues = { nombre: rol?.nombre || "" };
        (permisos || []).forEach((m) => (m.permisos || []).forEach((p) => {
          defaultValues[p.codPermiso] = p.final;
        }));
        reset(defaultValues);
      } catch (error) {
        console.error("Error cargando rol:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRol();
  }, [id, reset]);

  // ─── Permisos ────────────────────────────────────────────────────────────────
  const assignedCount   = useMemo(() => flatPermisos.filter(p =>  !!watchedValues[p.codPermiso]).length, [flatPermisos, watchedValues]);
  const unassignedCount = useMemo(() => flatPermisos.length - assignedCount, [flatPermisos.length, assignedCount]);
  const permTabCounts   = { all: flatPermisos.length, assigned: assignedCount, unassigned: unassignedCount };

  // Módulos con sus permisos ya filtrados por tab + búsqueda; se descartan los
  // módulos que quedan sin permisos visibles.
  const modulosFiltrados = useMemo(() => {
    const q = searchPerm.trim().toLowerCase();
    return modulos
      .filter(m => filterModulo === "all" || m.modulo === filterModulo)
      .map((m) => {
        let list = m.permisos || [];
        if (filterPerm === "assigned")   list = list.filter(p =>  !!watchedValues[p.codPermiso]);
        if (filterPerm === "unassigned") list = list.filter(p => !watchedValues[p.codPermiso]);
        if (q) list = list.filter(p => p.etiqueta.toLowerCase().includes(q));
        return { ...m, permisos: list };
      })
      .filter(m => m.permisos.length > 0);
  }, [modulos, filterPerm, filterModulo, searchPerm, watchedValues]);

  // Todos los permisos actualmente visibles (para "marcar / desmarcar todos").
  const visiblePermisos = useMemo(
    () => modulosFiltrados.flatMap(m => m.permisos),
    [modulosFiltrados]
  );

  // ─── Usuarios ────────────────────────────────────────────────────────────────
  const userCounts = useMemo(() => ({
    all:      usuarios.length,
    active:   usuarios.filter(u =>  u.activo).length,
    inactive: usuarios.filter(u => !u.activo).length,
  }), [usuarios]);

  const filteredUsers = useMemo(() => {
    if (filterUsers === "active")   return usuarios.filter(u =>  u.activo);
    if (filterUsers === "inactive") return usuarios.filter(u => !u.activo);
    return usuarios;
  }, [usuarios, filterUsers]);

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    try {
      setSaving(true);
      await axiosClient.post(url_update_rol, {
        codRol:   parseInt(id),
        nombre:   formData.nombre,
        permisos: flatPermisos.map((p) => ({ codPermiso: p.codPermiso, check: formData[p.codPermiso] === true })),
      });
      Swal.fire({ position: "top-end", icon: "success", title: "Rol actualizado correctamente", timer: 3000, showConfirmButton: false })
        .then(() => router.push("/admin/roles"));
    } catch (error) {
      Swal.fire({ position: "top-end", icon: "error", title: error?.response?.data?.message || "Error al actualizar", timer: 3000, showConfirmButton: false });
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

  const isProtected = rolInfo?.nombre === "Super Administrador";

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

      <div className="pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{rolInfo?.nombre}</h1>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>
          <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
            <div>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-none">{flatPermisos.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-primary leading-none">{assignedCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Asignados</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-gray-400 leading-none">{unassignedCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Sin asignar</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Nombre del Rol ── campo prominente, siempre visible */}
          <div className="panel p-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Nombre del Rol
            </label>
            <div className="flex items-center gap-3 max-w-sm">
              <input
                type="text"
                {...register("nombre", { required: true })}
                readOnly={isProtected}
                className={`form-input flex-1 font-medium text-gray-800 dark:text-gray-100 ${
                  isProtected ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""
                }`}
                placeholder="Nombre del rol"
              />
              {isProtected && (
                <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Protegido
                </span>
              )}
              {errors.nombre && (
                <span className="text-red-500 text-xs shrink-0">Requerido</span>
              )}
            </div>
          </div>

          {/* ── Permisos ── */}
          <div className="panel p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Permisos
              </h2>
              <FilterTabs
                tabs={PERM_TABS}
                active={filterPerm}
                counts={permTabCounts}
                onChange={setFilterPerm}
              />
              <select
                value={filterModulo}
                onChange={e => setFilterModulo(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">Todos los módulos</option>
                {modulos.map(m => (
                  <option key={m.modulo} value={m.modulo}>{m.modulo}</option>
                ))}
              </select>

              {/* Marcar / desmarcar todos los permisos visibles (según filtros) */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setAllPermisos(visiblePermisos, true)}
                  disabled={visiblePermisos.length === 0}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-primary/5 hover:text-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={() => setAllPermisos(visiblePermisos, false)}
                  disabled={visiblePermisos.length === 0}
                  className="px-2.5 py-1.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Desmarcar
                </button>
              </div>

              <div className="relative ml-auto">
                <input
                  type="text"
                  value={searchPerm}
                  onChange={e => setSearchPerm(e.target.value)}
                  placeholder="Buscar permiso..."
                  className="w-48 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {searchPerm ? (
                  <button type="button" onClick={() => setSearchPerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconSearch className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>

            {modulosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                {flatPermisos.length === 0 ? "No existen permisos registrados." : "Sin resultados."}
              </p>
            ) : (
              <div className="space-y-4">
                {modulosFiltrados.map((m) => {
                  const marcados = m.permisos.filter(p => !!watchedValues[p.codPermiso]).length;
                  return (
                  <div key={m.modulo} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ModuloCheck
                        total={m.permisos.length}
                        marcados={marcados}
                        onToggle={(v) => setAllPermisos(m.permisos, v)}
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {m.modulo}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">({marcados}/{m.permisos.length})</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {m.permisos.map((permiso) => (
                        <PermisoLabel
                          key={permiso.codPermiso}
                          permiso={permiso}
                          checked={!!watchedValues[permiso.codPermiso]}
                          register={register}
                        />
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Botones ── */}
          <div className="flex justify-end gap-3">
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

          {/* ── Usuarios ── */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Usuarios asignados
              </h2>
              <FilterTabs
                tabs={USER_TABS}
                active={filterUsers}
                counts={userCounts}
                onChange={setFilterUsers}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                {usuarios.length === 0 ? "No existen usuarios asignados a este rol." : "Sin resultados."}
              </p>
            ) : (
              <div className="flex divide-x divide-gray-200 dark:divide-gray-700">
                {[0, 1, 2].map(col => (
                  <div key={col} className="flex-1 min-w-0 px-4 first:pl-0 last:pr-0">
                    {filteredUsers.filter((_, i) => i % 3 === col).map((u) => (
                      <Link
                        key={u.codUsuario}
                        href={`/admin/users/permissions/${u.codUsuario}`}
                        className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700/40 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded transition-colors group"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.activo ? "bg-green-400" : "bg-gray-300 dark:bg-gray-600"}`} />
                        <span className={`text-xs truncate flex-1 group-hover:text-primary transition-colors ${u.activo ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                          {u.nomUsuario}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{u.pais}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
