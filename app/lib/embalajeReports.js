import axiosClient from '@/app/lib/axiosClient';

// Reportes de embalaje — GET embalajes/{numEmbalaje}/{reporte}/pdf. Compartido entre
// document-delivery/BtnImprimir.js y el modal post-guardado de /admin/dispatch.
export const saveBlob = (blobData, filename, type = 'application/pdf') => {
  const blob = new Blob([blobData], { type });
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

// codPais = país del EMBALAJE (venembme.CodPais, row.CodPaisEmbalaje). NumEmbalaje se
// repite entre países (correlativo por país), así que el backend lo usa para elegir el
// embalaje correcto. Opcional: sin él usa el país del usuario logueado.
const paisParams = (codPais) => (codPais ? { codPais } : {});

// Una página por caja física.
export const downloadLabel = async (numEmbalaje, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/etiqueta/pdf`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `LB${numEmbalaje}.pdf`);
};

// Usa el Núm. Despacho cuando ya existe; si el embalaje todavía no tiene uno
// asociado, cae a Núm. Embalaje.
export const downloadPackingList = async (numEmbalaje, numDespacho, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/lista-empaque/pdf`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `EMP${numDespacho || numEmbalaje}.pdf`);
};

export const downloadDeliveryReceipt = async (numEmbalaje, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/recibo-entrega/pdf`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `RE${numEmbalaje}.pdf`);
};

export const downloadInvoice = async (numEmbalaje, numDespacho, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/invoice/pdf`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `D${numDespacho}.pdf`);
};

export const downloadInvoiceExcel = async (numEmbalaje, numDespacho, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/invoice/excel`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `D${numDespacho}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const downloadNafta = async (numEmbalaje, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/nafta/pdf`, { params: paisParams(codPais), responseType: 'blob' });
  saveBlob(res.data, `NAFTA${numEmbalaje}.pdf`);
};

// A diferencia del resto de reportes de este archivo (todos por numEmbalaje),
// este va por numEntrega.
export const downloadShippingReport = async (numEntrega) => {
  const res = await axiosClient.get(`envio/${numEntrega}/pdf`, { responseType: 'blob' });
  saveBlob(res.data, `ENV${numEntrega}.pdf`);
};

// tipos: subconjunto de ['etiqueta', 'invoice', 'lista-empaque', 'recibo-entrega'].
// El backend combina esos reportes en un único PDF (QuestPDF Document.Merge).
export const downloadCombinedReports = async (numEmbalaje, numDespacho, tipos, codPais) => {
  const res = await axiosClient.get(`embalajes/${numEmbalaje}/reportes/pdf`, {
    params: { tipos: tipos.join(','), ...paisParams(codPais) },
    responseType: 'blob',
  });
  saveBlob(res.data, `REP${numDespacho || numEmbalaje}.pdf`);
};
