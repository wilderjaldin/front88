import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";



// Asegurar que la carpeta "uploads" existe
async function ensureUploadDir(uploadDir) {
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (error) {
        console.error("Error creando la carpeta uploads:", error);
    }
}

// Manejo de la solicitud POST
export async function POST(req) {
    try {
        const { fileName, content, folder } = await req.json();
        if (!fileName || !content) {
            return NextResponse.json({ message: "Faltan parámetros" }, { status: 400 });
        }

        // Definir la ruta de la carpeta donde se guardarán los archivos
        //const uploadDir = path.join(process.cwd(), "public", folder);
        const uploadDir = path.join(process.cwd(), folder);

        // Asegurar que la carpeta existe
        await ensureUploadDir(uploadDir);

        // Ruta del archivo
        const filePath = path.join(uploadDir, fileName);

        // Guardar archivo
        await writeFile(filePath, JSON.stringify(content), "utf8");

        return NextResponse.json({ message: "Archivo guardado correctamente", filePath });
    } catch (error) {
        console.error("Error al guardar archivo:", error);
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
    }
}