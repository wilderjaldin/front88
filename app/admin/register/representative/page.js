'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RepresentativeIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/register/representative/general');
  }, []);
  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
