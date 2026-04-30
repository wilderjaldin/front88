'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import DatatablesSparesSite from './list';

const URL_LIST = 'repuestossite/listar';

export default function SparesSitePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();

  const [spares,  setSpares]  = useState([]);
  const [pageSize]            = useState(20);
  const [total,   setTotal]   = useState(0);

  useDynamicTitle('Registrar | Repuestos Site');

  // ── Parámetros de URL — fuente de verdad ─────────────────────────────────
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentTerm = searchParams.get('term')         || '';

  // ── Fetch — se dispara cuando cambia la URL ───────────────────────────────
  useEffect(() => {
    fetchSpares();
  }, [searchParams]);

  const fetchSpares = async () => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const rs = await axiosClient.get(URL_LIST, {
        params: { page: currentPage, pageSize, term: currentTerm },
      });
      setTotal(rs.data?.total ?? 0);
      setSpares((rs.data?.data ?? []).map((o, i) => ({ ...o, id: i })));
    } catch {
      setSpares([]);
      setTotal(0);
    } finally {
      Swal.close();
    }
  };

  // ── Navegación ────────────────────────────────────────────────────────────
  const handleSearch = (formData) => {
    const params = new URLSearchParams();
    if (formData.term?.trim()) params.set('term', formData.term.trim());
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    newPage > 1 ? params.set('page', newPage) : params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const handleClear = () => router.push('?');
  const handleNew   = () => router.push('/admin/register/spares-site/form');
  const handleEdit  = (spare) =>
    router.push(`/admin/register/spares-site/form?nroParte=${encodeURIComponent(spare.nroParte2)}`);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Repuestos Site
        </li>
      </ul>

      <DatatablesSparesSite
        data={spares}
        t={t}
        page={currentPage}
        pageSize={pageSize}
        total={total}
        currentFilters={{ term: currentTerm }}
        onPageChange={handlePageChange}
        handleSearch={handleSearch}
        handleClear={handleClear}
        handleNew={handleNew}
        handleEdit={handleEdit}
      />
    </div>
  );
}