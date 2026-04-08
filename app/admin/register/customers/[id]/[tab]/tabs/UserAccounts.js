// app/admin/register/customers/[id]/[tab]/tabs/UserAccounts.js
'use client';
import { useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';

// 🚧 En construcción

export default function UserAccounts({
  cliente,
  accounts, setAccounts,
  loadAccounts, setLoadAccounts,
}) {
  useEffect(() => {
    if (!loadAccounts) return;

    axiosClient.get(`/clientes/${cliente.codCliente}/cuentas`)
      .then(res => setAccounts(res.data ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadAccounts(false));
  }, []);

  if (loadAccounts) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 p-16 flex flex-col items-center justify-center gap-3">
      <p className="text-sm font-medium text-gray-500">Cuentas de Usuario — En construcción</p>
      <p className="text-xs text-gray-400">{accounts.length} registros cargados</p>
    </div>
  );
}