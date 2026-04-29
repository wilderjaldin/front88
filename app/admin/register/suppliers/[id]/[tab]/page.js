// app/admin/register/suppliers/[id]/[tab]/page.js
'use client';
import { useParams } from 'next/navigation';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import General    from './tabs/General';
import Contacts   from './tabs/Contacts';
import Conditions from './tabs/Conditions';
import Formula    from './tabs/Formula';
import Annexes    from './tabs/Annexes';
import Freight    from './tabs/Freight';

const TAB_MAP = {
  general:    General,
  contacts:   Contacts,
  conditions: Conditions,
  formula:    Formula,
  annexes:    Annexes,
  freight:    Freight,
};

const TAB_TITLES = {
  general:    'Proveedores | Datos Generales',
  contacts:   'Proveedores | Contactos',
  conditions: 'Proveedores | Condiciones Comerciales',
  formula:    'Proveedores | Fórmula',
  annexes:    'Proveedores | Anexos',
  freight:    'Proveedores | Costo Flete',
};

export default function SupplierTabPage() {
  const { tab } = useParams();
  useDynamicTitle(TAB_TITLES[tab] ?? 'Proveedores');
  const Component = TAB_MAP[tab] ?? General;
  return <Component />;
}