// app/admin/register/customers/[id]/[tab]/tabs/TradingConditions.js
'use client';
import { useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';

// 🚧 En construcción

export default function TradingConditions({
  cliente,
  conditions, setConditions,
  loadConditions, setLoadConditions,
}) {
  useEffect(() => {
    if (!loadConditions) return;

    axiosClient.get(`/clientes/${cliente.codCliente}/condiciones`)
      .then(res => setConditions(res.data ?? {}))
      .catch(() => setConditions({}))
      .finally(() => setLoadConditions(false));
  }, []);

  if (loadConditions) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 p-16 flex flex-col items-center justify-center gap-3">
      <p className="text-sm font-medium text-gray-500">Condiciones Comerciales — En construcción</p>
    </div>
  );
}