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

export async function GET(request, { params }) {
  const { nrocotizacion, filename } = await params;
  const archivosPath = process.env.ARCHIVOS_PATH;

  if (!archivosPath) {
    return new NextResponse('ARCHIVOS_PATH no configurado', { status: 500 });
  }

  const filePath = path.join(archivosPath, nrocotizacion, filename);

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
