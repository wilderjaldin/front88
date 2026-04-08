import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { option } = params;

  try {
    const filePath = path.join(process.cwd(), "data-runtime", `${option}.json`);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}