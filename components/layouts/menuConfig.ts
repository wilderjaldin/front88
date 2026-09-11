// menuConfig.ts
// Configuración centralizada del menú.
// - permission: si se define, el item solo se muestra si el usuario tiene ese permiso.
// - si NO se define permission, el item es visible para todos.
// - permissionCountry: si se define junto con permission, el permiso solo se exige a
//   usuarios de ese país (user.countryCode). Para el resto de países el item se muestra
//   igual, sin importar si tienen el permiso o no.
// - Un dropdown padre se oculta automáticamente si todos sus hijos quedan ocultos.

import { PERMISSIONS } from '@/constants/permissions';

export type MenuItemChild = {
  labelKey: string;       // clave del objeto de traducción (t.xxx)
  href: string;
  permission?: string;    // undefined = visible para todos
  permissionCountry?: string; // acota `permission` a usuarios de este país (countryCode)
  rol?: string;           // si se define, solo visible para ese rol exacto
};

export type MenuIcon =
  | 'invoice' | 'chat' | 'users' | 'forms' | 'charts' | 'apps'
  | 'todo' | 'widgets' | 'documentation' | 'scrumboard' | 'datatables' | 'mailbox';

export type MenuItem =
  | {
    type: 'dropdown';
    labelKey: string;
    icon: MenuIcon;
    permission?: string;  // permiso del padre (opcional, adicional al filtro de hijos)
    permissionCountry?: string;
    children: MenuItemChild[];
  }
  | {
    type: 'link';
    labelKey: string;
    href: string;
    icon: MenuIcon;
    permission?: string;
    permissionCountry?: string;
  };

export const MENU_CONFIG: MenuItem[] = [
  // ── ADMINISTRACION ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'admin',
    icon: 'users',
    children: [
      { labelKey: 'users', href: '/admin/users', permission: PERMISSIONS.VER_USUARIOS },
      { labelKey: 'roles', href: '/admin/roles', permission: PERMISSIONS.VER_ROLES },
      { labelKey: 'permissions', href: '/admin/permissions', permission: PERMISSIONS.VER_PERMISOS },
    ],
  },
  // ── REGISTROS ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'register',
    icon: 'forms',
    children: [
      { labelKey: 'spare_parts', href: '/admin/register/spares', permission: PERMISSIONS.MENU_REPUESTOS },
      { labelKey: 'spare_parts_site', href: '/admin/register/spares-site', permission: PERMISSIONS.MENU_REPUESTOS_SITE },
      { labelKey: 'spare_parts_in_lot', href: '/admin/register/spares-in-lot', permission: PERMISSIONS.MENU_REPUESTOS_LOTE },
      { labelKey: 'spare_parts_in_lot_supplier', href: '/admin/register/spares-suppliers', permission: PERMISSIONS.MENU_REPUESTOS_LOTE_PROVEEDOR },
      { labelKey: 'reference_part_change', href: '/admin/register/reference-change-part', permission: PERMISSIONS.MENU_REFERENCIA_CAMBIO_PARTE },
      { labelKey: 'reference_change_part_in_lot', href: '/admin/register/reference-change-part-lot', permission: PERMISSIONS.MENU_REFERENCIA_CAMBIO_LOTE },
      { labelKey: 'customers', href: '/admin/register/customers', permission: PERMISSIONS.MENU_CLIENTES },
      { labelKey: 'suppliers', href: '/admin/register/suppliers', permission: PERMISSIONS.MENU_PROVEEDORES },
      { labelKey: 'freight_supplier', href: '/admin/register/supplier-freight', permission: PERMISSIONS.MENU_FLETE_PROVEEDOR },
      { labelKey: 'representatives', href: '/admin/register/representatives', permission: PERMISSIONS.MENU_REPRESENTANTES },
      { labelKey: 'representative',  href: '/admin/register/representative',  rol: 'Representante' },
      { labelKey: 'utility', href: '/admin/register/utility', permission: PERMISSIONS.MENU_UTILIDAD },
      { labelKey: 'categorization', href: '/admin/register/categorization', permission: PERMISSIONS.MENU_CATEGORIZACION },
      { labelKey: 'exchange_rate', href: '/admin/register/exchange-rate', permission: PERMISSIONS.MENU_TIPO_CAMBIO },
    ],
  },

  // ── REVISIÓN ─────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'revision',
    icon: 'charts',
    children: [
      { labelKey: 'orders_in_process', href: '/admin/revision/orders-process', permission: PERMISSIONS.MENU_ORDENES_EN_PROCESO },
      { labelKey: 'authorize_purchase', href: '/admin/revision/authorize-purchase', permission: PERMISSIONS.MENU_AUTORIZAR_COMPRA },
      { labelKey: 'panel_crm', href: '/admin/revision/crm-dashboard', permission: PERMISSIONS.MENU_PANEL_CRM },
    ],
  },

  // ── LINKS DIRECTOS ───────────────────────────────────────────────────────
  {
    type: 'link',
    labelKey: 'purchase_order',
    href: '/admin/purchase-order',
    permission: PERMISSIONS.MENU_ORDEN_DE_COMPRA,
    icon: 'chat',
  },
  {
    type: 'link',
    labelKey: 'warehouse_us',
    href: '/admin/warehouse_us',
    permission: PERMISSIONS.MENU_ALMACEN_USA,
    icon: 'apps',
  },
  {
    type: 'link',
    labelKey: 'purchase_reception',
    href: '/admin/purchase-reception',
    permission: PERMISSIONS.MENU_RECEPCION_DE_COMPRA,
    icon: 'todo',
  },
  {
    type: 'link',
    labelKey: 'packaging',
    href: '/admin/packaging',
    permission: PERMISSIONS.MENU_EMBALAJE,
    icon: 'widgets',
  },
  {
    type: 'link',
    labelKey: 'document_delivery',
    href: '/admin/document-delivery',
    permission: PERMISSIONS.MENU_ENTREGA_DOCUMENTOS,
    icon: 'documentation',
  },
  {
    type: 'link',
    labelKey: 'delivery',
    href: '/admin/dispatch',
    permission: PERMISSIONS.MENU_DESPACHO,
    icon: 'scrumboard',
  },

  // ── CONSULTAS ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'query',
    icon: 'datatables',
    children: [
      { labelKey: 'spare_parts_to_be_quoted', href: '/admin/queries/spare-parts-quotation', permission: PERMISSIONS.MENU_REPUESTOS_POR_COTIZAR },
      { labelKey: 'spare_parts_to_be_identified', href: '/admin/queries/spare-parts-identified', permission: PERMISSIONS.MENU_REPUESTOS_POR_IDENTIFICAR },
      { labelKey: 'quotes_orders_done', href: '/admin/queries/orders-placed', permission: PERMISSIONS.MENU_ORDENES_REALIZADAS },
      { labelKey: 'purchase_orders', href: '/admin/queries/purchase-orders', permission: PERMISSIONS.MENU_ORDENES_DE_COMPRA },
      { labelKey: 'delivery_report', href: '/admin/queries/delivery-report', permission: PERMISSIONS.MENU_REPORTE_DESPACHO },
      { labelKey: 'change_quote', href: '/admin/queries/change-quote', permission: PERMISSIONS.MENU_CAMBIAR_COTIZACION },
      { labelKey: 'change_assiged', href: '/admin/queries/change-assigned', permission: PERMISSIONS.MENU_CAMBIAR_ASIGNACION },
    ],
  },

  // ── INBOX ────────────────────────────────────────────────────────────────
  {
    type: 'link',
    labelKey: 'inbox',
    href: '/admin/inbox',
    permission: PERMISSIONS.MENU_INBOX,
    icon: 'mailbox',
  },
];