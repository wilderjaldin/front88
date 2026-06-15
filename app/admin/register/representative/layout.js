'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { selectUser } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { RepresentativeContext } from '../representatives/[id]/RepresentativeContext';
import AccessDenied from '@/components/AccessDenied';

const BASE_PATH = '/admin/register/representative';

const TABS = [
  { key: 'general',    label: 'Información General'      },
  { key: 'parameters', label: 'Parámetros de Transporte' },
  { key: 'address',    label: 'Direcciones de Entrega'   },
];

export default function RepresentativeOwnLayout({ children }) {
  const { tab }  = useParams();
  const router   = useRouter();
  const { hasPermission } = usePermissions();
  const user              = useSelector(selectUser);
  const isAdmin           = hasPermission(PERMISSIONS.LISTAR_REPRESENTANTES);
  const isRepresentante   = user?.rol === 'Representante';

  const [representante, setRepresentante] = useState(null);
  const [loadingRep,    setLoadingRep]    = useState(true);

  useEffect(() => {
    if (!user?.countryCode) { setLoadingRep(false); return; }
    axiosClient.get(`/representantes/detalle-por-pais/${user.countryCode}`)
      .then(res => {
        const codEmp = res.data?.codEmp;
        if (!codEmp) { router.replace('/admin/register/company/me'); return null; }
        return axiosClient.get(`/representantes/detalle/${codEmp}`);
      })
      .then(res => { if (res) setRepresentante(res.data); })
      .catch(() => router.replace('/admin/register/company/me'))
      .finally(() => setLoadingRep(false));
  }, [user?.countryCode]);

  if (!isAdmin && !isRepresentante) {
    return <AccessDenied message="No tienes permiso para acceder a esta sección." />;
  }

  if (loadingRep) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!representante) return null;

  const currentTab = TABS.find(t => t.key === tab) ?? TABS[0];

  return (
    <RepresentativeContext.Provider value={{ representante, setRepresentante, isAdmin: false, isRepresentante: true, basePath: BASE_PATH }}>
      <div className="space-y-6">

        {/* Breadcrumb */}
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>Registrar</li>
          <li title={representante.pais ?? representante.codPais} className="before:content-['/'] before:mx-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              {representante.codPais && (
                <img
                  src={`/assets/flags/${representante.codPais.toLowerCase()}.svg`}
                  alt={representante.codPais}
                  className="h-3.5 w-3.5 rounded-sm object-cover shrink-0"
                />
              )}
              {representante.razSoc}
            </span>
          </li>
          <li className="before:content-['/'] before:mx-2 text-gray-400">
            {currentTab.label}
          </li>
        </ul>

        {/* Tab nav */}
        <div className="flex flex-wrap items-end border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const isActive = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`${BASE_PATH}/${t.key}`}
                  className={`no-load px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                    ${isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div>{children}</div>

      </div>
    </RepresentativeContext.Provider>
  );
}
