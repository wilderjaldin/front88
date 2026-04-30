'use client';
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import Modal from '@/components/modal';
import ContactForm from './ContactSupplierForm';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPlus from '@/components/icon/icon-plus';
import IconStar from '@/components/icon/icon-star';

const URL_LIST        = (codPrv)       => `/proveedores/${codPrv}/contactos`;
const URL_DETAIL      = (codPrv, id)   => `/proveedores/${codPrv}/contactos/${id}`;
const URL_DEFAULT     = (codPrv)       => `/proveedores/${codPrv}/contactos/predeterminado`;
const URL_DELETE      = (codPrv)       => `/proveedores/${codPrv}/contactos/eliminar`;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const capitalize = str => str?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) ?? '';

export default function Contacts() {
  const { proveedor, contacts, setContacts, loadContacts, setLoadContacts } = useSupplier();
  const t = useTranslation();

  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [loadingEdit,  setLoadingEdit]  = useState(false);

  useEffect(() => {
    if (!loadContacts) return;
    axiosClient.get(URL_LIST(proveedor.codPrv))
      .then(res => setContacts(res.data ?? []))
      .catch(() => setContacts([]))
      .finally(() => setLoadContacts(false));
  }, []);

  if (loadContacts) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleNew = () => {
    setEditItem(null);
    setShowModal(true);
  };

  // Llama al detalle antes de abrir el modal
  const handleEdit = async (c) => {
    setShowModal(true);
    setEditItem(null);
    setLoadingEdit(true);
    try {
      const res = await axiosClient.get(URL_DETAIL(proveedor.codPrv, c.codRegistro));
      setEditItem(res.data);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al cargar el contacto' });
      setShowModal(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDefault = async (c) => {
    try {
      const res = await axiosClient.post(URL_DEFAULT(proveedor.codPrv), { codRegistro: c.codRegistro });
      setContacts(res.data ?? []);
      Toast.fire({ icon: 'success', title: 'Contacto predeterminado actualizado' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al actualizar predeterminado' });
    }
  };

  const handleDelete = (c) => {
    Swal.fire({
      title: t.question_delete_contact,
      text: capitalize(c.nomContacto),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.delete(URL_DELETE(proveedor.codPrv), {
          data: { codRegistro: c.codRegistro },
        });
        setContacts(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.contact_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.contact_error_deleted });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.contacts}</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-white text-xs font-medium shadow-sm hover:bg-primary/90 transition"
        >
          <IconPlus className="h-3.5 w-3.5" />
          {t.btn_add_contact}
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
          {t.contacts_empty}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-md dark:shadow-gray-900/40">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{t.name}</th>
                <th className="px-4 py-3 text-left">{t.position}</th>
                <th className="px-4 py-3 text-left">{t.phones}</th>
                <th className="px-4 py-3 text-left">{t.mails}</th>
                <th className="px-4 py-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {contacts.map((c) => (
                <tr key={c.codRegistro} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-1.5">
                      {capitalize(c.nomContacto)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.nomCargo || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.telefonos || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.correos || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDefault(c)}
                        title={t.set_default}
                        className={`p-1.5 rounded-lg transition ${c.blnFijar ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                      >
                        <IconStar className={`h-4 w-4 ${c.blnFijar ? 'fill-yellow-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition"
                      >
                        <IconPencil className="h-4 w-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition"
                      >
                        <IconTrashLines className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        size="w-full max-w-lg"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={editItem ? 'Editar Contacto' : 'Nuevo Contacto'}
      >
        {loadingEdit ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <ContactForm
            contacto={editItem}
            proveedor={proveedor}
            onCancel={() => setShowModal(false)}
            onSaved={(lista) => { setShowModal(false); setContacts(lista); }}
          />
        )}
      </Modal>
    </div>
  );
}