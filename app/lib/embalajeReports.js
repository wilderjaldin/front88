import axiosClient from '@/app/lib/axiosClient';

// Reportes de embalaje — GET embalajes/{numEmbalaje}/{reporte}/pdf. Compartido entre
// document-delivery/BtnImprimir.js y el modal post-guardado de /admin/dispatch.
const saveBlob = (blobData, filename) => {
  const blob = new Blob([blobData], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  link.classList.add('no-load');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

// Una página por caja física.
export const downloadLabel = async (numEmbalaje) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/etiqueta/pdf`, { responseType: 'blob' });
  saveBlob(res.data, `LB${numEmbalaje}.pdf`);
};

// Usa el Núm. Despacho cuando ya existe; si el embalaje todavía no tiene uno
// asociado, cae a Núm. Embalaje.
export const downloadPackingList = async (numEmbalaje, numDespacho) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/lista-empaque/pdf`, { responseType: 'blob' });
  saveBlob(res.data, `EMP${numDespacho || numEmbalaje}.pdf`);
};

export const downloadDeliveryReceipt = async (numEmbalaje) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/recibo-entrega/pdf`, { responseType: 'blob' });
  saveBlob(res.data, `RE${numEmbalaje}.pdf`);
};

export const downloadInvoice = async (numEmbalaje, numDespacho) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/invoice/pdf`, { responseType: 'blob' });
  saveBlob(res.data, `D${numDespacho}.pdf`);
};
