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

export async function fetchAtendimentos(): Promise<AtendimentoItem[]> {
  const res = await fetch('/api/atendimentos');
  if (!res.ok) throw new Error('Falha ao buscar atendimentos');
  return res.json() as Promise<AtendimentoItem[]>;
}

export async function salvarAtendimento(
  filename: string | null,
  dados: object,
  customName?: string
): Promise<{ success: boolean; filename: string; error?: string }> {
  const res = await fetch('/api/atendimentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, customName, dados }),
  });
  if (!res.ok) throw new Error('Falha ao salvar');
  return res.json();
}

export async function excluirAtendimento(filename: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/atendimentos?filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir');
  return res.json();
}
