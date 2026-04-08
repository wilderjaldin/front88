'use client';

import React, { useEffect } from 'react';
import axios from 'axios'
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ComprarCotizacion';

const VerifyQuote = ({ quote_detail, setQuoteDetail, load_detail, setLoadDetail, token, t, order_id }) => {




  useEffect(() => {
    if (load_detail) {

      getDetail();
    }
  }, []);

  const getDetail = async () => {
    if (!order_id) return;

    try {
      const rs = await axios.post(url, {
        NroOrden: order_id,
        ValToken: token
      });

      if (rs.data.estado === 'OK') {
        setQuoteDetail(rs.data.dato?.[0] ?? null);
      }
    } finally {
      setLoadDetail(false);
    }
  };

  const InfoRow = ({ label, value, highlight }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className={`
      font-semibold
      ${highlight
          ? 'text-2xl text-green-600'
          : 'text-lg text-gray-800 dark:text-white'}
    `}>
        {value ?? '-'}
      </span>
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-[#0e1726] rounded-2xl shadow-lg border border-gray-200 dark:border-[#1b2e4b] p-6">

        <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">
          {t.verify}
        </h2>

        <div className="space-y-4">

          <InfoRow
            label={t.order_number}
            value={quote_detail?.NroOrden}
          />

          <InfoRow
            label={t.pedido_number}
            value={quote_detail?.NroPedido}
          />

          <InfoRow
            label={t.items_number}
            value={quote_detail?.NroItems}
          />

          <div className="border-t pt-4 mt-4">
            <InfoRow
              label={t.total_order}
              value={quote_detail?.TotResumen}
              highlight
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyQuote;
