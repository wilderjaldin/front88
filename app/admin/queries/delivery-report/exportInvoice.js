import axios from 'axios';

// Módulo aparte (sin imports de react-pdf) para poder importarlo estáticamente
// desde páginas server-rendered sin arrastrar react-pdf/pdfjs-dist a su bundle.
const url_invoice = process.env.NEXT_PUBLIC_API_URL + 'consulta/ImprimirEntrega';

export const exportInvoice = async (order, token) => {
  const res = await axios.post(
    url_invoice,
    { NroEntrega: order.NroEntrega, ValToken: token },
    { responseType: 'blob' }
  );
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.className = 'no-load';
  link.setAttribute('download', `invoice_${order.NroEntrega}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
