"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess, swalConfirm, swalInfo } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import DocumentDeliveryList from "@/app/admin/document-delivery/document-delivery-list";
import Modal from '@/components/modal';
import dynamic from 'next/dynamic';
const PdfViewerDocumentDelivery = dynamic(() => import('@/app/admin/document-delivery/PdfViewerDocumentDelivery'), {
  ssr: false,
});

// Endpoints sin confirmar todavía — se ajustan cuando se defina el contrato real.
const URL_LIST = 'entregadocumentos/listar';
const URL_CANCEL = 'entregadocumentos/anular';

// Mapeo optimista de campos — ajustar en cuanto se confirme el shape real del listado.
const mapOrder = (o, index) => ({
  id:              index,
  NumEmbalaje:     o.numEmbalaje,
  NumDespacho:     o.numDespacho,
  Cliente:         o.cliente,
  Transporte:      o.transporte,
  DireccionEntrega: o.direccionEntrega ?? o.dirEntrega,
  Carga:           o.carga,
});

export default function DocumentDelivery() {

  const t = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [printRow, setPrintRow] = useState(null);

  useEffect(() => {
    getList();
  }, [page]);

  const getList = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_LIST, { params: { page } });
      const list = rs.data?.datos ?? (Array.isArray(rs.data) ? rs.data : []);
      setOrders(list.map(mapOrder));
      setTotalPages(rs.data?.totalPaginas ?? 1);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (row) => {
    const result = await swalConfirm(
      t.question_cancel_the_order_reception ?? '¿Anular este registro?',
      row.NumEmbalaje ? `${t.nro_packaging} ${row.NumEmbalaje}` : '',
      { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#dc2626' }
    );
    if (!result.isConfirmed) return;

    try {
      await axiosClient.post(URL_CANCEL, { numEmbalaje: row.NumEmbalaje });
      swalSuccess(t.record_updated ?? 'Registro anulado');
      getList();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  };

  const handleForward = () => {
    swalInfo(t.pending_backend_integration ?? 'Acción pendiente de definir con el backend.');
  };

  const handlePrint = (row) => {
    setPrintRow(row);
    setShowModal(true);
  };

  useDynamicTitle(`${t.document_delivery}`);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.document_delivery}
        </li>
      </ul>

      <DocumentDeliveryList
        t={t}
        data={orders}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={getList}
        onCancel={handleCancel}
        onForward={handleForward}
        onPrint={handlePrint}
      />

      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        title={t.proforma}
        content={showModal ? <PdfViewerDocumentDelivery row={printRow} onClose={() => setShowModal(false)} /> : null}
      />
    </>
  );
}
