'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import AccessDenied from '@/components/AccessDenied';

const ROL_REPRESENTANTE = 'Representante';

export default function CompanyPage() {
  const { hasPermission } = usePermissions();
  const user   = useSelector(selectUser);
  const router = useRouter();

  const isAdmin = hasPermission(PERMISSIONS.WXLPVQFT);
  const isRep   = user?.rol === ROL_REPRESENTANTE;

  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin/register/company/representatives');
    } else if (isRep) {
      router.replace('/admin/register/company/me');
    }
    // else: neither — render AccessDenied below
  }, [isAdmin, isRep]);

  if (!isAdmin && !isRep) {
    return <AccessDenied />;
  }

  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
