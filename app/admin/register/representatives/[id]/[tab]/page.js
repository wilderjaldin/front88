'use client';
import { useParams } from 'next/navigation';
import { useRepresentative } from '../RepresentativeContext';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import GeneralInformation   from './tabs/GeneralInformation';
import ParametrosTransporte from './tabs/ParametrosTransporte';
import DireccionesEntrega   from './tabs/DireccionesEntrega';
import MargenCosto          from './tabs/MargenCosto';

const TAB_TITLES = {
  general:    'Representantes | Información General',
  parameters: 'Representantes | Parámetros de Transporte',
  address:    'Representantes | Direcciones de Entrega',
  margen:     'Representantes | Margen de Costo',
};

export default function RepresentativeTabPage() {
  const { tab } = useParams();
  const ctx     = useRepresentative();
  useDynamicTitle(TAB_TITLES[tab] ?? 'Representantes');

  if (!ctx) return null;

  const { representante, isAdmin, isRepresentante } = ctx;

  switch (tab) {
    case 'general':
      return <GeneralInformation representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    case 'parameters':
      return <ParametrosTransporte representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    case 'address':
      return <DireccionesEntrega representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
    case 'margen':
      return isAdmin ? <MargenCosto representante={representante} /> : null;
    default:
      return <GeneralInformation representante={representante} isAdmin={isAdmin} isRepresentante={isRepresentante} />;
  }
}
