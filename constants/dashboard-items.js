import IconCustomer                from '@/components/icon/icon-customer';
import IconQuotes                  from '@/components/icon/icon-quotes';
import IconAutorizeOrder           from '@/components/icon/icon-autorize-order';
import IconOrderInProcess          from '@/components/icon/icon-orders-in-process';
import IconSuppliers               from '@/components/icon/icon-suppliers';
import IconSparePartsToBeQuoted    from '@/components/icon/icon-spare-parts-to-be-quoted';
import IconSparePartsToBeIdentified from '@/components/icon/icon-spare-parts-to-be-identified';
import IconNewSpareParts           from '@/components/icon/icon-new-spare-parts';
import IconGeneratePurchaseOrder   from '@/components/icon/icon-generate-purchase-order';
import IconSearchPurchaseOrder     from '@/components/icon/icon-search-purchase-order';
import IconSearchCircle            from '@/components/icon/icon-search-circle';
import IconChangeQuote             from '@/components/icon/icon-change-quote';
import IconCrossReference          from '@/components/icon/icon-cross-reference';
import IconCRM                     from '@/components/icon/icon-crm';
import IconMessages                from '@/components/icon/icon-messages';
import IconReception               from '@/components/icon/icon-reception';
import IconPackaging               from '@/components/icon/icon-packaging';
import IconShipment                from '@/components/icon/icon-shipment';

import { PERMISSIONS } from './permissions';

/**
 * Configuración del Panel Principal.
 *
 * Cada grupo:
 *   key       — identificador único
 *   titleKey  — clave en useTranslation()
 *   items     — lista de ítems del grupo
 *
 * Cada ítem:
 *   key        — identificador único
 *   href       — ruta de destino
 *   Icon       — componente de ícono (sin instanciar)
 *   labelKey   — clave en useTranslation()
 *   permission — código de permiso requerido (null = siempre visible)
 *   type       — 'btn-new-quote' para el ítem especial de nueva cotización
 */
export const DASHBOARD_GROUPS = [

  // ── CLIENTES ──────────────────────────────────────────────────────
  {
    key: 'clientes',
    titleKey: 'customers',
    items: [
      {
        key:        'clientes-lista',
        href:       '/admin/register/customers',
        Icon:       IconCustomer,
        labelKey:   'customers',
        permission: PERMISSIONS.MENU_CLIENTES,
      },
      {
        key:        'nueva-cotizacion',
        type:       'btn-new-quote',
        permission: PERMISSIONS.CREAR_COTIZACION,
      },
      {
        key:        'cotizaciones',
        href:       '/admin/queries/orders-placed',
        Icon:       IconQuotes,
        labelKey:   'quotes',
        permission: PERMISSIONS.MENU_ORDENES_REALIZADAS,
      },
      {
        key:        'autorizar-pedido',
        href:       '/admin/revision/authorize-purchase',
        Icon:       IconAutorizeOrder,
        labelKey:   'authorize_order',
        permission: PERMISSIONS.MENU_AUTORIZAR_COMPRA,
      },
      {
        key:        'ordenes-proceso',
        href:       '/admin/revision/orders-process',
        Icon:       IconOrderInProcess,
        labelKey:   'orders_in_process',
        permission: PERMISSIONS.MENU_ORDENES_EN_PROCESO,
      },
    ],
  },

  // ── PROVEEDORES ───────────────────────────────────────────────────
  {
    key: 'proveedores',
    titleKey: 'suppliers',
    items: [
      {
        key:        'proveedores-lista',
        href:       '/admin/register/suppliers',
        Icon:       IconSuppliers,
        labelKey:   'suppliers',
        permission: PERMISSIONS.MENU_PROVEEDORES,
      },
      {
        key:        'repuestos-cotizar',
        href:       '/admin/queries/spare-parts-quotation',
        Icon:       IconSparePartsToBeQuoted,
        labelKey:   'spare_parts_to_be_quoted',
        permission: PERMISSIONS.MENU_REPUESTOS_POR_COTIZAR,
      },
      {
        key:        'repuestos-identificar',
        href:       '/admin/queries/spare-parts-identified',
        Icon:       IconSparePartsToBeIdentified,
        labelKey:   'spare_parts_to_be_identified',
        permission: PERMISSIONS.MENU_REPUESTOS_POR_IDENTIFICAR,
      },
      {
        key:        'nuevo-repuesto',
        href:       '/admin/register/spares?action=new',
        Icon:       IconNewSpareParts,
        labelKey:   'new_spare_parts',
        permission: PERMISSIONS.MENU_REPUESTOS,
      },
      {
        key:        'generar-oc',
        href:       '/admin/purchase-order',
        Icon:       IconGeneratePurchaseOrder,
        labelKey:   'generate_purchase_order',
        permission: PERMISSIONS.MENU_ORDEN_DE_COMPRA,
      },
      {
        key:        'buscar-oc',
        href:       '/admin/queries/purchase-orders',
        Icon:       IconSearchPurchaseOrder,
        labelKey:   'search_purchase_order',
        permission: PERMISSIONS.MENU_ORDENES_DE_COMPRA,
      },
    ],
  },

  // ── VARIOS ────────────────────────────────────────────────────────
  {
    key: 'varios',
    titleKey: 'several',
    items: [
      {
        key:        'buscar',
        href:       '/admin/search',
        Icon:       IconSearchCircle,
        labelKey:   'search',
        permission: null,
      },
      {
        key:        'cambiar-cotizacion',
        href:       '/admin/queries/change-quote',
        Icon:       IconChangeQuote,
        labelKey:   'change_quote',
        permission: PERMISSIONS.MENU_CAMBIAR_COTIZACION,
      },
      {
        key:        'referencia-cruzada',
        href:       '/admin/register/reference-change-part',
        Icon:       IconCrossReference,
        labelKey:   'cross_reference',
        permission: PERMISSIONS.MENU_REFERENCIA_CAMBIO_PARTE,
      },
      {
        key:        'crm',
        href:       '/admin/revision/crm-dashboard',
        Icon:       IconCRM,
        labelKey:   'crm',
        permission: PERMISSIONS.MENU_PANEL_CRM,
      },
      {
        key:        'mensaje',
        href:       '/admin/inbox',
        Icon:       IconMessages,
        labelKey:   'message',
        permission: PERMISSIONS.MENU_INBOX,
      },
      // 'configuraciones' (/admin/settings) deshabilitado por ahora.
    ],
  },

  // ── DEPÓSITO ──────────────────────────────────────────────────────
  {
    key:     'deposito',
    titleKey: 'deposit',
    compact:  true,           // se renderiza al lado de "varios"
    items: [
      {
        key:        'recepcion',
        href:       '/admin/purchase-reception',
        Icon:       IconReception,
        labelKey:   'reception',
        permission: PERMISSIONS.MENU_RECEPCION_DE_COMPRA,
      },
      {
        key:        'embalaje',
        href:       '/admin/packaging',
        Icon:       IconPackaging,
        labelKey:   'packaging',
        permission: PERMISSIONS.MENU_EMBALAJE,
      },
      {
        key:        'envio',
        href:       '/admin/dispatch',
        Icon:       IconShipment,
        labelKey:   'shipment',
        permission: PERMISSIONS.MENU_DESPACHO,
      },
    ],
  },

];
