// app/admin/register/customers/[id]/[tab]/tabs/ContactsCustomer.js
'use client';
import { useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';

// 🚧 En construcción
// Patrón de carga:
//   - loadContacts=true  → primera vez → carga API → setLoadContacts(false)
//   - loadContacts=false → ya cargado  → usa datos del padre sin nueva consulta

export default function ContactsCustomer({
  cliente,
  contacts, setContacts,
  loadContacts, setLoadContacts,
}) {
  useEffect(() => {
    if (!loadContacts) return; // ya cargado, no repetir

    axiosClient.get(`/clientes/${cliente.codCliente}/contactos`)
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

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 p-16 flex flex-col items-center justify-center gap-3">
      <p className="text-sm font-medium text-gray-500">Contactos — En construcción</p>
      <p className="text-xs text-gray-400">{contacts.length} registros cargados</p>
    </div>
  );
}