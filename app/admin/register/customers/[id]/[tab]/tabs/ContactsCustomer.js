// app/admin/register/customers/[id]/[tab]/tabs/ContactsCustomer.js
'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import ComponentContactForm from '@/components/forms/contact-form';
import Swal from 'sweetalert2';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSearch from '@/components/icon/icon-search';
import IconUser from '@/components/icon/icon-user';
import IconX from '@/components/icon/icon-x';
import IconToggleOff from '@/components/icon/icon-toggle-off';
import { PERMISSIONS } from '@/constants/permissions';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_CONTACTOS              = (codCliente) => `/clientes/${codCliente}/contactos`;
const URL_ELIMINAR_CONTACTO      = (codCliente) => `/clientes/${codCliente}/contactos/eliminar`;
const URL_ACTIVAR_CONTACTO       = (codCliente) => `/clientes/${codCliente}/contactos/activar`;
const URL_PREDETERMINADO_CONTACTO = (codCliente) => `/clientes/${codCliente}/contactos/predeterminado`;

// ── Helpers para valores separados por ";" ────────────────────────────────────
const splitValues = (val) => (val ?? '').split(';').map(s => s.trim()).filter(Boolean);

const PhoneBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="flex flex-wrap gap-0.5">
      {items.map((item, i) => (
        <span key={i} className="inline-block rounded px-1.5 py-0.5 text-[11px] font-mono
                                  bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {item}
        </span>
      ))}
    </div>
  );
};

const EmailBadges = ({ value }) => {
  const items = splitValues(value);
  if (!items.length) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="flex flex-wrap gap-0.5">
      {items.map((item, i) => (
        <span key={i} className="inline-block rounded px-1.5 py-0.5 text-[11px]
                                  bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
          {item}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ── Icono estrella inline ─────────────────────────────────────────────────────
const IconStar = ({ filled = false, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
    />
  </svg>
);

// ── Chip de estado ────────────────────────────────────────────────────────────
const EstadoChip = ({ value, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                   bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
    Estado: {value === 'AC' ? t.active : t.inactive}
    <button type="button" onClick={onRemove} className="ml-0.5 hover:opacity-70 transition">
      <IconX className="w-3 h-3" />
    </button>
  </span>
);

// ── Tarjeta grid ──────────────────────────────────────────────────────────────
const ContactCard = ({ contact, onEdit, onDelete, onActivate, onSetDefault, settingDefault }) => {
  const isActive  = contact.codEstado === 'AC';
  const isDefault = !!contact.blnFijar;

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-900 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden
      ${isDefault
        ? 'border-yellow-400 dark:border-yellow-500'
        : 'border-gray-200 dark:border-gray-700'}`}>

      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm uppercase
          ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
          {contact.nomContacto?.charAt(0) ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
              {contact.nomContacto}
            </h3>
            {isDefault && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                <IconStar filled className="w-2.5 h-2.5" />
                Predeterminado
              </span>
            )}
          </div>
          {contact.nomCargo && (
            <p className="text-xs text-gray-400 truncate">{contact.nomCargo}</p>
          )}
        </div>
        {!isActive && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 dark:bg-gray-800">
            Inactivo
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-2.5 text-xs min-h-[60px]">
        {contact.telefonos && (
          <div className="space-y-1">
            <span className="text-gray-400">Teléfonos</span>
            <PhoneBadges value={contact.telefonos} />
          </div>
        )}
        {contact.correos && (
          <div className="space-y-1">
            <span className="text-gray-400">Correos</span>
            <EmailBadges value={contact.correos} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        {isActive ? (
          <>
            {/* Estrella — predeterminado */}
            <button
              onClick={() => !isDefault && onSetDefault(contact)}
              disabled={isDefault || settingDefault}
              title={isDefault ? 'Contacto predeterminado' : 'Marcar como predeterminado'}
              className={`p-1.5 rounded-lg transition
                ${isDefault
                  ? 'text-yellow-400 cursor-default'
                  : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800'}`}
            >
              <IconStar filled={isDefault} className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(contact)} title="Editar"
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
              <IconPencil className="w-4 h-4 text-blue-500" />
            </button>
            <button onClick={() => onDelete(contact)} title="Eliminar"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition">
              <IconTrashLines className="w-4 h-4 text-red-500" />
            </button>
          </>
        ) : (
          <button onClick={() => onActivate(contact)} title="Activar"
            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition">
            <IconToggleOff className="w-6 h-6 text-gray-400 hover:text-green-500 transition" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ContactsCustomer({
  cliente,
  contacts, setContacts,
  loadContacts, setLoadContacts, t, hasPermission
}) {
  const [view,           setView]           = useState('list');
  const [showModal,      setShowModal]      = useState(false);
  const [modalTitle,     setModalTitle]     = useState('');
  const [editContact,    setEditContact]    = useState(null);
  const [fetching,       setFetching]       = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const [term,   setTerm]   = useState('');
  const [estado, setEstado] = useState(null);

  const prevEstado = useRef(undefined);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadContacts) return;
    fetchContactos(null);
  }, []);

  // ── Solo cuando cambia el prefijo estado → llama a la API ─────────────────
  useEffect(() => {
    if (prevEstado.current === undefined) {
      prevEstado.current = estado;
      return;
    }
    if (prevEstado.current === estado) return;
    prevEstado.current = estado;
    fetchContactos(estado);
  }, [estado]);

  // ── Llamada a la API ──────────────────────────────────────────────────────
  const fetchContactos = async (codEstado = null) => {
    setFetching(true);
    try {
      const params = codEstado ? { codEstado } : {};
      const res = await axiosClient.get(URL_CONTACTOS(cliente.codCliente), { params });
      setContacts(res.data ?? []);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cargar contactos' });
    } finally {
      setFetching(false);
      setLoadContacts(false);
    }
  };

  // ── Parser del input ──────────────────────────────────────────────────────
  const handleInputChange = (raw) => {
    let remaining = raw;
    let nuevoEstado = null;

    const regex = /estado:(ac|in)/gi;
    const match  = regex.exec(raw);
    if (match) {
      nuevoEstado = match[1].toUpperCase();
      remaining   = raw.replace(match[0], '').trim();
    }

    setEstado(nuevoEstado);
    setTerm(remaining);
  };

  const inputValue = [
    estado ? `estado:${estado.toLowerCase()}` : '',
    term,
  ].filter(Boolean).join(' ');

  // ── Filtro local ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!term.trim()) return contacts;
    const q = term.toLowerCase();
    return contacts.filter(c =>
      c.nomContacto?.toLowerCase().includes(q) ||
      c.telefonos?.toLowerCase().includes(q)   ||
      c.correos?.toLowerCase().includes(q)
    );
  }, [contacts, term]);

  const removeEstadoChip = () => {
    setEstado(null);
  };

  // ── Modal agregar ─────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditContact(null);
    setModalTitle(`Agregar Contacto — ${cliente.nomCliente}`);
    setShowModal(true);
  };

  // ── Modal editar ──────────────────────────────────────────────────────────
  const handleEdit = (contact) => {
    setEditContact(contact);
    setModalTitle(`Editar Contacto — ${cliente.nomCliente}`);
    setShowModal(true);
  };

  // ── Marcar como predeterminado ────────────────────────────────────────────
  const handleSetDefault = async (contact) => {
    setSettingDefault(true);
    try {
      const res = await axiosClient.post(URL_PREDETERMINADO_CONTACTO(cliente.codCliente), {
        codRegistro: contact.codRegistro,
      });
      setContacts(res.data ?? []);
      Toast.fire({ icon: 'success', title: 'Contacto predeterminado actualizado' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al marcar como predeterminado' });
    } finally {
      setSettingDefault(false);
    }
  };

  // ── Eliminar (AC → IN) ────────────────────────────────────────────────────
  const handleDelete = (contact) => {
    Swal.fire({
      title: '¿Eliminar contacto?',
      text: contact.nomContacto,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_ELIMINAR_CONTACTO(cliente.codCliente), {
          codRegistro: contact.codRegistro,
        });
        setContacts(res.data ?? []);
        Toast.fire({ icon: 'success', title: 'Contacto eliminado' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al eliminar' });
      }
    });
  };

  // ── Activar (IN → AC) ─────────────────────────────────────────────────────
  const handleActivate = (contact) => {
    Swal.fire({
      title: '¿Activar este contacto?',
      text: contact.nomContacto,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_ACTIVAR_CONTACTO(cliente.codCliente), {
          codRegistro: contact.codRegistro,
        });
        setContacts(res.data ?? []);
        Toast.fire({ icon: 'success', title: 'Contacto activado' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al activar' });
      }
    });
  };

  // ── Tras guardar formulario ───────────────────────────────────────────────
  const handleSaved = (updatedList) => {
    setContacts(updatedList);
    setShowModal(false);
  };

  // ── Spinner global SOLO en carga inicial ──────────────────────────────────
  if (loadContacts) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">

        {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Contactos
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </h2>

          <div className="flex flex-wrap items-start gap-2">

            {/* Input */}
            <div className="flex flex-col gap-1">
              <div className="relative w-64">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => handleInputChange(e.target.value)}
                  placeholder="Buscar... estado:in"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700
                             bg-white dark:bg-gray-900 px-3 py-1.5 pr-8 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {fetching ? (
                    <span className="h-3.5 w-3.5 block animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : inputValue ? (
                    <button type="button"
                      onClick={() => { setTerm(''); setEstado(null); }}
                      className="text-gray-400 hover:text-gray-600 transition">
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <IconSearch className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </span>
              </div>

              {estado && (
                <div className="flex gap-1">
                  <EstadoChip value={estado} onRemove={removeEstadoChip} />
                </div>
              )}

              <p className="text-[11px] text-gray-400">
                Prefijo: <span className="font-mono">estado:ac</span> · <span className="font-mono">estado:in</span>
              </p>
            </div>

            {/* Toggle lista / grid */}
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

            {/* Agregar */}
            <button type="button" onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5
                         text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition">
              <IconUserPlus className="h-4 w-4" />
              Agregar Contacto
            </button>
          </div>
        </div>

        {/* ── EMPTY ────────────────────────────────────────────────────── */}
        {!fetching && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 py-16 flex flex-col items-center gap-2">
            <IconUser className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              {term ? 'Sin resultados para la búsqueda' : 'No hay contactos registrados'}
            </p>
          </div>
        )}

        {/* ── VISTA LISTA ──────────────────────────────────────────────── */}
        {view === 'list' && filtered.length > 0 && (
          <div className={`panel overflow-hidden border-0 p-0 transition-opacity duration-150 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
            <div className="table-responsive">
              <table className="table-striped table-hover [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700 w-full [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-1.5 [&_td]:!text-xs">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Teléfonos</th>
                    <th>Correos</th>
                    <th className="w-28 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => {
                    const isActive  = contact.codEstado === 'AC';
                    const isDefault = !!contact.blnFijar;
                    return (
                      <tr key={contact.codRegistro} className={!isActive ? 'opacity-60' : ''}>
                        <td className="font-medium text-gray-800 dark:text-gray-100">
                          <div className="flex items-center gap-1.5">
                            {contact.nomContacto}
                          </div>
                        </td>
                        <td className="text-gray-500">{contact.nomCargo || '—'}</td>
                        <td><PhoneBadges value={contact.telefonos} /></td>
                        <td className="max-w-[280px]"><EmailBadges value={contact.correos} /></td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            {isActive ? (
                              <>
                                {/* Estrella — predeterminado */}
                                <button
                                  onClick={() => !isDefault && handleSetDefault(contact)}
                                  disabled={isDefault || settingDefault}
                                  title={isDefault ? 'Contacto predeterminado' : 'Marcar como predeterminado'}
                                  className={`p-1.5 rounded-lg transition
                                    ${isDefault
                                      ? 'text-yellow-400 cursor-default'
                                      : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800'}`}
                                >
                                  <IconStar filled={isDefault} className="w-4 h-4" />
                                </button>
                                {(hasPermission(PERMISSIONS.EDITAR_CONTACTO_CLIENTE)) &&
                                <button title="Editar" onClick={() => handleEdit(contact)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                                  <IconPencil className="w-4 h-4 text-blue-500" />
                                </button>
                                }
                                <button title="Eliminar" onClick={() => handleDelete(contact)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition">
                                  <IconTrashLines className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <button title="Activar" onClick={() => handleActivate(contact)}
                                className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition">
                                <IconToggleOff className="w-6 h-6 text-gray-400 hover:text-green-500 transition" />
                              </button>
                            )}
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

        {/* ── VISTA GRID ───────────────────────────────────────────────── */}
        {view === 'grid' && filtered.length > 0 && (
          <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 transition-opacity duration-150 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
            {filtered.map((contact) => (
              <ContactCard
                key={contact.codRegistro}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onActivate={handleActivate}
                onSetDefault={handleSetDefault}
                settingDefault={settingDefault}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── MODAL ────────────────────────────────────────────────────────── */}
      <Modal
        size="w-full max-w-lg"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={modalTitle}
      >
        <ComponentContactForm
          contact={editContact}
          cliente={cliente}
          isNew={!editContact}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}