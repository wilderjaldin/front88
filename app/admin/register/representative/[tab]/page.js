'use client';
import { useParams } from 'next/navigation';
import { useRepresentative } from '../../representatives/[id]/RepresentativeContext';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import GeneralInformation   from '../../representatives/[id]/[tab]/tabs/GeneralInformation';
import ParametrosTransporte from '../../representatives/[id]/[tab]/tabs/ParametrosTransporte';
import DireccionesEntrega   from '../../representatives/[id]/[tab]/tabs/DireccionesEntrega';

const TAB_TITLES = {
  general:    'Mi Perfil | Información General',
  parameters: 'Mi Perfil | Parámetros de Transporte',
  address:    'Mi Perfil | Direcciones de Entrega',
};

export default function RepresentativeOwnTabPage() {
  const { tab } = useParams();
  const ctx     = useRepresentative();
  useDynamicTitle(TAB_TITLES[tab] ?? 'Mi Perfil');

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
