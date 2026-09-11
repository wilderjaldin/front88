'use client';
import { useParams } from 'next/navigation';
import { useRepresentative } from '../../representatives/[id]/RepresentativeContext';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { useTranslation } from '@/app/locales';
import GeneralInformation   from '../../representatives/[id]/[tab]/tabs/GeneralInformation';
import ParametrosTransporte from '../../representatives/[id]/[tab]/tabs/ParametrosTransporte';
import DireccionesEntrega   from '../../representatives/[id]/[tab]/tabs/DireccionesEntrega';

export default function RepresentativeOwnTabPage() {
  const { tab } = useParams();
  const ctx     = useRepresentative();
  const t       = useTranslation();

  const TAB_TITLES = {
    general:    `${t.my_profile} | ${t.general_information}`,
    parameters: `${t.my_profile} | ${t.transport_parameters}`,
    address:    `${t.my_profile} | ${t.delivery_addresses}`,
  };
  useDynamicTitle(TAB_TITLES[tab] ?? t.my_profile);

  if (!ctx) return null;

  const { representante, isAdmin, isRepresentante } = ctx;

  switch (tab) {
    case 'general':
      return <GeneralInformation representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    case 'parameters':
      return <ParametrosTransporte representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    case 'address':
      return <DireccionesEntrega representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    default:
      return <GeneralInformation representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
  }
}
