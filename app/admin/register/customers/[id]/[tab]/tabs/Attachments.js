// app/admin/register/customers/[id]/[tab]/tabs/Attachments.js
'use client';
import { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import Swal from 'sweetalert2';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencil from '@/components/icon/icon-pencil';
import IconPlus from '@/components/icon/icon-plus';
import AddBrandCustomerForm from '@/components/forms/add-brand-customer-form';
import AddEquipmentCustomerForm from '@/components/forms/add-equipment-customer-form';

// ── URLs ──────────────────────────────────────────────────────────────────────
// GET  /api/clientes/{id}/anexos             → { marcasCliente, equipos, marcas }
// POST /api/clientes/{id}/marcas/agregar     → { codMarca }            → marcasCliente[]
// POST /api/clientes/{id}/marcas/eliminar    → { codRegistro }         → marcasCliente[]
// POST /api/clientes/{id}/equipos/guardar    → dto (codRegistro=0|>0)  → equipos[]
// POST /api/clientes/{id}/equipos/eliminar   → { codRegistro }         → equipos[]
const URL_ANEXOS        = (id) => `/clientes/${id}/anexos`;
const URL_AGR_MARCA     = (id) => `/clientes/${id}/marcas/agregar`;
const URL_DEL_MARCA     = (id) => `/clientes/${id}/marcas/eliminar`;
const URL_GUARDAR_EQUIP = (id) => `/clientes/${id}/equipos/guardar`;
const URL_DEL_EQUIP     = (id) => `/clientes/${id}/equipos/eliminar`;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ─────────────────────────────────────────────────────────────────────────────
export default function Attachments({
  cliente,
  attachments, setAttachments,
  loadAttachments, setLoadAttachments, t
}) {

  // attachments = { marcasCliente: [], equipos: [], marcas: [] }
  const marcasCliente = attachments?.marcasCliente ?? [];
  const equipos       = attachments?.equipos       ?? [];
  const marcas        = attachments?.marcas        ?? []; // para los <Select>

  const [modalBrand,     setModalBrand]     = useState(false);
  const [modalEquipment, setModalEquipment] = useState(false);
  const [editEquipment,  setEditEquipment]  = useState(null); // null=nuevo, objeto=editar

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadAttachments) return;

    axiosClient.get(URL_ANEXOS(cliente.codCliente))
      .then(res => setAttachments(res.data ?? { marcasCliente: [], equipos: [], marcas: [] }))
      .catch(() => setAttachments({ marcasCliente: [], equipos: [], marcas: [] }))
      .finally(() => setLoadAttachments(false));
  }, []);

  // ── Helpers — actualizar subkeys del estado sin perder las demás ──────────
  const updateMarcasCliente = (list) => setAttachments(prev => ({ ...prev, marcasCliente: list }));
  const updateEquipos       = (list) => setAttachments(prev => ({ ...prev, equipos: list }));

  // ── Eliminar marca cliente ────────────────────────────────────────────────
  // Payload: { codRegistro } — ObtenerMarcasCliente devuelve la lista actualizada
  const handleDeleteBrand = (marca) => {
    Swal.fire({
      title: t.question_delete_brand,
      text:  marca.nomMarca,
      icon:  'question',
      showCancelButton:   true,
      confirmButtonColor: '#dc2626',
      confirmButtonText:  t.yes_delete,
      cancelButtonText:   t.btn_cancel,
      reverseButtons:     true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_DEL_MARCA(cliente.codCliente), {
          codRegistro: marca.codRegistro,
        });
        updateMarcasCliente(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.brand_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.brand_error_deleted });
      }
    });
  };

  // ── Eliminar equipo ───────────────────────────────────────────────────────
  // Payload: { codRegistro }
  const handleDeleteEquipment = (eq) => {
    Swal.fire({
      title: t.question_delete_equipment,
      text:  [eq.nomMarca, eq.modelo].filter(Boolean).join(' — '),
      icon:  'question',
      showCancelButton:   true,
      confirmButtonColor: '#dc2626',
      confirmButtonText:  t.yes_delete,
      cancelButtonText:   t.btn_cancel,
      reverseButtons:     true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(URL_DEL_EQUIP(cliente.codCliente), {
          codRegistro: eq.codRegistro,
        });
        updateEquipos(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.equipment_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.equipment_error_deleted });
      }
    });
  };

  // ── Spinner inicial ───────────────────────────────────────────────────────
  if (loadAttachments) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* ── Panel Marcas / Aplicación ───────────────────────────────── */}
          <div className="panel rounded-2xl border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3
                            border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t.brands}
                <span className="ml-2 text-xs font-normal text-gray-400">({marcasCliente.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalBrand(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5
                           text-white text-xs font-medium hover:bg-primary/90 transition group"
              >
                <IconPlus className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-90" />
                {t.btn_add}
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {marcasCliente.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay marcas registradas</p>
              ) : (
                marcasCliente.map((m) => (
                  <div key={m.codRegistro}
                    className="flex items-center justify-between px-4 py-2.5
                               hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {m.nomMarca}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(m)}
                      title={t.btn_delete}
                      className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100
                                 hover:bg-red-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <IconTrashLines className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Panel Equipos ────────────────────────────────────────────── */}
          <div className="panel rounded-2xl border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3
                            border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t.equipment_data}
                <span className="ml-2 text-xs font-normal text-gray-400">({equipos.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => { setEditEquipment(null); setModalEquipment(true); }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5
                           text-white text-xs font-medium hover:bg-primary/90 transition group"
              >
                <IconPlus className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-90" />
                {t.btn_add}
              </button>
            </div>

            {equipos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay equipos registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table-striped table-hover [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700 w-full text-sm">
                  <thead>
                    <tr>
                      <th colSpan={4}
                        className="text-center text-xs uppercase tracking-wide
                                   bg-primary/10 text-primary py-2 border-b border-gray-100 dark:border-gray-700">
                        {t.equipment_data}
                      </th>
                      <th colSpan={3}
                        className="text-center text-xs uppercase tracking-wide
                                   bg-gray-100 dark:bg-gray-800 text-gray-500 py-2
                                   border-b border-gray-100 dark:border-gray-700">
                        {t.engine_data}
                      </th>
                      <th className="border-b border-gray-100 dark:border-gray-700" />
                    </tr>
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 text-left">{t.brand}</th>
                      <th className="px-3 py-2 text-left">{t.model}</th>
                      <th className="px-3 py-2 text-left">{t.year}</th>
                      <th className="px-3 py-2 text-left">{t.serie}</th>
                      <th className="px-3 py-2 text-left bg-gray-50 dark:bg-gray-800/50">{t.brand}</th>
                      <th className="px-3 py-2 text-left bg-gray-50 dark:bg-gray-800/50">{t.model}</th>
                      <th className="px-3 py-2 text-left bg-gray-50 dark:bg-gray-800/50">{t.serie}</th>
                      <th className="px-3 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {equipos.map((eq) => (
                      <tr key={eq.codRegistro}>
                        {/* Equipo */}
                        <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          {eq.nomMarca || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{eq.modelo        || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{eq.anio          || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{eq.serie         || '—'}</td>
                        {/* Motor */}
                        <td className="px-3 py-2 text-gray-500 bg-gray-50 dark:bg-gray-800/30">
                          {eq.nomMarcaMotor || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500 bg-gray-50 dark:bg-gray-800/30">
                          {eq.modeloMotor   || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500 bg-gray-50 dark:bg-gray-800/30">
                          {eq.serieMotor    || '—'}
                        </td>
                        {/* Acciones */}
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button"
                              onClick={() => { setEditEquipment(eq); setModalEquipment(true); }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                              <IconPencil className="h-4 w-4 text-blue-500" />
                            </button>
                            <button type="button"
                              onClick={() => handleDeleteEquipment(eq)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition">
                              <IconTrashLines className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Modal — Agregar Marca ─────────────────────────────────────────── */}
      <Modal
        size="w-full max-w-md"
        showModal={modalBrand}
        closeModal={() => setModalBrand(false)}
        title={t.add_brand}
      >
        <AddBrandCustomerForm
          marcasCliente={marcasCliente}
          marcas={marcas}
          cliente={cliente}
          onCancel={() => setModalBrand(false)}
          onSaved={(nuevaLista) => {
            setModalBrand(false);
            updateMarcasCliente(nuevaLista);
          }}
        />
      </Modal>

      {/* ── Modal — Agregar / Editar Equipo ──────────────────────────────── */}
      <Modal
        size="w-full max-w-2xl"
        showModal={modalEquipment}
        closeModal={() => setModalEquipment(false)}
        title={editEquipment ? t.edit_equipment : t.add_equipment}
      >
        <AddEquipmentCustomerForm
          equipment={editEquipment}
          marcas={marcas}
          cliente={cliente}
          onCancel={() => setModalEquipment(false)}
          onSaved={(nuevaLista) => {
            setModalEquipment(false);
            updateEquipos(nuevaLista);
          }}
        />
      </Modal>
    </>
  );
}