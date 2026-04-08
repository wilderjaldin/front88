// app/admin/register/customers/[id]/[tab]/tabs/Attachments.js
'use client';
import { useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';

// 🚧 En construcción

export default function Attachments({
  cliente,
  attachments, setAttachments,
  loadAttachments, setLoadAttachments,
}) {
  useEffect(() => {
    if (!loadAttachments) return;

    axiosClient.get(`/clientes/${cliente.codCliente}/anexos`)
      .then(res => setAttachments(res.data ?? {}))
      .catch(() => setAttachments({}))
      .finally(() => setLoadAttachments(false));
  }, []);

  if (loadAttachments) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-900 p-16 flex flex-col items-center justify-center gap-3">
      <p className="text-sm font-medium text-gray-500">Anexos — En construcción</p>
    </div>
  );
}