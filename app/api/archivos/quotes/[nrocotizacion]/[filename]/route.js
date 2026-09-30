import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const MIME_TYPES = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// "quotes" es un segmento literal de la URL (como "parts" en la ruta hermana),
// no un parámetro — así el patrón de URL calca la estructura real en disco
// (ArchivosPath/quotes/{nroCotizacion}/{filename}, ver GuardarArchAdjAsync en
// api88) y coincide con la regla "Archivos estaticos" de web.config, que en
// producción sirve /archivos/quotes/... directo desde IIS sin pasar por Node.
export async function GET(request, { params }) {
  const { nrocotizacion, filename } = await params;
  const archivosPath = process.env.ARCHIVOS_PATH;

  if (!archivosPath) {
    return new NextResponse('ARCHIVOS_PATH no configurado', { status: 500 });
  }

  const filePath = path.join(archivosPath, 'quotes', nrocotizacion, filename);

  try {
    const file = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new NextResponse('Archivo no encontrado', { status: 404 });
  }
}
