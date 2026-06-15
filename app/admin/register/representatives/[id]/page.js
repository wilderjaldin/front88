'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RepresentativePage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/register/representatives/${id}/general`);
  }, [id]);

  return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
