'use client';

import React from 'react';
import { customFormat } from '@/app/lib/format';

const VerifyQuote = ({ summary, t }) => {
  const loading = !summary;

  const total = summary?.total != null
    ? `${summary.moneda ?? 'USD'} ${customFormat(summary.total)}`
    : '-';

  const rows = [
    { label: t.order_number,  value: summary?.nroCotizacion },
    { label: t.pedido_number, value: summary?.pedido || '-' },
    { label: t.items_number,  value: summary?.items },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-5">{t.verify}</h2>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-50">
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-7 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-semibold text-gray-800">{r.value ?? '-'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-gray-500">{t.total_order}</span>
              <span className="text-2xl font-bold text-green-600">{total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyQuote;
