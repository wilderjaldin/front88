'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import axiosClient from '@/app/lib/axiosClient';
import AccessDenied from '@/components/AccessDenied';

const ROL_REPRESENTANTE = 'Representante';

export default function CompanyPage() {
  const { hasPermission } = usePermissions();
  const user   = useSelector(selectUser);
  const router = useRouter();

  const isAdmin = hasPermission(PERMISSIONS.LISTAR_REPRESENTANTES);
  const isRep   = user?.rol === ROL_REPRESENTANTE;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin/register/representatives');
      return;
    }
    if (isRep && user?.countryCode) {
      axiosClient.get(`/representantes/detalle-por-pais/${user.countryCode}`)
        .then(res => {
          const codEmp = res.data?.codEmp;
          if (codEmp) {
            router.replace('/admin/register/representative/general');
          } else {
            router.replace('/admin/register/company/me');
          }
        })
        .catch(() => router.replace('/admin/register/company/me'))
        .finally(() => setReady(true));
      return;
    }
    setReady(true);
  }, [isAdmin, isRep, user?.countryCode]);

  if (!isAdmin && !isRep) {
    return <AccessDenied />;
  }

  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
