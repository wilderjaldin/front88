// menuConfig.ts
// Configuración centralizada del menú.
// - permission: si se define, el item solo se muestra si el usuario tiene ese permiso.
// - si NO se define permission, el item es visible para todos.
// - Un dropdown padre se oculta automáticamente si todos sus hijos quedan ocultos.

import { PERMISSIONS } from '@/constants/permissions';

export type MenuItemChild = {
  labelKey: string;       // clave del objeto de traducción (t.xxx)
  href: string;
  permission?: string;    // undefined = visible para todos
};

export type MenuItem =
  | {
    type: 'dropdown';
    labelKey: string;
    icon: 'invoice' | 'chat';
    permission?: string;  // permiso del padre (opcional, adicional al filtro de hijos)
    children: MenuItemChild[];
  }
  | {
    type: 'link';
    labelKey: string;
    href: string;
    icon: 'invoice' | 'chat';
    permission?: string;
  };

export const MENU_CONFIG: MenuItem[] = [
  // ── ADMINISTRACION ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'admin',
    icon: 'invoice',
    children: [
      { labelKey: 'users', href: '/admin/users', permission: PERMISSIONS.J8EM1O6F },
      { labelKey: 'roles', href: '/admin/roles' },
      { labelKey: 'permissions', href: '/admin/permissions', permission: PERMISSIONS.J8EM1O6F },
    ],
  },
  // ── REGISTROS ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'register',
    icon: 'invoice',
    children: [
      { labelKey: 'spare_parts', href: '/admin/register/spares' },
      { labelKey: 'spare_parts_in_lot', href: '/admin/register/spares-in-lot' },
      { labelKey: 'reference_part_change', href: '/admin/register/reference-change-part' },
      { labelKey: 'reference_change_part_in_lot', href: '/admin/register/reference-change-part-lot' },
      { labelKey: 'customers', href: '/admin/register/customers' },
      { labelKey: 'suppliers', href: '/admin/register/suppliers' },
      { labelKey: 'freight_supplier', href: '/admin/register/supplier-freight' },
      { labelKey: 'company', href: '/admin/register/company' },
      { labelKey: 'utility', href: '/admin/register/utility' },
      { labelKey: 'availability', href: '/admin/register/availability' },
      { labelKey: 'exchange_rate', href: '/admin/register/exchange-rate' },
    ],
  },

  // ── REVISIÓN ─────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'revision',
    icon: 'invoice',
    children: [
      { labelKey: 'orders_in_process', href: '/admin/revision/orders-process' },
      { labelKey: 'authorize_purchase', href: '/admin/revision/authorize-purchase' },
      { labelKey: 'panel_crm', href: '/admin/revision/crm-dashboard' },
    ],
  },

  // ── LINKS DIRECTOS ───────────────────────────────────────────────────────
  {
    type: 'link',
    labelKey: 'purchase_order',
    href: '/admin/purchase-order',
    icon: 'chat',
  },
  {
    type: 'link',
    labelKey: 'purchase_reception',
    href: '/admin/purchase-reception',
    icon: 'chat',
  },
  {
    type: 'link',
    labelKey: 'packaging',
    href: '/admin/packaging',
    icon: 'chat',
  },
  {
    type: 'link',
    labelKey: 'delivery',
    href: '/admin/delivery',
    icon: 'chat',
  },

  // ── CONSULTAS ────────────────────────────────────────────────────────────
  {
    type: 'dropdown',
    labelKey: 'query',
    icon: 'invoice',
    children: [
      { labelKey: 'spare_parts_to_be_quoted', href: '/admin/queries/spare-parts-quotation' },
      { labelKey: 'spare_parts_to_be_identified', href: '/admin/queries/spare-parts-identified' },
      { labelKey: 'quotes_orders_done', href: '/admin/queries/orders-placed' },
      { labelKey: 'purchase_orders', href: '/admin/queries/purchase-orders' },
      { labelKey: 'delivery_report', href: '/admin/queries/delivery-report' },
      { labelKey: 'change_quote', href: '/admin/queries/change-quote' },
    ],
  },

  // ── INBOX ────────────────────────────────────────────────────────────────
  {
    type: 'link',
    labelKey: 'inbox',
    href: '/admin/inbox',
    icon: 'chat',
  },
];