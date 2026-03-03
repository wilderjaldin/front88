import path from "path";
import fs from "fs/promises";

export async function GET(req, context) {
  const { option } = await context.params;

  try {
    const filePath = path.join(process.cwd(), "data-runtime", `${option}.json`);
    const file = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(file);

    return Response.json(data);
  } catch (error) {
    return Response.json([], { status: 404 });
  }
}