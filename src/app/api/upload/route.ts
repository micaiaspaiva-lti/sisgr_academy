import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de imagem foi enviado." },
        { status: 400 }
      );
    }

    // Validação básica do tipo do arquivo (apenas imagens)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "O arquivo enviado precisa ser uma imagem (PNG, JPG, etc.)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Caminho da pasta public/uploads na raiz do projeto
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    // Garante que a pasta public/uploads existe no servidor
    await mkdir(uploadsDir, { recursive: true });

    // Sanitiza e gera nome único para o arquivo
    const sanitizedOriginalName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .toLowerCase();
    const filename = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadsDir, filename);

    // Grava o arquivo de imagem no disco
    await writeFile(filePath, buffer);

    // URL pública acessível pelo navegador
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("Erro ao realizar upload de imagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload do arquivo." },
      { status: 500 }
    );
  }
}
