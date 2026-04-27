// app/admin/register/customers/[id]/[tab]/page.js
'use client';
import { useParams } from 'next/navigation';
import { useCustomer } from '../CustomerContext';
import GeneralInformation from './tabs/GeneralInformation';
import ContactsCustomer from './tabs/ContactsCustomer';
import ShippingAddress from './tabs/ShippingAddress';
import TradingConditions from './tabs/TradingConditions';
import Attachments from './tabs/Attachments';
import UserAccounts from './tabs/UserAccounts';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

export default function CustomerTabPage() {
  const { tab }  = useParams();
  const ctx      = useCustomer();

  const t            = useTranslation();

  const TAB_TITLES = {
    general:     'Clientes | Información General',
    contacts:    'Clientes | Contactos',
    shipping:    'Clientes | Direcciones de Entrega',
    conditions:  'Clientes | Condiciones Comerciales',
    attachments: 'Clientes | Anexos',
    accounts:    'Clientes | Usuarios',
  };
  useDynamicTitle(TAB_TITLES[tab] ?? 'Clientes');

  if (!ctx) return null;

  const { cliente, onEdit,
    contacts, setContacts, loadContacts, setLoadContacts,
    shipping, setShipping, loadShipping, setLoadShipping,
    conditions, setConditions, loadConditions, setLoadConditions,
    attachments, setAttachments, loadAttachments, setLoadAttachments,
    accounts, setAccounts, loadAccounts, setLoadAccounts,
  } = ctx;

  switch (tab) {
    case 'general':
      return <GeneralInformation t={t} cliente={cliente} onEdit={onEdit} />;
    case 'contacts':
      return <ContactsCustomer
        t={t} cliente={cliente}
        contacts={contacts}         setContacts={setContacts}
        loadContacts={loadContacts} setLoadContacts={setLoadContacts}
      />;
    case 'shipping':
      return <ShippingAddress
        t={t} cliente={cliente}
        shipping={shipping}         setShipping={setShipping}
        loadShipping={loadShipping} setLoadShipping={setLoadShipping}
      />;
    case 'conditions':
      return <TradingConditions
        t={t} cliente={cliente}
        conditions={conditions}           setConditions={setConditions}
        loadConditions={loadConditions}   setLoadConditions={setLoadConditions}
      />;
    case 'attachments':
      return <Attachments
        t={t} cliente={cliente}
        attachments={attachments}           setAttachments={setAttachments}
        loadAttachments={loadAttachments}   setLoadAttachments={setLoadAttachments}
      />;
    case 'accounts':
      return <UserAccounts
        t={t} cliente={cliente}
        accounts={accounts}         setAccounts={setAccounts}
        loadAccounts={loadAccounts} setLoadAccounts={setLoadAccounts}
      />;
    default:
      return <GeneralInformation t={t} cliente={cliente} onEdit={onEdit} />;
  }
}