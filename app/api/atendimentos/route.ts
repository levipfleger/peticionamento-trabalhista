import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Pasta de dados: usa variável de ambiente se definida, senão cai numa pasta
// fora do projeto (um nível acima). Configure em .env.local: DATA_DIR=C:\dados-carmes
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), '..', 'dados-carmes');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Valida que o caminho final está dentro de dataDir (previne path traversal)
function caminhoSeguro(filename: string): string | null {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null;
  }
  const resolved = path.resolve(dataDir, filename);
  if (!resolved.startsWith(dataDir + path.sep) && resolved !== dataDir) {
    return null;
  }
  return resolved;
}

// --- SALVAR (POST) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, dados, customName } = body;

    let targetFile: string = filename || '';

    if (customName) {
      const safeName = customName.replace(/[^a-z0-9ãáéíóúç -]/gi, '_');
      targetFile = `${safeName}.json`;
    } else if (!targetFile) {
      const listaClientes = Array.isArray(dados.clientes) ? dados.clientes : [dados.cliente];
      const nomePrincipal = listaClientes[0]?.nome || 'SemNome';
      const nomeLimpo = nomePrincipal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '_');
      const dataHoje = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      targetFile = `${nomeLimpo}_${dataHoje}.json`;
    }

    const filePath = caminhoSeguro(targetFile);
    if (!filePath) {
      return NextResponse.json({ error: 'Nome de arquivo inválido.' }, { status: 400 });
    }

    await fs.promises.writeFile(filePath, JSON.stringify(dados, null, 2), 'utf-8');

    return NextResponse.json({ success: true, filename: targetFile });

  } catch (error) {
    console.error('ERRO SALVAR:', error);
    return NextResponse.json({ error: 'Falha ao gravar.' }, { status: 500 });
  }
}

// --- LISTAR (GET) ---
export async function GET() {
  try {
    if (!fs.existsSync(dataDir)) return NextResponse.json([]);

    const files = (await fs.promises.readdir(dataDir)).filter(f => f.endsWith('.json'));

    const resultados = await Promise.all(
      files.map(async (file) => {
        try {
          const filePath = path.join(dataDir, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const json = JSON.parse(content);
          const stat = await fs.promises.stat(filePath);
          return {
            ...json,
            filename: file,
            clientes: Array.isArray(json.clientes) ? json.clientes : (json.cliente ? [json.cliente] : []),
            empresas: Array.isArray(json.empresas) ? json.empresas : (json.empresa ? [json.empresa] : []),
            interno: json.interno || {},
            modified: stat.mtime,
          };
        } catch {
          return null;
        }
      })
    );

    const lista = resultados
      .filter((item): item is NonNullable<typeof item> => item !== null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json(lista);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao ler pasta.' }, { status: 500 });
  }
}

// --- EXCLUIR (DELETE) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    if (!filename) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 });

    const filePath = caminhoSeguro(filename);
    if (!filePath) {
      return NextResponse.json({ error: 'Nome de arquivo inválido.' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }

    await fs.promises.unlink(filePath);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 });
  }
}
