'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCheck,
  FaFileSignature, FaDoorOpen, FaClock, FaBiohazard, FaUmbrellaBeach, FaHandshake, FaUserInjured,
  FaAngry, FaGavel, FaShieldAlt, FaBalanceScale, FaStickyNote
} from 'react-icons/fa';
import type { CSSProperties } from 'react';

import { BlocoContrato } from '../components/blocos/BlocoContrato';
import { BlocoRescisao } from '../components/blocos/BlocoRescisao';
import { BlocoJornada } from '../components/blocos/BlocoJornada';
import { BlocoInsalubridade } from '../components/blocos/BlocoInsalubridade';
import { BlocoFerias } from '../components/blocos/BlocoFerias';
import { BlocoVinculo } from '../components/blocos/BlocoVinculo';
import { BlocoAcidente } from '../components/blocos/BlocoAcidente';
import { BlocoAssedio } from '../components/blocos/BlocoAssedio';
import { BlocoRescisaoIndireta } from '../components/blocos/BlocoRescisaoIndireta';
import { BlocoEstabilidades } from '../components/blocos/BlocoEstabilidades';
import { BlocoSolidaria } from '../components/blocos/BlocoSolidaria';
import { BlocoAnotacoes } from '../components/blocos/BlocoAnotacoes';
import { fetchAtendimentos, salvarAtendimento } from '../../lib/api';
import type { AtendimentoItem } from '../../lib/api';

type MenuId = 'contrato' | 'rescisao' | 'vinculo' | 'jornada' | 'insalubridade' | 'ferias' | 'acidente' | 'assedio' | 'rescisao_indireta' | 'estabilidades' | 'solidaria' | 'anotacoes';

interface MenuItem {
  id: MenuId;
  label: string;
  icon: React.ReactNode;
}

const MENU_BLOCOS: MenuItem[] = [
  { id: 'contrato', label: 'Dados contratuais básicos', icon: <FaFileSignature /> },
  { id: 'rescisao', label: 'Dados básicos de rescisão', icon: <FaDoorOpen /> },
  { id: 'vinculo', label: 'Reconhecimento de vínculo empregatício', icon: <FaHandshake /> },
  { id: 'jornada', label: 'Jornada de trabalho', icon: <FaClock /> },
  { id: 'insalubridade', label: 'Insalubridade e Periculosidade', icon: <FaBiohazard /> },
  { id: 'ferias', label: 'Férias e 13º Salário', icon: <FaUmbrellaBeach /> },
  { id: 'acidente', label: 'Acidente/Doença do trabalho', icon: <FaUserInjured /> },
  { id: 'assedio', label: 'Assédio', icon: <FaAngry /> },
  { id: 'rescisao_indireta', label: 'Rescisão indireta', icon: <FaGavel /> },
  { id: 'estabilidades', label: 'Estabilidades', icon: <FaShieldAlt /> },
  { id: 'solidaria', label: 'Responsabilidade solidária/subsidiária', icon: <FaBalanceScale /> },
  { id: 'anotacoes', label: 'Anotações gerais', icon: <FaStickyNote /> },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Respostas = Record<string, Record<string, any>>;

// Determina se um bloco tem pelo menos 1 campo preenchido
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isRelevant = (dados: Record<string, any>): boolean =>
  Object.entries(dados).some(([k, v]) => {
    if (k === 'ignorar' || k === 'obs_geral_bloco') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'boolean') return true;
    if (typeof v === 'string') return v.trim().length > 0;
    return false;
  });

function BlocosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filename = searchParams.get('file');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dadosProcesso, setDadosProcesso] = useState<AtendimentoItem | null>(null);
  const [activeTab, setActiveTab] = useState<MenuId>('contrato');
  const [respostas, setRespostas] = useState<Respostas>({});

  const isFirstLoad = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const dadosProcessoRef = useRef(dadosProcesso);
  const respostasRef = useRef(respostas);

  useEffect(() => { dadosProcessoRef.current = dadosProcesso; }, [dadosProcesso]);
  useEffect(() => { respostasRef.current = respostas; }, [respostas]);

  // Migra campos que mudaram de tipo entre versões do formulário
  const migrarRespostas = (raw: Respostas): Respostas => {
    if (!raw.rescisao) return raw;
    const r = { ...raw.rescisao };
    if (r.verbas_pagas === true)  r.verbas_pagas = 'Sim';
    if (r.verbas_pagas === false) r.verbas_pagas = 'Não';
    if (r.guias_entregues === true)  r.guias_entregues = 'Sim';
    if (r.guias_entregues === false) r.guias_entregues = 'Não';
    return { ...raw, rescisao: r };
  };

  useEffect(() => {
    if (!filename) return;
    fetchAtendimentos()
      .then(lista => {
        const item = lista.find(i => i.filename === filename);
        if (item) {
          setDadosProcesso(item);
          setRespostas(migrarRespostas((item.analise_juridica as Respostas) || {}));
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'))
      .finally(() => {
        setLoading(false);
        isFirstLoad.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename, router]);

  // Auto-save ao trocar de bloco
  const salvarSilencioso = useCallback(async () => {
    const dp = dadosProcessoRef.current;
    if (!dp) return;
    setSaving(true);
    const { filename: _f, modified: _m, ...dadosLimpos } = dp;
    const payload = { ...dadosLimpos, analise_juridica: respostasRef.current };
    try {
      await salvarAtendimento(filename, payload);
    } catch {
      // falha silenciosa
    } finally {
      setSaving(false);
    }
  }, [filename]);

  useEffect(() => {
    if (isFirstLoad.current) return;
    salvarSilencioso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const mudarAba = (id: MenuId) => {
    setActiveTab(id);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const concluirAtendimento = async () => {
    await salvarSilencioso();
    router.push(`/documentos?file=${encodeURIComponent(filename ?? '')}`);
  };

  const renderAbaAtiva = () => {
    const dadosAba = respostas[activeTab] || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (campo: string, valor: any) => {
      setRespostas(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], [campo]: valor },
      }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type BlocoComponent = React.ComponentType<{ dados: Record<string, any>; onChange: (campo: string, valor: any) => void }>;
    const blocoMap: Partial<Record<MenuId, BlocoComponent>> = {
      contrato: BlocoContrato,
      rescisao: BlocoRescisao,
      vinculo: BlocoVinculo,
      jornada: BlocoJornada,
      insalubridade: BlocoInsalubridade,
      ferias: BlocoFerias,
      acidente: BlocoAcidente,
      assedio: BlocoAssedio,
      rescisao_indireta: BlocoRescisaoIndireta,
      estabilidades: BlocoEstabilidades,
      solidaria: BlocoSolidaria,
      anotacoes: BlocoAnotacoes,
    };

    const ComponenteBloco = blocoMap[activeTab] ?? null;
    const infoAba = MENU_BLOCOS.find(m => m.id === activeTab);
    const currentIndex = MENU_BLOCOS.findIndex(m => m.id === activeTab);
    const isLast = currentIndex === MENU_BLOCOS.length - 1;

    return (
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <h2 style={styles.formTitle}>
            {infoAba?.icon}
            {infoAba?.label}
          </h2>
          {saving && <span style={styles.savingBadge}>Salvando...</span>}
        </div>

        {ComponenteBloco ? (
          <ComponenteBloco dados={dadosAba} onChange={handleChange} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999', border: '2px dashed #eee', borderRadius: 8 }}>
            <h3>🚧 Em construção</h3>
            <p>O formulário para <strong>{infoAba?.label}</strong> será implementado no próximo passo.</p>
          </div>
        )}

        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px dashed #ccc' }}>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '0.9rem' }}>Observações gerais</label>
          <textarea
            style={styles.textarea}
            value={dadosAba.obs_geral_bloco || ''}
            onChange={e => handleChange('obs_geral_bloco', e.target.value)}
            placeholder={`Anote aqui detalhes específicos sobre ${infoAba?.label?.toLowerCase()}...`}
          />
        </div>

        <div style={styles.saveBar}>
          <button onClick={concluirAtendimento} style={styles.btnConcluir}>
            <FaCheck /> Concluir Atendimento
          </button>
          <button
            onClick={() => !isLast && mudarAba(MENU_BLOCOS[currentIndex + 1].id)}
            style={isLast ? styles.btnProximaDisabled : styles.btnProxima}
            disabled={isLast}
          >
            Próxima Etapa <FaArrowRight />
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <button onClick={() => router.push(`/?open=${encodeURIComponent(filename ?? '')}`)} style={styles.backBtn}>
          <FaArrowLeft /> Voltar
        </button>
        <div style={styles.menu}>
          {MENU_BLOCOS.map(m => {
            const dados = respostas[m.id] || {};
            const relevant = isRelevant(dados);

            return (
              <button key={m.id} onClick={() => mudarAba(m.id)} style={activeTab === m.id ? styles.menuItemActive : styles.menuItem}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem', flex: 1, minWidth: 0 }}>
                  {m.icon}
                  <span style={{ textAlign: 'left' }}>{m.label}</span>
                </span>
                <span style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                  {relevant && <FaCheckCircle color="#4cd137" size={12} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={styles.content} ref={contentRef}>{renderAbaAtiva()}</div>
    </div>
  );
}

export default function BlocosPage() {
  return <Suspense fallback={<div>...</div>}><BlocosContent /></Suspense>;
}

const styles: Record<string, CSSProperties> = {
  layout: { display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  sidebar: { width: '280px', background: '#1b4d3e', color: 'white', display: 'flex', flexDirection: 'column' },
  backBtn: { background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', padding: 15, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 },
  menu: { flex: 1, overflowY: 'auto', padding: '10px 0' },
  menuItem: { width: '100%', background: 'transparent', border: 'none', color: '#ddd', padding: '15px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  menuItemActive: { width: '100%', background: 'rgba(255,255,255,0.1)', borderLeft: '4px solid #4cd137', color: 'white', padding: '15px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' },
  content: { flex: 1, padding: 30, overflowY: 'auto', display: 'flex', justifyContent: 'center' },
  formContainer: { width: '100%', maxWidth: '800px', background: 'white', padding: 40, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: 'fit-content', paddingBottom: 100 },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid #eee', paddingBottom: 15 },
  formTitle: { margin: 0, color: '#1b4d3e', display: 'flex', gap: 10, alignItems: 'center', fontSize: '1.5rem' },
  savingBadge: { fontSize: '0.8rem', color: '#999', fontStyle: 'italic' },
  textarea: { width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 5, minHeight: 80, marginTop: 5, fontFamily: 'inherit' },
  saveBar: { marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #eee', paddingTop: 20 },
  btnConcluir: { background: 'white', color: '#1b4d3e', border: '2px solid #1b4d3e', padding: '12px 24px', borderRadius: 5, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 'bold' },
  btnProxima: { background: '#1b4d3e', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 5, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(27,77,62,0.2)' },
  btnProximaDisabled: { background: '#ccc', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 5, cursor: 'not-allowed', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 'bold' },
};
