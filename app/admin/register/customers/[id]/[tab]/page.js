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
import MeetingCustomer from './tabs/MeetingCustomer';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { usePermissions } from '@/app/hooks/usePermissions';

export default function CustomerTabPage() {
  const { tab }  = useParams();
  const ctx      = useCustomer();

  const t                  = useTranslation();
  const { hasPermission }  = usePermissions();

  const TAB_TITLES = {
    general:     'Clientes | Información General',
    contacts:    'Clientes | Contactos',
    shipping:    'Clientes | Direcciones de Entrega',
    conditions:  'Clientes | Condiciones Comerciales',
    attachments: 'Clientes | Anexos',
    accounts:    'Clientes | Usuarios',
    meetings:    'Clientes | Reuniones',
  };
  useDynamicTitle(TAB_TITLES[tab] ?? 'Clientes');

  if (!ctx) return null;

  const { cliente, onEdit,
    general, setGeneral, loadGeneral, setLoadGeneral,
    contacts, setContacts, loadContacts, setLoadContacts,
    shipping, setShipping, loadShipping, setLoadShipping,
    conditions, setConditions, loadConditions, setLoadConditions,
    attachments, setAttachments, loadAttachments, setLoadAttachments,
    accounts, setAccounts, loadAccounts, setLoadAccounts,
    meetings, setMeetings, loadMeetings, setLoadMeetings,
  } = ctx;

  switch (tab) {
    case 'general':
      return <GeneralInformation t={t} cliente={cliente} onEdit={onEdit}
        general={general} setGeneral={setGeneral}
        loadGeneral={loadGeneral} setLoadGeneral={setLoadGeneral}
      />;
    case 'contacts':
      return <ContactsCustomer
        t={t} hasPermission={hasPermission} cliente={cliente}
        contacts={contacts}         setContacts={setContacts}
        loadContacts={loadContacts} setLoadContacts={setLoadContacts}
      />;
    case 'shipping':
      return <ShippingAddress
        t={t} hasPermission={hasPermission} cliente={cliente}
        shipping={shipping}         setShipping={setShipping}
        loadShipping={loadShipping} setLoadShipping={setLoadShipping}
      />;
    case 'conditions':
      return <TradingConditions
        t={t} hasPermission={hasPermission} cliente={cliente}
        conditions={conditions}           setConditions={setConditions}
        loadConditions={loadConditions}   setLoadConditions={setLoadConditions}
      />;
    case 'attachments':
      return <Attachments
        t={t} hasPermission={hasPermission} cliente={cliente}
        attachments={attachments}           setAttachments={setAttachments}
        loadAttachments={loadAttachments}   setLoadAttachments={setLoadAttachments}
      />;
    case 'accounts':
      return <UserAccounts
        t={t} hasPermission={hasPermission} cliente={cliente}
        accounts={accounts}         setAccounts={setAccounts}
        loadAccounts={loadAccounts} setLoadAccounts={setLoadAccounts}
      />;
    case 'meetings':
      return <MeetingCustomer
        t={t} hasPermission={hasPermission} cliente={cliente}
        meetings={meetings}         setMeetings={setMeetings}
        loadMeetings={loadMeetings} setLoadMeetings={setLoadMeetings}
      />;
    default:
      return <GeneralInformation t={t} cliente={cliente} onEdit={onEdit}
        general={general} setGeneral={setGeneral}
        loadGeneral={loadGeneral} setLoadGeneral={setLoadGeneral}
      />;
  }
}