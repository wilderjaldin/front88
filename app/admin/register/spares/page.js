"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axiosClient from "@/app/lib/axiosClient";
import Swal from 'sweetalert2';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useTranslation } from "@/app/locales";
import DatatablesSpares from './components-datatables-spares';

const URL_LIST     = 'repuestos/listar';
const URL_STATUS   = 'repuestos/status';
const URL_CONTROLS = 'repuestos/controles';

export default function SparesPage() {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();

  const [spares,    setSpares]    = useState([]);
  const [pageSize]                = useState(20);
  const [total,     setTotal]     = useState(0);
  const [brands,    setBrands]    = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [typesSpare, setTypesSpare] = useState([]);

  useDynamicTitle('Registrar | Repuestos');

  // ── Parámetros actuales de la URL — la fuente de verdad ──────────────────
  const currentPage        = Number(searchParams.get('page'))  || 1;
  const currentTerm        = searchParams.get('term')          || '';
  const currentStatus      = searchParams.get('status')        || '';
  const currentSupplier    = searchParams.get('supplier')      || '';
  const currentBrand       = searchParams.get('brand')         || '';
  const currentApplication = searchParams.get('application')   || '';
  const currentType        = searchParams.get('type')          || '';

  // ── Catálogos: una sola vez, independiente de los filtros ─────────────────
  useEffect(() => {
    loadOptions();
  }, []);

  // ── Búsqueda: SOLO se dispara cuando cambia la URL ────────────────────────
  // No se llama directamente desde el form — el form actualiza la URL
  // y este efecto reacciona al cambio
  useEffect(() => {
    fetchSpares();
  }, [searchParams]);

  const loadOptions = async () => {
    try {
      const rs = await axiosClient.get(URL_CONTROLS);
      setBrands(rs.data.marcas        ?? []);
      setSuppliers(rs.data.proveedores ?? []);
      setTypesSpare(rs.data.tiposRepuesto ?? []);
    } catch (err) {
      console.error('Error loading options', err);
    }
  };

  const fetchSpares = async () => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const rs = await axiosClient.get(URL_LIST, {
        params: {
          page:          currentPage,
          pageSize,
          term:          currentTerm,
          codEstado:     currentStatus,
          codPrv:        currentSupplier,
          codMarca:      currentBrand,
          codAplicacion: currentApplication,
          tipRepuesto:   currentType,
        },
      });

      setTotal(rs.data.total ?? 0);
      setSpares(rs.data.data.map((o, i) => ({ ...o, id: i })));
    } catch (err) {
      console.error('Error fetching spares', err);
    } finally {
      Swal.close();
    }
  };

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = (filters, resetPage = true) => {
    const params = new URLSearchParams();

    const page = resetPage ? 1 : (filters.page || 1);
    if (page > 1)              params.set('page',        page);
    if (filters.term)          params.set('term',        filters.term.trim());
    if (filters.status)        params.set('status',      filters.status);
    if (filters.supplier)      params.set('supplier',    filters.supplier);
    if (filters.brand)         params.set('brand',       filters.brand);
    if (filters.application)   params.set('application', filters.application);
    if (filters.type)          params.set('type',        filters.type);

    router.push(`?${params.toString()}`);
  };

  // ── Handlers para el datatable ────────────────────────────────────────────

  // Recibe los valores del form.
  // supplier/brand/application ahora son objetos {value, label} — se extrae solo el id.
  const handleSearch = (formData) => {
    pushFilters({
      term:        formData.term              || '',
      status:      formData.status            || '',
      supplier:    formData.supplier?.value   || '',
      brand:       formData.brand?.value      || '',
      application: formData.application?.value || '',
      type:        formData.type              || '',
    });
  };

  // Cambio de página: conserva filtros actuales, solo cambia page
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set('page', newPage);
    } else {
      params.delete('page');
    }
    router.push(`?${params.toString()}`);
  };

  // Limpiar: URL limpia, solo status por defecto
  const handleClear = () => {
    router.push('?status=AC');
  };

  const handleNew = () => {
    router.push('/admin/register/spares/form');
  };

  const handleEdit = (spare) => {
    router.push(`/admin/register/spares/form?id=${spare.codRepuesto}`);
  };

  const handleView = (spare) => {
    router.push(`/admin/register/spares/${spare.codRepuesto}`);
  };

  const handleToggleStatus = (spare) => {
    const activating = spare.codEstado !== 'AC';

    Swal.fire({
      title:               activating ? '¿Reactivar repuesto?' : '¿Desactivar repuesto?',
      text:                spare.nroParte ?? spare.descripcion,
      icon:                'warning',
      showCancelButton:    true,
      confirmButtonColor:  activating ? '#16a34a' : '#dc2626',
      confirmButtonText:   activating ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText:    'Cancelar',
      reverseButtons:      true,
      showLoaderOnConfirm: true,
      allowOutsideClick:   () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          const rs = await axiosClient.post(URL_STATUS, {
            codRepuesto: spare.codRepuesto,
            codEstado:   activating ? 'AC' : 'IN',
          });
          return rs.data;
        } catch (err) {
          Swal.showValidationMessage(
            err?.response?.data?.message || 'Error al procesar la solicitud'
          );
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setSpares((prev) =>
          prev.map((s) =>
            s.codRepuesto === spare.codRepuesto
              ? { ...s, codEstado: activating ? 'AC' : 'IN' }
              : s
          )
        );
        Swal.fire({
          icon:              'success',
          title:             activating ? 'Repuesto activado' : 'Repuesto desactivado',
          timer:             2500,
          showConfirmButton: false,
        });
      }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Repuestos
        </li>
      </ul>

      <DatatablesSpares
        data={spares}
        t={t}
        page={currentPage}
        pageSize={pageSize}
        total={total}
        // Valores actuales de la URL → datatable los usa como defaultValues
        currentFilters={{
          term:        currentTerm,
          status:      currentStatus,
          supplier:    currentSupplier    ? Number(currentSupplier)    : null,
          brand:       currentBrand       ? Number(currentBrand)       : null,
          application: currentApplication ? Number(currentApplication) : null,
          type:        currentType        || null,
        }}
        onPageChange={handlePageChange}
        handleSearch={handleSearch}
        handleClear={handleClear}
        handleNew={handleNew}
        handleEdit={handleEdit}
        handleView={handleView}
        handleToggleStatus={handleToggleStatus}
        brands={brands}
        suppliers={suppliers}
        typesSpare={typesSpare}
      />
    </div>
  );
}