// Descarga genérica de un blob (PDF, etc.) — crea un <a> sintético con no-load
// para no disparar el spinner global de cambio de ruta (RouteClickInterceptor).
export const downloadBlob = (blobData, filename, mimeType = 'application/pdf') => {
  const blob = new Blob([blobData], { type: mimeType });
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
