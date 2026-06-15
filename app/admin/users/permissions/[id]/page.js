'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import axiosClient from "@/app/lib/axiosClient";
import Link from 'next/link';
import IconSave from '@/components/icon/icon-save';
import IconSearch from "@/components/icon/icon-search";
import IconX from "@/components/icon/icon-x";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_get_user = '/usuarios/permisos';
const url_update   = '/usuarios/permisos/update';

const TABS = [
  { key: 'all',        label: 'Todos'       },
  { key: 'active',     label: 'Activos'     },
  { key: 'inactive',   label: 'Sin permiso' },
];

function FilterTabs({ tabs, active, counts, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px]">
      {tabs.map(tab => (
        <button key={tab.key} type="button" onClick={() => onChange(tab.key)}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors font-medium ${
            active === tab.key
              ? "bg-slate-700 text-white dark:bg-slate-600"
              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${
            active === tab.key ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
          }`}>
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

function PermisoCheck({ permiso, register, checked, accent = 'primary' }) {
  const styles = {
    primary: {
      on:  "border-primary/40 bg-primary/5 dark:bg-primary/10 dark:border-primary/30",
      off: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50",
      text: "text-primary font-medium",
    },
    amber: {
      on:  "border-amber-300/60 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-700/30",
      off: "border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-900/10",
      text: "text-amber-700 dark:text-amber-400 font-medium",
    },
  };
  const s = styles[accent];
  return (
    <label className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${checked ? s.on : s.off}`}>
      <input
        type="checkbox"
        {...register(permiso.codPermiso)}
        className={`w-4 h-4 shrink-0 ${accent === 'amber' ? 'accent-amber-500' : 'accent-primary'}`}
      />
      <span className={`text-xs leading-snug ${checked ? s.text : "text-gray-600 dark:text-gray-300"}`}>
        {permiso.etiqueta}
      </span>
    </label>
  );
}

export default function UserPermissions() {
  const params = useParams();
  const id     = params?.id;
  const t      = useTranslation();
  const router = useRouter();

  const [saving,      setSaving]      = useState(false);
  const [user,        setUser]        = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [filterRol,        setFilterRol]        = useState('all');
  const [filterIndividual, setFilterIndividual] = useState('all');
  const [searchRol,        setSearchRol]        = useState('');
  const [searchInd,        setSearchInd]        = useState('');

  const { register, handleSubmit, reset, watch } = useForm();
  const watchedValues = watch();

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get(url_get_user, { params: { id } });
        setUser(data.usuario);
        setPermissions(data.permisos || []);
        const defaults = {};
        (data.permisos || []).forEach(p => { defaults[p.codPermiso] = p.final; });
        reset(defaults);
      } catch {
        setError('Error al obtener información del usuario');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, reset]);

  // ── Grupos base ───────────────────────────────────────────────────────────
  const rolPerms        = useMemo(() => permissions.filter(p => p.rol === true),  [permissions]);
  const individualPerms = useMemo(() => permissions.filter(p => p.rol === false), [permissions]);

  // ── Contadores dinámicos (según estado actual del form) ───────────────────
  const rolCounts = useMemo(() => ({
    all:      rolPerms.length,
    active:   rolPerms.filter(p =>  !!watchedValues[p.codPermiso]).length,
    inactive: rolPerms.filter(p => !watchedValues[p.codPermiso]).length,
  }), [rolPerms, watchedValues]);

  const indCounts = useMemo(() => ({
    all:      individualPerms.length,
    active:   individualPerms.filter(p =>  !!watchedValues[p.codPermiso]).length,
    inactive: individualPerms.filter(p => !watchedValues[p.codPermiso]).length,
  }), [individualPerms, watchedValues]);

  // ── Listas filtradas ──────────────────────────────────────────────────────
  const filteredRol = useMemo(() => {
    let list = rolPerms;
    if (filterRol === 'active')   list = list.filter(p =>  !!watchedValues[p.codPermiso]);
    if (filterRol === 'inactive') list = list.filter(p => !watchedValues[p.codPermiso]);
    const q = searchRol.trim().toLowerCase();
    if (q) list = list.filter(p => p.etiqueta.toLowerCase().includes(q));
    return list;
  }, [rolPerms, filterRol, searchRol, watchedValues]);

  const filteredInd = useMemo(() => {
    let list = individualPerms;
    if (filterIndividual === 'active')   list = list.filter(p =>  !!watchedValues[p.codPermiso]);
    if (filterIndividual === 'inactive') list = list.filter(p => !watchedValues[p.codPermiso]);
    const q = searchInd.trim().toLowerCase();
    if (q) list = list.filter(p => p.etiqueta.toLowerCase().includes(q));
    return list;
  }, [individualPerms, filterIndividual, searchInd, watchedValues]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    if (!user?.codUsuario) return;
    setSaving(true);
    try {
      await axiosClient.post(url_update, {
        codUsuario: Number(user.codUsuario),
        permisos: permissions.map(p => ({
          codPermiso: p.codPermiso,
          rol: p.rol === true,
          check: !!formData[p.codPermiso],
        })),
      });
      Swal.fire({ position: 'top-end', icon: 'success', title: 'Permisos actualizados correctamente', timer: 3000, showConfirmButton: false });
      router.push('/admin/users');
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err?.response?.data?.message || 'Error al actualizar', timer: 3000, showConfirmButton: false });
    } finally {
      setSaving(false);
    }
  };

  useDynamicTitle(`${t.users} | ${t.permissions}`);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando permisos...</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const initials = user?.nomUsuario?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.admin}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <Link href="/admin/users" className="text-primary hover:underline">{t.users}</Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.permissions}</span>
        </li>
      </ul>

      <div className="pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Personalizar permisos del usuario</h1>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>
          <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
            <div>
              <p className="text-xl font-bold text-amber-500 leading-none">{rolCounts.active}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Del Rol</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-primary leading-none">{indCounts.active}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Individuales</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-none">
                {rolCounts.active + indCounts.active}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Total activos</p>
            </div>
          </div>
        </div>

        {/* Info usuario */}
        <div className="panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.nomUsuario}</p>
              <p className="text-xs text-gray-400">{user?.logUsuario}</p>
            </div>
            <Link
              href={`/admin/roles/settings/${user?.codRol}`}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/30 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition shrink-0"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {user?.rol}
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Permisos del Rol ─────────────────────────────────────────── */}
          <div className="panel p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Permisos del Rol
              </h2>
              <FilterTabs tabs={TABS} active={filterRol} counts={rolCounts} onChange={setFilterRol} />
              <div className="relative ml-auto">
                <input type="text" value={searchRol} onChange={e => setSearchRol(e.target.value)}
                  placeholder="Buscar..." className="w-44 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {searchRol
                  ? <button type="button" onClick={() => setSearchRol('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><IconX className="h-3.5 w-3.5" /></button>
                  : <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch className="h-3.5 w-3.5" /></span>
                }
              </div>
            </div>

            {filteredRol.length === 0
              ? <p className="text-xs text-gray-400 py-2 text-center">Sin resultados.</p>
              : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredRol.map(p => (
                    <PermisoCheck
                      key={p.codPermiso}
                      permiso={p}
                      register={register}
                      checked={!!watchedValues[p.codPermiso]}
                      accent="amber"
                    />
                  ))}
                </div>
            }
          </div>

          {/* ── Permisos Individuales ────────────────────────────────────── */}
          <div className="panel p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Permisos Individuales
              </h2>
              <FilterTabs tabs={TABS} active={filterIndividual} counts={indCounts} onChange={setFilterIndividual} />
              <div className="relative ml-auto">
                <input type="text" value={searchInd} onChange={e => setSearchInd(e.target.value)}
                  placeholder="Buscar..." className="w-44 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {searchInd
                  ? <button type="button" onClick={() => setSearchInd('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><IconX className="h-3.5 w-3.5" /></button>
                  : <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch className="h-3.5 w-3.5" /></span>
                }
              </div>
            </div>

            {filteredInd.length === 0
              ? <p className="text-xs text-gray-400 py-2 text-center">{individualPerms.length === 0 ? 'No hay permisos individuales disponibles.' : 'Sin resultados.'}</p>
              : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredInd.map(p => (
                    <PermisoCheck
                      key={p.codPermiso}
                      permiso={p}
                      register={register}
                      checked={!!watchedValues[p.codPermiso]}
                      accent="primary"
                    />
                  ))}
                </div>
            }
          </div>

          {/* ── Botones ── */}
          <div className="flex justify-end gap-3">
            <Link href="/admin/users"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              {t.btn_cancel}
            </Link>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
              {saving ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Guardando...</>
              ) : (
                <><IconSave className="h-4 w-4" />Guardar Cambios</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
