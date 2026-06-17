"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import axios from 'axios';
import axiosClient from '@/app/lib/axiosClient';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useRouter, useSearchParams } from "next/navigation";
import QuoteForm from '@/components/forms/quote-form';
import ConfirmedQuoteForm from '@/components/forms/confirmed-quote-form';
import QuoteBatchForm from '@/components/forms/quote-batch-form';
import StepsToBuy from '@/app/admin/revision/quotes/steps_buy';
import QuoteWithoutCodeForm from '@/components/forms/quote-whithout-code-form';
import QuoteManualForm from '@/components/forms/quote-manual-form';
import Link from "next/link";
import Swal from 'sweetalert2';
import { getLocale } from '@/store/localeSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import AccessDenied from '@/components/AccessDenied';

const url_order_confirmed = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/MostrarDetalleOrden';

const CATEGORY_OPTION = { NR: 'quotes', SC: 'quotes-without-code', MA: 'manual' };

export default function Quotes() {

  const searchParams = useSearchParams();
  const router = useRouter();
  const token               = useSelector(selectToken);
  const t                   = useTranslation();
  const locale              = useSelector(getLocale);
  const { hasPermission }   = usePermissions();

  const option      = searchParams.get("option");
  const customer_id = searchParams.get("customer");
  const order_id    = searchParams.get("id") || null;

  const [order,         setOrder]        = useState([]);
  const [items,         setItems]        = useState([]);
  const [tracking,      setTracking]     = useState([]);
  const [customer,      setCustomer]     = useState({ CodCliente: customer_id, NomCliente: '---' });

  useEffect(() => {
    getCustomer(customer_id);
  }, []);

  useEffect(() => {
    if (order_id > 0 && option !== 'buy') {
      Swal.fire({
        html: t.load_quote_info,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
      getOrder(order_id);
    }
  }, [order_id, option]);

  const getCustomer = async (id) => {
    try {
      const rs = await axiosClient.get(`clientes/ficha/${id}`);
      const c  = rs.data.cliente;
      if (c) {
        setCustomer({
          CodCliente: c.codCliente ?? c.CodCliente,
          NomCliente: c.nomCliente ?? c.NomCliente,
          CodPais:    c.codPais    ?? c.CodPais    ?? '',
          NomPais:    c.nomPais    ?? c.NomPais    ?? '',
        });
      }
    } catch {}
  };

  const getOrder = async (order_id) => {
    try {
      if (option === 'quotes' || option === 'quotes-without-code' || option === 'batch' || option === 'buy' || option === 'manual') {
        const rs = await axiosClient.get(`cotizaciondetalle/detalle/${order_id}`, { params: { codCliente: customer_id } });
        const { cotizacion, detalle, seguimiento } = rs.data;

        const expectedOption = CATEGORY_OPTION[cotizacion.categoria];
        if (expectedOption && expectedOption !== option) {
          Swal.close();
          router.replace(`/admin/revision/quotes?customer=${customer_id}&option=${expectedOption}&id=${order_id}`);
          return;
        }

        setOrder({
          NroOrden:       cotizacion.nroCotizacion,
          NroItems:       cotizacion.nroItems,
          NroPedido:      cotizacion.nroPedido      ?? '',
          MarcaEquipo:    cotizacion.marcaEquipo     ?? '',
          MarcaMotor:     cotizacion.marcaMotor      ?? '',
          ModeloEquipo:   cotizacion.modeloEquipo    ?? '',
          NroSerieEquipo: cotizacion.nroSerieEquipo  ?? '',
          AnioEquipo:     cotizacion.anioEquipo      ?? '',
          ModeloMotor:    cotizacion.modeloMotor     ?? '',
          NroSerieMotor:  cotizacion.nroSerieMotor   ?? '',
          FleteInterno:   cotizacion.mtoFlete        ?? 0,
          MostrarCodigo:  cotizacion.mostrarCodigo   ?? 0,
          TotalPeso:      cotizacion.totPeso         ?? 0,
          Total:          cotizacion.totalSus        ?? 0,
          TipoCambio:     cotizacion.tipCambio       ?? 0,
          TipMoneda:      cotizacion.tipMoneda       ?? '',
          NotaCliente:    cotizacion.notCliente      ?? '',
          NotaUsuario:    cotizacion.notUsuario      ?? '',
          TotRepuestos:   cotizacion.totRepuestos    ?? 0,
          Descuento:      cotizacion.mtoDescuento    ?? 0,
          MtoIva:         cotizacion.mtoIva          ?? 0,
        });

        setItems((detalle ?? []).map(d => ({
          CodItem:     d.codItem,
          CodRepuesto: d.codRepuesto,
          NroParte:    d.nroParte      ?? '',
          Cantidad:    d.cant          ?? 0,
          DesRepuesto: d.descripcion   ?? '',
          Marca:       d.marca         ?? '',
          Aplicacion:  d.aplicacion    ?? '',
          TipoRepuesto: d.tipoRepuesto ?? '',
          DiasVigencia: d.diasVigencia ?? '',
          Precio:      d.preUniSus     ?? 0,
          Total:       d.totSus        ?? 0,
          Peso:        d.peso          ?? 0,
          TiEntrega:   d.desTieEntrega ?? '',
          Indicador:   d.indicador     ?? '',
          Estado:      d.estado        ?? '',
          ParPrecio:   d.parPrecio     ?? false,
        })));

        setTracking(seguimiento ?? {});
        Swal.close();
        return;
      }

      if (option === 'confirmed-quote') {
        const rs = await axios.post(url_order_confirmed, { Idioma: locale, NroOrden: order_id, CodCliente: customer_id, ValToken: token });
        if (rs?.data?.estado === 'OK') {
          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);
          Swal.close();
        }
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        Swal.fire({
          html: `<div style="padding:12px 0 6px">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
            </div>
            <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 8px;line-height:1.3">${t.quote_not_found ?? 'Cotización no encontrada'}</h2>
            <p style="color:#64748b;font-size:13px;margin:0">#${order_id}</p>
          </div>`,
          showConfirmButton: true,
          confirmButtonText: t.close ?? 'Cerrar',
          confirmButtonColor: '#ef4444',
          allowOutsideClick: false,
        }).then(() => {
          router.push(`/admin/revision/orders-process?customer=${customer_id}&option=quotes`);
        });
      }
    }
  };

  const optionLabel = {
    'quotes':              t.quotes,
    'quotes-without-code': t.quotes,
    'batch':               t.quotes,
    'manual':              t.quotes,
    'buy':                 t.quotes,
    'confirmed-quote':     t.quotes,
  }[option] ?? t.quotes;

  useDynamicTitle(`${t.quote} | ${customer?.NomCliente ?? ''}`);

  if (option === 'quotes-without-code' && !hasPermission(PERMISSIONS.CREAR_COTIZACION)) {
    return <AccessDenied />;
  }

  return (
    <>
      {/* ── BREADCRUMB + VOLVER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">

        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>{t.revision}</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/revision/orders-process" className="text-primary hover:underline">
              {t.orders_in_process}
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2">
            <Link
              href={`/admin/revision/orders-process?customer=${customer_id}&option=quotes`}
              className="text-primary hover:underline"
            >
              {optionLabel}
            </Link>
          </li>
          {customer.NomCliente !== '---' && (
            <li className="before:content-['/'] before:mx-2">
              <span
                title={customer.NomPais || undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5
                  text-xs font-semibold text-primary"
              >
                {customer.CodPais && (
                  <img
                    src={`/assets/flags/${customer.CodPais.toLowerCase()}.svg`}
                    alt={customer.NomPais}
                    className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                  />
                )}
                {customer.NomCliente}
              </span>
            </li>
          )}
        </ul>

        <Link
          href={`/admin/revision/orders-process?customer=${customer_id}&option=quotes`}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3
            text-sm text-gray-600 hover:bg-gray-50 transition
            dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <IconArrowBackward className="h-4 w-4" />
          {t.back}
        </Link>

      </div>

      {/* ── CONTENIDO ───────────────────────────────────────────────────── */}
      {option === 'quotes' && (
        <QuoteForm key={order_id} getOrder={getOrder} token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items} />
      )}
      {option === 'buy' && (
        <StepsToBuy token={token} _customer_={customer} t={t} _order_={order} _items_={items} />
      )}
      {option === 'quotes-without-code' && (
        <QuoteWithoutCodeForm _customer_={customer} _order_={order} _items_={items} t={t} />
      )}
      {option === 'batch' && (
        <QuoteBatchForm token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items} />
      )}
      {option === 'manual' && (
        <QuoteManualForm _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items} />
      )}
      {option === 'confirmed-quote' && order_id && (
        <ConfirmedQuoteForm token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items} />
      )}
    </>
  );
}
