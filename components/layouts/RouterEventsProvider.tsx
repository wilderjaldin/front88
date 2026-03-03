'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '@/components/layouts/loading';

export default function RouterEventsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    
  }, [pathname]);

  useEffect(() => {
    setLoading(false);
    
  }, [loading]);

  return (
    <>
      {loading && (
        <Loading></Loading>
      )}
      {children}
    </>
  );
}