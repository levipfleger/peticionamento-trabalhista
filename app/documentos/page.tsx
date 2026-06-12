'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaHome, FaFileWord, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import type { CSSProperties } from 'react';
import { fetchAtendimentos } from '../../lib/api';
import type { AtendimentoItem } from '../../lib/api';

async function baixarArquivo(url: string, dados: AtendimentoItem, fallbackName: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dados }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error ?? res.statusText);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const nomeArquivo = match ? decodeURIComponent(match[1]) : fallbackName;

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

function DocumentosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filename = searchParams.get('file');

  const [dadosAtendimento, setDadosAtendimento] = useState<AtendimentoItem | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string>('');
  const [baixando, setBaixando] = useState(false);
  const [baixado, setBaixado] = useState(false);
  const [baixandoAt, setBaixandoAt] = useState(false);
  const [baixadoAt, setBaixadoAt] = useState(false);

  useEffect(() => {
    if (!filename) return;
    fetchAtendimentos()
      .then(lista => {
        const item = lista.find(i => i.filename === filename);
        if (item) {
          setDadosAtendimento(item);
          const clientes = Array.isArray(item.clientes) ? item.clientes : [];
          setNomeCliente(clientes[0]?.nome || filename.replace('.json', ''));
        }
      })
      .catch(() => {});
  }, [filename]);

  const baixarDocumento = async () => {
    if (!dadosAtendimento) return;
    setBaixando(true);
    try {
      await baixarArquivo('/api/gerar-documento', dadosAtendimento, `${(filename ?? 'documento').replace('.json', '')} - Documentos.docx`);
      setBaixado(true);
    } catch (err) {
      alert(`Erro ao gerar documento: ${(err as Error).message}`);
    } finally {
      setBaixando(false);
    }
  };

  const baixarAt = async () => {
    if (!dadosAtendimento) return;
    setBaixandoAt(true);
    try {
      await baixarArquivo('/api/gerar-at', dadosAtendimento, `${(filename ?? 'documento').replace('.json', '')} - AT.docx`);
      setBaixadoAt(true);
    } catch (err) {
      alert(`Erro ao gerar AT: ${(err as Error).message}`);
    } finally {
      setBaixandoAt(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => router.push(`/blocos?file=${encodeURIComponent(filename ?? '')}`)} style={styles.iconBtn} title="Voltar para blocos">
            <FaArrowLeft />
          </button>
          <h1 style={styles.title}>Gerar Documentos</h1>
          <button onClick={() => router.push('/')} style={styles.iconBtn} title="Voltar ao início">
            <FaHome />
          </button>
        </div>

        {/* Info do atendimento */}
        {nomeCliente && (
          <div style={styles.clienteBadge}>
            <FaCheckCircle color="#4cd137" />
            <span>Atendimento concluído: <strong>{nomeCliente}</strong></span>
          </div>
        )}

        {/* Botões de geração */}
        <div style={styles.mainArea}>
          <div style={styles.docRow}>
            <div style={styles.docCard}>
              <div style={{ ...styles.iconArea, backgroundColor: '#e3f2fd' }}>
                <FaFileWord size={48} color="#1565c0" />
              </div>
              <p style={styles.docLabel}>Documentos</p>
              <p style={styles.docDesc}>Procuração, contrato e declarações</p>
              <button onClick={baixarDocumento} style={styles.btnBaixar} disabled={baixando}>
                {baixando
                  ? <><FaSpinner className="spin" /> Gerando...</>
                  : baixado
                    ? <><FaCheckCircle /> Baixar Novamente</>
                    : <><FaFileWord /> Gerar</>
                }
              </button>
              {baixado && <p style={styles.successMsg}>Gerado!</p>}
            </div>

            <div style={styles.docCard}>
              <div style={{ ...styles.iconArea, backgroundColor: '#fff3e0' }}>
                <FaFileWord size={48} color="#e65100" />
              </div>
              <p style={styles.docLabel}>Inicial (AT)</p>
              <p style={styles.docDesc}>Modelo de ação trabalhista</p>
              <button onClick={baixarAt} style={{ ...styles.btnBaixar, backgroundColor: '#e65100', boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)' }} disabled={baixandoAt}>
                {baixandoAt
                  ? <><FaSpinner className="spin" /> Gerando...</>
                  : baixadoAt
                    ? <><FaCheckCircle /> Baixar Novamente</>
                    : <><FaFileWord /> Gerar</>
                }
              </button>
              {baixadoAt && <p style={styles.successMsg}>Gerado!</p>}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={styles.footer}>
          <button onClick={() => router.push(`/blocos?file=${encodeURIComponent(filename ?? '')}`)} style={styles.btnSecundario}>
            <FaArrowLeft /> Voltar para Blocos
          </button>
          <button onClick={() => router.push('/')} style={styles.btnSecundario}>
            <FaHome /> Início
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default function DocumentosPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DocumentosContent />
    </Suspense>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '620px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '16px',
  },
  title: {
    color: '#1b4d3e',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    margin: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    fontSize: '1.2rem',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  clienteBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #c8e6c9',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '0.9rem',
    color: '#333',
  },
  mainArea: {
    padding: '10px 0',
  },
  docRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  docCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px',
    border: '1px solid #eee',
    borderRadius: '10px',
    backgroundColor: '#fafafa',
  },
  docLabel: {
    fontWeight: 'bold',
    color: '#1b4d3e',
    margin: 0,
    fontSize: '1rem',
  },
  docDesc: {
    color: '#888',
    margin: 0,
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  iconArea: {
    borderRadius: '50%',
    width: '90px',
    height: '90px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBaixar: {
    backgroundColor: '#1565c0',
    color: 'white',
    border: 'none',
    padding: '14px 36px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
    fontSize: '1.05rem',
    boxShadow: '0 4px 12px rgba(21, 101, 192, 0.3)',
    marginTop: '8px',
  },
  successMsg: {
    color: '#2e7d32',
    fontSize: '0.9rem',
    fontWeight: 600,
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    borderTop: '1px solid #eee',
    paddingTop: '16px',
  },
  btnSecundario: {
    backgroundColor: 'white',
    color: '#555',
    border: '1px solid #ccc',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
  },
};
