// app/admin/register/suppliers/[id]/[tab]/page.js
'use client';
import { useParams } from 'next/navigation';
import General     from './tabs/General';
import Contacts    from './tabs/Contacts';
import Conditions  from './tabs/Conditions';
import Formula          from './tabs/Formula';
import Annexes     from './tabs/Annexes';
import Freight     from './tabs/Freight';

const TAB_MAP = {
  general:    General,
  contacts:   Contacts,
  conditions: Conditions,
  formula:    Formula,
  annexes:    Annexes,
  freight:    Freight,
};

export default function SupplierTabPage() {
  const { tab } = useParams();
  const Component = TAB_MAP[tab] ?? General;
  return <Component />;
}