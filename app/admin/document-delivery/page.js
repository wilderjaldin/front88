"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess, swalConfirm, swalInfo } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import DocumentDeliveryList from "@/app/admin/document-delivery/document-delivery-list";
import DispatchDataModal from "@/app/admin/document-delivery/DispatchDataModal";
import Modal from '@/components/modal';

const URL_LIST = 'embalajes/listar-embalaje-doc';
// Anular sin confirmar todavía — se ajusta cuando se defina el contrato real.
const URL_CANCEL = 'entregadocumentos/anular';

// listaembalaje-doc devuelve un arreglo plano (sin paginado de servidor) —
// numEntrega ocupa la columna "Núm. Despacho" ya existente en la tabla.
const mapOrder = (o, index) => ({
  id:              index,
  NumEmbalaje:     o.numEmbalaje,
  CodPais:         o.codPais,
  NumDespacho:     o.numEntrega,
  Cliente:         o.cliente,
  Transporte:      o.transporte,
  DireccionEntrega: o.dirEntrega,
  Carga:           o.carga,
});

export default function DocumentDelivery() {

  const t = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchRow, setDispatchRow] = useState(null);

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_LIST);
      setOrders((rs.data ?? []).map(mapOrder));
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

  const handleOpenDispatch = (row) => {
    setDispatchRow(row);
    setShowDispatchModal(true);
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
        onRefresh={getList}
        onCancel={handleCancel}
        onForward={handleForward}
        onOpenDispatch={handleOpenDispatch}
        onEdit={handleOpenDispatch}
      />

      <Modal
        size="w-full max-w-3xl"
        showModal={showDispatchModal}
        closeModal={() => setShowDispatchModal(false)}
        openModal={() => setShowDispatchModal(true)}
        title={t.dispatch_data}
        content={showDispatchModal ? (
          <DispatchDataModal
            t={t}
            row={dispatchRow}
            onClose={() => setShowDispatchModal(false)}
            onSaved={(list) => {
              setShowDispatchModal(false);
              swalSuccess(t.delivery_recorded_success);
              // guardar-despacho devuelve la lista de pendientes actualizada; el
              // shape de actualizar-despacho todavía no está confirmado, así que
              // si no viene un array se hace un refetch completo por las dudas.
              if (Array.isArray(list)) setOrders(list.map(mapOrder));
              else getList();
            }}
          />
        ) : null}
      />
    </>
  );
}
