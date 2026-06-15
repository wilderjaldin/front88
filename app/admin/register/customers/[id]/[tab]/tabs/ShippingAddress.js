// app/admin/register/customers/[id]/[tab]/tabs/ShippingAddress.js
'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import ShippingForm from '@/app/admin/register/customers/form/shipping';
import Swal from 'sweetalert2';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSearch from '@/components/icon/icon-search';
import IconX from '@/components/icon/icon-x';
import IconToggleOff from '@/components/icon/icon-toggle-off';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_DIRECCIONES      = (codCliente) => `/clientes/${codCliente}/direcciones`;
const URL_ELIMINAR_DIR     = (codCliente) => `/clientes/${codCliente}/direcciones/eliminar`;
const URL_ACTIVAR_DIR      = (codCliente) => `/clientes/${codCliente}/direcciones/activar`;
const URL_GUARDAR_DIR      = (codCliente) => `/clientes/${codCliente}/direcciones/guardar`;
const URL_PREDETERMINADO_DIR = (codCliente) => `/clientes/${codCliente}/direcciones/predeterminado`;

// ─────────────────────────────────────────────────────────────────────────────
const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ── Icono estrella inline (sin dependencia de icon-star) ─────────────────────
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
const DireccionCard = ({ dir, onEdit, onDelete, onActivate, onSetDefault, settingDefault }) => {
  const isActive  = dir.codEstado === 'AC';
  const isDefault = !!dir.blnPredet;

  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-900 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden
      ${isDefault
        ? 'border-yellow-400 dark:border-yellow-500'
        : 'border-gray-200 dark:border-gray-700'}`}>

      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
          ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
          <IconMapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
              {[dir.nomPais, dir.nomCiudad].filter(Boolean).join(' — ')}
            </h3>
            {isDefault && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                <IconStar filled className="w-2.5 h-2.5" />
                Predeterminado
              </span>
            )}
          </div>
          {dir.desDireccion && (
            <p className="text-xs text-gray-400 truncate">{dir.desDireccion}</p>
          )}
        </div>
        {!isActive && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 dark:bg-gray-800">
            Inactivo
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-1.5 text-xs">
        {dir.nomEmpresa && (
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0 w-16">Empresa</span>
            <span className="text-gray-700 dark:text-gray-300 truncate">{dir.nomEmpresa}</span>
          </div>
        )}
        {dir.nomContacto && (
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0 w-16">Contacto</span>
            <span className="text-gray-700 dark:text-gray-300 truncate">{dir.nomContacto}</span>
          </div>
        )}
        {dir.numTelefono && (
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0 w-16">Teléfono</span>
            <span className="text-gray-700 dark:text-gray-300 truncate">{dir.numTelefono}</span>
          </div>
        )}
        {dir.mail && (
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0 w-16">Correo</span>
            <span className="text-gray-700 dark:text-gray-300 truncate">{dir.mail}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        {isActive ? (
          <>
            {/* Estrella — predeterminado */}
            <button
              onClick={() => !isDefault && onSetDefault(dir)}
              disabled={isDefault || settingDefault}
              title={isDefault ? 'Dirección predeterminada' : 'Marcar como predeterminada'}
              className={`p-1.5 rounded-lg transition
                ${isDefault
                  ? 'text-yellow-400 cursor-default'
                  : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800'}`}
            >
              <IconStar filled={isDefault} className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(dir)} title="Editar"
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
              <IconPencil className="w-4 h-4 text-blue-500" />
            </button>
            <button onClick={() => onDelete(dir)} title="Eliminar"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition">
              <IconTrashLines className="w-4 h-4 text-red-500" />
            </button>
          </>
        ) : (
          <button onClick={() => onActivate(dir)} title="Activar"
            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition">
            <IconToggleOff className="w-6 h-6 text-gray-400 hover:text-green-500 transition" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ShippingAddress({
  cliente,
  shipping, setShipping,
  loadShipping, setLoadShipping, t
}) {
  const [view,           setView]           = useState('list');
  const [showModal,      setShowModal]      = useState(false);
  const [modalTitle,     setModalTitle]     = useState('');
  const [editDir,        setEditDir]        = useState(null);
  const [fetching,       setFetching]       = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

  const [term,   setTerm]   = useState('');
  const [estado, setEstado] = useState(null);

  const prevEstado = useRef(undefined);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadShipping) return;
    fetchDirecciones(null);
  }, []);

  // ── Solo cuando cambia el prefijo estado → API ────────────────────────────
  useEffect(() => {
    if (prevEstado.current === undefined) {
      prevEstado.current = estado;
      return;
    }
    if (prevEstado.current === estado) return;
    prevEstado.current = estado;
    fetchDirecciones(estado);
  }, [estado]);

  const fetchDirecciones = async (codEstado = null) => {
    setFetching(true);
    try {
      const params = codEstado ? { codEstado } : {};
      const res = await axiosClient.get(URL_DIRECCIONES(cliente.codCliente), { params });
      setShipping(res.data ?? []);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cargar direcciones' });
    } finally {
      setFetching(false);
      setLoadShipping(false);
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

  const removeEstadoChip = () => {
    setEstado(null);
  };

  // ── Filtro local ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!term.trim()) return shipping;
    const q = term.toLowerCase();
    return shipping.filter(d =>
      d.nomEmpresa?.toLowerCase().includes(q)   ||
      d.nomContacto?.toLowerCase().includes(q)  ||
      d.desDireccion?.toLowerCase().includes(q) ||
      d.nomPais?.toLowerCase().includes(q)      ||
      d.nomCiudad?.toLowerCase().includes(q)
    );
  }, [shipping, term]);

  // ── Acciones modal ────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditDir(null);
    setModalTitle(`Agregar Dirección — ${cliente.nomCliente}`);
    setShowModal(true);
  };

  const handleEdit = (dir) => {
    setEditDir(dir);
    setModalTitle(`Editar Dirección — ${cliente.nomCliente}`);
    setShowModal(true);
  };

  // ── Marcar como predeterminado ────────────────────────────────────────────
  const handleSetDefault = async (dir) => {
    setSettingDefault(true);
    try {
      const res = await axiosClient.post(URL_PREDETERMINADO_DIR(cliente.codCliente), {
        codRegistro: dir.codRegistro,
      });
      setShipping(res.data ?? []);
      Toast.fire({ icon: 'success', title: 'Dirección predeterminada actualizada' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al marcar como predeterminada' });
    } finally {
      setSettingDefault(false);
    }
  };

  // ── Eliminar (AC → IN) ────────────────────────────────────────────────────
  const handleDelete = (dir) => {
    Swal.fire({
      title: '¿Eliminar esta dirección?',
      text: [dir.nomPais, dir.nomCiudad, dir.desDireccion].filter(Boolean).join(' · '),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_ELIMINAR_DIR(cliente.codCliente), {
          codRegistro: dir.codRegistro,
        });
        setShipping(res.data ?? []);
        Toast.fire({ icon: 'success', title: 'Dirección eliminada' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al eliminar' });
      }
    });
  };

  // ── Activar (IN → AC) ─────────────────────────────────────────────────────
  const handleActivate = (dir) => {
    Swal.fire({
      title: '¿Activar esta dirección?',
      text: [dir.nomPais, dir.nomCiudad, dir.desDireccion].filter(Boolean).join(' · '),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_ACTIVAR_DIR(cliente.codCliente), {
          codRegistro: dir.codRegistro,
        });
        setShipping(res.data ?? []);
        Toast.fire({ icon: 'success', title: 'Dirección activada' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al activar' });
      }
    });
  };

  // ── Tras guardar ──────────────────────────────────────────────────────────
  const handleSaved = (updatedList) => {
    setShipping(updatedList);
    setShowModal(false);
  };

  // ── Spinner global solo en carga inicial ──────────────────────────────────
  if (loadShipping) {
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
            Direcciones de Entrega
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </h2>

          <div className="flex flex-wrap items-start gap-2">

            {/* Input con prefijos */}
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
              <IconMapPin className="h-4 w-4" />
              Agregar Dirección
            </button>
          </div>
        </div>

        {/* ── EMPTY ────────────────────────────────────────────────────── */}
        {!fetching && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 py-16 flex flex-col items-center gap-2">
            <IconMapPin className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              {term ? 'Sin resultados para la búsqueda' : 'No hay direcciones registradas'}
            </p>
          </div>
        )}

        {/* ── VISTA LISTA ──────────────────────────────────────────────── */}
        {view === 'list' && filtered.length > 0 && (
          <div className={`panel overflow-hidden border-0 p-0 transition-opacity duration-150 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
            <div className="table-responsive">
              <table className="table-striped table-hover [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700 w-full">
                <thead>
                  <tr>
                    <th>Lugar</th>
                    <th>Dirección</th>
                    <th>Empresa</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Correo electrónico</th>
                    <th>Estado</th>
                    <th>Cod. Postal</th>
                    <th className="w-28 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((dir) => {
                    const isActive  = dir.codEstado === 'AC';
                    const isDefault = !!dir.blnPredet;
                    return (
                      <tr key={dir.codRegistro} className={!isActive ? 'opacity-60' : ''}>
                        <td className="font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {[dir.nomPais, dir.nomCiudad].filter(Boolean).join(' ')}
                          </div>
                        </td>
                        <td className="text-gray-500 max-w-[180px] truncate">{dir.desDireccion || '—'}</td>
                        <td className="text-gray-500">{dir.nomEmpresa  || '—'}</td>
                        <td className="text-gray-500">{dir.nomContacto || '—'}</td>
                        <td className="text-gray-500">{dir.numTelefono || '—'}</td>
                        <td className="text-gray-500 max-w-[180px] truncate">{dir.mail || '—'}</td>
                        <td className="text-gray-500">{dir.nomEstado   || '—'}</td>
                        <td className="text-gray-500">{dir.codPostal   || '—'}</td>
                        <td>
                          <div className="flex items-center justify-center gap-1">
                            {isActive ? (
                              <>
                                {/* Estrella — predeterminado */}
                                <button
                                  onClick={() => !isDefault && handleSetDefault(dir)}
                                  disabled={isDefault || settingDefault}
                                  title={isDefault ? 'Dirección predeterminada' : 'Marcar como predeterminada'}
                                  className={`p-1.5 rounded-lg transition
                                    ${isDefault
                                      ? 'text-yellow-400 cursor-default'
                                      : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800'}`}
                                >
                                  <IconStar filled={isDefault} className="w-4 h-4" />
                                </button>
                                <button title="Editar" onClick={() => handleEdit(dir)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                                  <IconPencil className="w-4 h-4 text-blue-500" />
                                </button>
                                <button title="Eliminar" onClick={() => handleDelete(dir)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition">
                                  <IconTrashLines className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <button title="Activar" onClick={() => handleActivate(dir)}
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
            {filtered.map((dir) => (
              <DireccionCard
                key={dir.codRegistro}
                dir={dir}
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
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={modalTitle}
      >
        <ShippingForm
          dir={editDir}
          cliente={cliente}
          isNew={!editDir}
          urlGuardar={URL_GUARDAR_DIR(cliente.codCliente)}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}