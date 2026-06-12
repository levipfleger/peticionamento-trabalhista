export interface AtendimentoItem {
  filename: string;
  clientes: Record<string, string>[];
  empresas: Record<string, string>[];
  interno: Record<string, string>;
  analise_juridica?: Record<string, Record<string, unknown>>;
  modified?: string;
  cliente?: Record<string, string>;
  empresa?: Record<string, string>;
  [key: string]: unknown;
}

const STORAGE_KEY = 'carmes_atendimentos';

function lerStore(): Record<string, AtendimentoItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function gravarStore(store: Record<string, AtendimentoItem>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function fetchAtendimentos(): Promise<AtendimentoItem[]> {
  const store = lerStore();

  const lista = Object.values(store).map(item => ({
    ...item,
    clientes: Array.isArray(item.clientes) ? item.clientes : (item.cliente ? [item.cliente] : []),
    empresas: Array.isArray(item.empresas) ? item.empresas : (item.empresa ? [item.empresa] : []),
    interno: item.interno || {},
  }));

  lista.sort((a, b) => new Date(b.modified ?? 0).getTime() - new Date(a.modified ?? 0).getTime());

  return lista;
}

export async function salvarAtendimento(
  filename: string | null,
  dados: object,
  customName?: string
): Promise<{ success: boolean; filename: string; error?: string }> {
  try {
    const store = lerStore();

    let targetFile: string = filename || '';

    if (customName) {
      const safeName = customName.replace(/[^a-z0-9ãáéíóúç -]/gi, '_');
      targetFile = `${safeName}.json`;
    } else if (!targetFile) {
      const d = dados as Record<string, unknown>;
      const listaClientes = Array.isArray(d.clientes)
        ? (d.clientes as Record<string, string>[])
        : [d.cliente as Record<string, string> | undefined];
      const nomePrincipal = listaClientes[0]?.nome || 'SemNome';
      const nomeLimpo = nomePrincipal.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '_');
      const dataHoje = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      targetFile = `${nomeLimpo}_${dataHoje}.json`;
    }

    store[targetFile] = {
      ...(dados as Record<string, unknown>),
      filename: targetFile,
      modified: new Date().toISOString(),
    } as AtendimentoItem;

    gravarStore(store);

    return { success: true, filename: targetFile };
  } catch (error) {
    console.error('ERRO SALVAR:', error);
    return { success: false, filename: '', error: 'Falha ao gravar.' };
  }
}

export async function excluirAtendimento(filename: string): Promise<{ success: boolean }> {
  const store = lerStore();
  delete store[filename];
  gravarStore(store);
  return { success: true };
}
