"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import axiosClient from "@/app/lib/axiosClient";
import Swal from "sweetalert2";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Modal from "@/components/modal";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useDebounce } from "use-debounce";
import { Pagination } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/app/locales";
import IconSearch from "@/components/icon/icon-search";
import IconPlus from "@/components/icon/icon-plus";
import IconToggleOn from "@/components/icon/icon-toggle-on";
import IconToggleOff from "@/components/icon/icon-toggle-off";
import IconPencil from "@/components/icon/icon-pencil";
import IconX from "@/components/icon/icon-x";

const URL_BASE = "/permisos";
const PAGE_SIZE = 50;

const TIPO_OPTIONS = [
  { value: "FT", label: "FRONTEND" },
  { value: "BK", label: "BACKEND" },
];

// Prefijos reconocidos y sus etiquetas para los chips
const FILTER_KEYS = {
  modulo: { label: "Módulo", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  accion: { label: "Acción", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  tipo: { label: "Tipo", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  activo: { label: "Activo", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

// ── Parser: "modulo:Usuarios tipo:ft texto libre" → { modulo, tipo, term }
const parseSearch = (raw) => {
  const filters = {};
  let remaining = raw;

  const regex = /(\w+):(\S+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2];
    if (key in FILTER_KEYS) {
      filters[key] = val;
      remaining = remaining.replace(match[0], "").trim();
    }
  }

  // Normalizar tipo y activo
  if (filters.tipo) filters.tipo = filters.tipo.toUpperCase();
  if (filters.activo) filters.activo = filters.activo === "1" ? "1" : "0";

  const term = remaining.replace(/\s+/g, " ").trim();
  if (term) filters.term = term;

  return filters;
};

const Toast = Swal.mixin({
  toast: true, position: "top-end",
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const RULES = {
  codigo: { required: "Requerido", pattern: { value: /^[A-Z0-9]{8}$/, message: "8 chars alfanuméricos MAYÚSCULAS" } },
  modulo: { pattern: { value: /^[a-zA-Z]*$/, message: "Solo letras sin espacios" } },
  accion: { pattern: { value: /^[a-zA-Z]*$/, message: "Solo letras sin espacios" } },
  etiqueta: { required: "Requerido" },
};

const FieldError = ({ error }) =>
  error ? <p className="text-xs text-red-500 mt-1">{error.message}</p> : null;

// ── Chip individual ───────────────────────────────────────────────────────────
const FilterChip = ({ filterKey, value, onRemove }) => {
  const meta = FILTER_KEYS[filterKey];
  const label = filterKey === "activo"
    ? (value === "1" ? "Activo: Sí" : "Activo: No")
    : filterKey === "tipo"
      ? `Tipo: ${value === "FT" ? "Frontend" : value === "BK" ? "Backend" : value}`
      : `${meta.label}: ${value}`;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {label}
      <button
        type="button"
        onClick={() => onRemove(filterKey)}
        className="ml-0.5 hover:opacity-70 transition"
      >
        <IconX className="w-3 h-3" />
      </button>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function PermisosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslation();

  useDynamicTitle(t.permissions ?? "Permisos");

  const [permisos, setPermisos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawTerm, setRawTerm] = useState("");
  const [debouncedRaw] = useDebounce(rawTerm, 350);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  // Filtros parseados derivados del input — se recalculan con debounce
  const parsedFilters = useMemo(() => parseSearch(debouncedRaw), [debouncedRaw]);

  // Chips activos (solo los prefijos especiales, no el term libre)
  const activeChips = useMemo(
    () => Object.entries(parsedFilters).filter(([k]) => k in FILTER_KEYS),
    [parsedFilters]
  );

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      codigo: "", modulo: "", accion: "",
      tipo: TIPO_OPTIONS[0], etiqueta: "", activo: true,
    },
  });

  // ── Carga ─────────────────────────────────────────────────────────────────
  const fetchPermisos = useCallback(async (p = 1, filters = {}) => {
    setLoading(true);
    try {
      const res = await axiosClient.get(URL_BASE, {
        params: { page: p, pageSize: PAGE_SIZE, ...filters },
      });
      setPermisos(res.data.data);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      Toast.fire({ icon: "error", title: "Error cargando permisos" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermisos(1, parsedFilters);
  }, [debouncedRaw, fetchPermisos]);

  // ── Quitar chip → eliminar el prefijo del input ───────────────────────────
  const removeChip = (key) => {
    const regex = new RegExp(`${key}:\\S+\\s*`, "gi");
    setRawTerm(prev => prev.replace(regex, "").trim());
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openCrear = () => {
    setEditando(null);
    reset({ codigo: "", modulo: "", accion: "", tipo: TIPO_OPTIONS[0], etiqueta: "", activo: true });
    setShowModal(true);
  };

  const openEditar = (permiso) => {
    setEditando(permiso);
    reset({
      codigo: permiso.codigo,
      modulo: permiso.modulo,
      accion: permiso.accion,
      tipo: TIPO_OPTIONS.find(o => o.value === permiso.tipo) ?? TIPO_OPTIONS[0],
      etiqueta: permiso.etiqueta,
      activo: permiso.activo,
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditando(null); reset(); };

  // ── Generador de código ───────────────────────────────────────────────────
  const generarCodigo = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codigo = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    reset(prev => ({ ...prev, codigo }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...(editando && { codPermiso: editando.codPermiso }),
        codigo: data.codigo.trim().toUpperCase(),
        modulo: data.modulo?.trim() || "",
        accion: data.accion?.trim() || "",
        tipo: data.tipo?.value ?? "FT",
        etiqueta: data.etiqueta.trim(),
        activo: data.activo,
      };

      const res = editando
        ? await axiosClient.put(`${URL_BASE}/editar`, payload)
        : await axiosClient.post(`${URL_BASE}/registro`, payload);

      setPermisos(res.data.data);
      setTotal(res.data.total);
      Toast.fire({ icon: "success", title: editando ? "Permiso actualizado" : "Permiso registrado" });
      closeModal();
    } catch (err) {
      Toast.fire({ icon: "error", title: err?.response?.data?.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo ─────────────────────────────────────────────────────────
  const toggleActivo = async (permiso) => {
    try {
      const res = await axiosClient.post(`${URL_BASE}/status`, {
        codPermiso: permiso.codPermiso,
        activo: !permiso.activo,
      });
      setPermisos(res.data.data);
      setTotal(res.data.total);
    } catch {
      Toast.fire({ icon: "error", title: "Error al cambiar estado" });
    }
  };

  // ── Paginación ────────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    newPage > 1 ? params.set("page", newPage) : params.delete("page");
    router.push(`?${params.toString()}`);
    fetchPermisos(newPage, parsedFilters);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.admin}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.permissions}</span>
        </li>
      </ul>
      <div className="p-6 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {t.permissions ?? "Permisos"}{" "}
              <span className="text-base font-normal text-gray-400">({total})</span>
            </h1>
            <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
          </div>

          <div className="flex flex-wrap items-start gap-3">

            {/* Input buscador */}
            <div className="flex flex-col gap-1.5">
              <div className="relative w-80">
                <input
                  type="text"
                  value={rawTerm}
                  onChange={e => setRawTerm(e.target.value)}
                  placeholder='Ej: modulo:Usuarios tipo:ft activo:1'
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700
                             bg-white dark:bg-gray-900
                             px-4 py-2 pr-10 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400">
                  <IconSearch className="h-4 w-4" />
                </span>
              </div>

              {/* Chips de filtros activos */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeChips.map(([key, val]) => (
                    <FilterChip key={key} filterKey={key} value={val} onRemove={removeChip} />
                  ))}
                  {/* Limpiar todo */}
                  <button
                    type="button"
                    onClick={() => setRawTerm("")}
                    className="text-xs text-gray-400 hover:text-red-500 transition underline"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}

              {/* Hint de sintaxis */}
              <p className="text-[11px] text-gray-400 leading-tight">
                Prefijos: <span className="font-mono">modulo:</span> <span className="font-mono">accion:</span> <span className="font-mono">tipo:ft</span> <span className="font-mono">tipo:bk</span> <span className="font-mono">activo:1</span>
              </p>
            </div>

            <button
              type="button"
              onClick={openCrear}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                         text-white text-sm font-medium
                         shadow-sm hover:shadow-md transition-all"
            >
              <IconPlus className="h-4 w-4" />
              {t.new_permission ?? "Nuevo Permiso"}
            </button>

          </div>
        </div>

        {/* ── TABLA ── */}
        <div className="panel border-0 p-0 overflow-x-auto">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Cargando...</p>
          ) : permisos.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Sin resultados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b dark:border-gray-700 text-left bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 w-10" />
                  <th className="px-4 py-2">Código</th>
                  <th className="px-4 py-2">Etiqueta</th>
                  <th className="px-4 py-2">Módulo</th>
                  <th className="px-4 py-2">Acción</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2 text-center">Activo</th>
                </tr>
              </thead>
              <tbody>
                {permisos.map((p) => (
                  <tr
                    key={p.codPermiso}
                    className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditar(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Editar"
                      >
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tracking-widest">{p.codigo}</td>
                    <td className="px-4 py-3">{p.etiqueta}</td>
                    <td className="px-4 py-3 text-gray-500">{p.modulo || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.accion || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.tipo === "FT"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        }`}>
                        {p.tipo === "FT" ? "FRONTEND" : "BACKEND"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActivo(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title={p.activo ? "Desactivar" : "Activar"}
                      >
                        {p.activo
                          ? <IconToggleOn className="w-8 h-8 fill-green-500" />
                          : <IconToggleOff className="w-8 h-8 text-gray-400" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── PAGINACIÓN ── */}
        {total > PAGE_SIZE && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={Math.ceil(total / PAGE_SIZE)}
              value={page}
              onChange={handlePageChange}
              size="sm"
              radius="xl"
            />
          </div>
        )}

      </div>

      {/* ── MODAL ── */}
      <Modal
        size="w-full max-w-lg"
        closeModal={closeModal}
        showModal={showModal}
        title={editando ? "Editar Permiso" : "Nuevo Permiso"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Código <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">(8 chars, A–Z 0–9)</span>
            </label>
            <div className="flex">
              <input
                {...register("codigo", RULES.codigo)}
                maxLength={8}
                placeholder="Ej: ZLU3HB7P"
                className="form-input flex-1 rounded-r-none font-mono uppercase tracking-widest"
                onInput={e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")}
              />
              <button
                type="button"
                onClick={generarCodigo}
                className="px-3 rounded-r-lg border border-l-0 border-gray-300 dark:border-gray-700
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           text-xs font-medium text-gray-600 dark:text-gray-300
                           transition whitespace-nowrap"
              >
                Generar
              </button>
            </div>
            <FieldError error={errors.codigo} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Etiqueta <span className="text-red-500">*</span>
            </label>
            <input
              {...register("etiqueta", RULES.etiqueta)}
              placeholder="Ej: Listar Usuarios"
              className="form-input w-full"
            />
            <FieldError error={errors.etiqueta} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Módulo</label>
              <input {...register("modulo", RULES.modulo)} placeholder="Ej: Usuarios" className="form-input w-full" />
              <FieldError error={errors.modulo} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Acción</label>
              <input {...register("accion", RULES.accion)} placeholder="Ej: listar" className="form-input w-full" />
              <FieldError error={errors.accion} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select options={TIPO_OPTIONS} value={field.value} onChange={field.onChange} classNamePrefix="select" className="w-full" />
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo" {...register("activo")} className="form-checkbox" />
            <label htmlFor="activo" className="text-sm font-medium cursor-pointer">Activo</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50 transition-all">
              {saving ? "Guardando..." : editando ? "Actualizar" : "Guardar"}
            </button>
          </div>

        </form>
      </Modal>
    </>
  );
}