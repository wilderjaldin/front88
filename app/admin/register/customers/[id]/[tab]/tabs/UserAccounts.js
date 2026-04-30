// app/admin/register/customers/[id]/[tab]/tabs/UserAccounts.js
'use client';
import { useEffect, useState, useMemo } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import Swal from 'sweetalert2';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOff from '@/components/icon/icon-toggle-off';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSearch from '@/components/icon/icon-search';
import IconX from '@/components/icon/icon-x';
import IconUser from '@/components/icon/icon-user';
import UserForm from '@/app/admin/register/customers/form/user';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_USUARIOS = (id) => `/clientes/${id}/usuarios`;
const URL_STATUS   = (id) => `/clientes/${id}/usuarios/status`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const capitalize = (str) =>
  str?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) ?? '—';

// ── Badge estado ──────────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
    ${estado === 'AC'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
    {estado === 'AC' ? t.active : t.inactive}
  </span>
);

// ── Bloque de auditoría reutilizable (list + grid) ────────────────────────────
const AuditoriaBlock = ({ cuenta }) => (
  <div className="text-xs leading-tight space-y-1">
    <div>
      <span className="text-gray-400">Registrado</span>
      <div className="font-medium text-gray-700 dark:text-gray-200">{capitalize(cuenta.usuarioRegistra)}</div>
      <span className="text-gray-400 font-mono">{cuenta.fecRegistra ?? '—'}</span>
    </div>
    <div className="border-t border-gray-100 dark:border-gray-700" />
    <div>
      <span className="text-gray-400">Modificado</span>
      <div className="font-medium text-gray-700 dark:text-gray-200">{capitalize(cuenta.usuarioModifica)}</div>
      <span className="text-gray-400 font-mono">{cuenta.fecModifica ?? '—'}</span>
    </div>
  </div>
);

// ── Tarjeta grid ──────────────────────────────────────────────────────────────
const CuentaCard = ({ cuenta, onEdit, onToggle, toggling }) => {
  const isActive = cuenta.codEstado === 'AC';
  const initials = cuenta.nomUsuario
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-900 border shadow-sm
                     hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden
                     ${isActive ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-70'}`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                         font-semibold text-sm
                         ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
            {cuenta.nomUsuario}
          </h3>
          <p className="text-xs text-gray-400 truncate">{cuenta.logCliente}</p>
        </div>
        <EstadoBadge estado={cuenta.codEstado} />
      </div>

      {/* Auditoría */}
      <div className="px-4 py-3">
        <AuditoriaBlock cuenta={cuenta} />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <button onClick={() => onEdit(cuenta)} title="Editar"
          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
          <IconPencil className="w-4 h-4 text-blue-500" />
        </button>
        <button
          title={isActive ? 'Desactivar' : 'Activar'}
          disabled={toggling}
          onClick={() => onToggle(cuenta)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                     transition disabled:opacity-40 disabled:cursor-not-allowed">
          {toggling
            ? <span className="h-5 w-5 block animate-spin rounded-full border-2 border-primary border-t-transparent" />
            : isActive
              ? <IconToggleOn  className="w-6 h-6 text-green-500" />
              : <IconToggleOff className="w-6 h-6 text-gray-400" />
          }
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserAccounts({
  cliente,
  accounts, setAccounts,
  loadAccounts, setLoadAccounts, t
}) {

  const [view,        setView]        = useState('list');
  const [term,        setTerm]        = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadAccounts) return;
    axiosClient.get(URL_USUARIOS(cliente.codCliente))
      .then(res => setAccounts(res.data ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadAccounts(false));
  }, []);

  // ── Filtro local por nombre ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!term.trim()) return accounts;
    const q = term.toLowerCase();
    return accounts.filter(c =>
      c.nomUsuario?.toLowerCase().includes(q) ||
      c.logCliente?.toLowerCase().includes(q)
    );
  }, [accounts, term]);

  // ── Toggle AC ↔ IN ────────────────────────────────────────────────────────
  const handleToggleStatus = (cuenta) => {
    const activating = cuenta.codEstado !== 'AC';
    Swal.fire({
      title: activating ? '¿Activar cuenta?' : '¿Desactivar cuenta?',
      text:  `${cuenta.nomUsuario} — ${cuenta.logCliente}`,
      icon:  'question',
      showCancelButton:   true,
      confirmButtonColor: activating ? '#16a34a' : '#dc2626',
      confirmButtonText:  activating ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText:   t.btn_cancel,
      reverseButtons:     true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setTogglingId(cuenta.codUsuCliente);
      try {
        const res = await axiosClient.post(URL_STATUS(cliente.codCliente), {
          codUsuCliente: cuenta.codUsuCliente,
        });
        setAccounts(res.data ?? []);
        Toast.fire({ icon: 'success', title: activating ? 'Cuenta activada' : 'Cuenta desactivada' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al cambiar el estado' });
      } finally {
        setTogglingId(null);
      }
    });
  };

  const handleEdit = (cuenta) => { setEditAccount(cuenta); setShowModal(true); };

  // ── Spinner inicial ───────────────────────────────────────────────────────
  if (loadAccounts) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-4">

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.users ?? 'Cuentas de Usuario'}
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">

            {/* Búsqueda local */}
            <div className="relative w-56">
              <input
                type="text"
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-900 px-3 py-1.5 pr-8 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                {term ? (
                  <button type="button" onClick={() => setTerm('')}
                    className="text-gray-400 hover:text-gray-600 transition">
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <IconSearch className="h-3.5 w-3.5 text-gray-400" />
                )}
              </span>
            </div>

            {/* Toggle list / grid */}
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button type="button" onClick={() => setView('list')}
                className={`p-2 transition ${view === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <IconListCheck className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setView('grid')}
                className={`p-2 transition ${view === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <IconLayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Nueva cuenta */}
            <button type="button"
              onClick={() => { setEditAccount(null); setShowModal(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5
                         text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition">
              <IconUserPlus className="h-4 w-4" />
              Nueva Cuenta
            </button>
          </div>
        </div>

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 py-16 flex flex-col items-center gap-2">
            <IconUser className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              {term ? 'Sin resultados para la búsqueda' : 'No hay cuentas registradas'}
            </p>
          </div>
        )}

        {/* ── Vista lista ──────────────────────────────────────────────── */}
        {view === 'list' && filtered.length > 0 && (
          <div className="panel overflow-hidden border-0 p-0">
            <div className="table-responsive">
              <table className="table-striped table-hover w-full">
                <thead>
                  <tr>
                    <th>{t.name ?? 'Nombre'}</th>
                    <th>Login</th>
                    <th>{t.status ?? 'Estado'}</th>
                    <th>Auditoría</th>
                    <th className="w-24 text-center">{t.actions ?? 'Acciones'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cuenta) => {
                    const isActive = cuenta.codEstado === 'AC';
                    const toggling = togglingId === cuenta.codUsuCliente;
                    return (
                      <tr key={cuenta.codUsuCliente} className={!isActive ? 'opacity-60' : ''}>
                        <td className="font-medium text-gray-800 dark:text-gray-100">
                          {cuenta.nomUsuario}
                        </td>
                        <td className="text-gray-500 text-sm">{cuenta.logCliente}</td>
                        <td><EstadoBadge estado={cuenta.codEstado} /></td>
                        <td className="w-52">
                          <AuditoriaBlock cuenta={cuenta} />
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            <button title="Editar" onClick={() => handleEdit(cuenta)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                              <IconPencil className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              title={isActive ? 'Desactivar' : 'Activar'}
                              disabled={toggling}
                              onClick={() => handleToggleStatus(cuenta)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                         transition disabled:opacity-40 disabled:cursor-not-allowed">
                              {toggling
                                ? <span className="h-5 w-5 block animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                : isActive
                                  ? <IconToggleOn  className="w-6 h-6 text-green-500" />
                                  : <IconToggleOff className="w-6 h-6 text-gray-400" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Vista grid ───────────────────────────────────────────────── */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((cuenta) => (
              <CuentaCard
                key={cuenta.codUsuCliente}
                cuenta={cuenta}
                onEdit={handleEdit}
                onToggle={handleToggleStatus}
                toggling={togglingId === cuenta.codUsuCliente}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={editAccount ? 'Editar Cuenta de Usuario' : 'Nueva Cuenta de Usuario'}
      >
        <UserForm
          cuenta={editAccount}
          cliente={cliente}
          onCancel={() => setShowModal(false)}
          onSaved={(nuevaLista) => {
            setShowModal(false);
            setAccounts(nuevaLista);
          }}
        />
      </Modal>
    </>
  );
}