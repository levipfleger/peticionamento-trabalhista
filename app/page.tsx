'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaBuilding, FaHistory, FaPlus, FaArrowLeft, FaArrowRight, FaSave, FaSpinner, FaBriefcase, FaTrash } from 'react-icons/fa';
import type { CSSProperties } from 'react';
import { fetchAtendimentos, salvarAtendimento, excluirAtendimento as deleteAtendimento } from '../lib/api';

// --- INTERFACES ---
interface ClienteData {
  nome: string; cpf: string; estado_civil: string; nascimento: string; nacionalidade: string;
  endereco: string; bairro: string; cidade: string; estado: string; cep: string;
  tel_residencial: string; tel_comercial: string; tel_celular: string; tel_recado: string;
  email: string; profissao: string;
  [key: string]: string;
}

interface EmpresaData {
  nome: string; cnpj: string; endereco: string; bairro: string; cidade: string; estado: string; cep: string;
  [key: string]: string;
}

interface InternData {
  honorarios: string; forma_pagamento: string; responsavel: string;
  [key: string]: string;
}

interface FormState {
  clientes: ClienteData[];
  empresas: EmpresaData[];
  interno: InternData;
}

interface HistoryItem {
  filename: string;
  clientes: ClienteData[];
  empresas: EmpresaData[];
  interno: InternData;
  cliente?: ClienteData;
  empresa?: EmpresaData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analise_juridica?: Record<string, any>;
}

interface FormActions {
  addClient: () => void;
  removeClient: (idx: number) => void;
  addCompany: () => void;
  removeCompany: (idx: number) => void;
}

interface RenderHomeProps {
  onNew: () => void;
  onHistory: () => void;
  loading: boolean;
}

interface RenderHistoryProps {
  list: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
  onDelete: (filename: string) => void;
  onBack: () => void;
}

interface RenderFormProps {
  data: FormState;
  onChange: (section: 'clientes' | 'empresas' | 'interno', index: number | null, field: string, value: string) => void;
  onBack: () => void;
  onSave: () => void;
  loading: boolean;
  currentFile: string | null;
  actions: FormActions;
  onNext: () => void;
}

// --- DADOS PADRÃO ---
const EMPTY_CLIENTE: ClienteData = {
  nome: '', cpf: '', estado_civil: '', nascimento: '', nacionalidade: '',
  endereco: '', bairro: '', cidade: '', estado: '', cep: '',
  tel_residencial: '', tel_comercial: '', tel_celular: '', tel_recado: '',
  email: '', profissao: ''
};

const EMPTY_EMPRESA: EmpresaData = {
  nome: '', cnpj: '', endereco: '', bairro: '', cidade: '', estado: '', cep: ''
};

const INITIAL_DATA: FormState = {
  clientes: [{ ...EMPTY_CLIENTE }],
  empresas: [{ ...EMPTY_EMPRESA }],
  interno: { honorarios: '', forma_pagamento: '', responsavel: '' }
};

// --- COMPONENTES VISUAIS ---

const RenderHome = ({ onNew, onHistory, loading }: RenderHomeProps) => (
  <div style={styles.cardHome}>
    <div style={styles.logoArea}>
      <div style={styles.logoBg}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-carmes.png" alt="Carmes Advogados" style={styles.logoImg} />
      </div>
      <p style={styles.subtitle}>Gerador de Petição Inicial Trabalhista</p>
    </div>
    <div style={styles.menuGrid}>
      <button onClick={onNew} style={styles.bigButtonPrimary}>
        <FaPlus size={24} />
        <span>Iniciar Novo Atendimento</span>
      </button>
      <button onClick={onHistory} style={styles.bigButtonSecondary} disabled={loading}>
        {loading ? <FaSpinner className="spin" /> : <FaHistory size={24} />}
        <span>Atendimentos Prévios</span>
      </button>
    </div>
  </div>
);

const RenderHistory = ({ list, onOpen, onDelete, onBack }: RenderHistoryProps) => (
  <div style={styles.cardHome}>
    <div style={styles.headerRow}>
      <button onClick={onBack} style={styles.iconBtn}><FaArrowLeft /></button>
      <h2 style={styles.sectionTitle}>Histórico</h2>
      <div style={{ width: 30 }}></div>
    </div>
    <div style={styles.listContainer}>
      {list.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Nenhum arquivo encontrado.</p>}
      {list.map((item, idx) => {
        const clientes = item.clientes || (item.cliente ? [item.cliente] : []);
        const nomePrincipal = clientes[0]?.nome || 'Sem Nome';
        const extras = clientes.length > 1 ? ` (+ ${clientes.length - 1})` : '';
        const nomeArquivo = item.filename ? item.filename.replace('.json', '') : 'Arquivo sem nome';
        return (
          <div key={idx} style={styles.listItem}>
            <div onClick={() => onOpen(item)} style={{ flex: 1, cursor: 'pointer' }}>
              <div style={{ fontWeight: 'bold', color: '#1b4d3e' }}>{nomePrincipal}{extras}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>{nomeArquivo}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.filename); }} style={styles.btnTrashIcon} title="Excluir arquivo permanentemente">
              <FaTrash />
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const RenderForm = ({ data, onChange, onBack, onSave, loading, currentFile, actions, onNext }: RenderFormProps) => (
  <div style={styles.cardForm} className="form-card">
    <div style={styles.headerRowCompact}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={onBack} style={styles.iconBtn} title="Voltar"><FaArrowLeft /></button>
        <h2 style={styles.sectionTitleCompact}>Ficha de Atendimento</h2>
        {currentFile && <span style={styles.fileBadgeCompact}>Editando: {currentFile.replace('.json', '')}</span>}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onSave} style={styles.btnSecondarySmall} title="Salvar alterações">
          {loading ? <FaSpinner className="spin" /> : <FaSave />} Salvar
        </button>
<button onClick={onNext} style={styles.btnPrimarySmall} disabled={loading}>
          {loading ? <FaSpinner className="spin" /> : <>Avançar <FaArrowRight /></>}
        </button>
      </div>
    </div>

    <div style={styles.scrollableContent}>
      {/* BLOCO 1: CLIENTES */}
      <div style={styles.sectionBlock}>
        <div style={styles.blockHeaderRow}>
          <div style={styles.sectionTitleBlock}><FaUser size={14} /> DADOS DO(S) RECLAMANTE(S)</div>
          <button onClick={actions.addClient} style={styles.btnAdd} title="Adicionar outro cliente ao processo">
            <FaPlus size={10} /> Adicionar Reclamante
          </button>
        </div>
        {data.clientes.map((cliente, index) => (
          <div key={index} style={index > 0 ? styles.separator : {}}>
            {index > 0 && (
              <div style={styles.subHeader}>
                Reclamante #{index + 1}
                <button onClick={() => actions.removeClient(index)} style={styles.btnRemove}>
                  <FaTrash size={10} /> Remover
                </button>
              </div>
            )}
            <div style={styles.grid12} className="responsive-grid">
              <div style={{ gridColumn: 'span 4' }}>
                <label style={styles.label}>Nome Completo</label>
                <input style={styles.input} value={cliente.nome} onChange={e => onChange('clientes', index, 'nome', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Nacionalidade</label>
                <select style={styles.select} value={cliente.nacionalidade} onChange={e => onChange('clientes', index, 'nacionalidade', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="Brasileiro(a)">Brasileiro(a)</option>
                  <option value="Estrangeiro(a)">Estrangeiro(a)</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Estado Civil</label>
                <select style={styles.select} value={cliente.estado_civil} onChange={e => onChange('clientes', index, 'estado_civil', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Convivente">Convivente</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Dt. Nascimento</label>
                <input style={styles.input} value={cliente.nascimento} onChange={e => onChange('clientes', index, 'nascimento', e.target.value)} maxLength={10} placeholder="DD/MM/AAAA" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>CPF</label>
                <input style={styles.input} value={cliente.cpf} onChange={e => onChange('clientes', index, 'cpf', e.target.value)} maxLength={14} placeholder="000.000.000-00" />
              </div>
              <div style={{ gridColumn: 'span 5' }}>
                <label style={styles.label}>Endereço Residencial</label>
                <input style={styles.input} value={cliente.endereco} onChange={e => onChange('clientes', index, 'endereco', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Bairro</label>
                <input style={styles.input} value={cliente.bairro} onChange={e => onChange('clientes', index, 'bairro', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>Cidade</label>
                <input style={styles.input} value={cliente.cidade} onChange={e => onChange('clientes', index, 'cidade', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={styles.label}>UF</label>
                <input style={styles.input} value={cliente.estado} onChange={e => onChange('clientes', index, 'estado', e.target.value)} maxLength={2} placeholder="SP" />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={styles.label}>CEP</label>
                <input style={styles.input} value={cliente.cep} onChange={e => onChange('clientes', index, 'cep', e.target.value)} maxLength={9} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>Profissão</label>
                <input style={styles.input} value={cliente.profissao} onChange={e => onChange('clientes', index, 'profissao', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>E-mail</label>
                <input style={styles.input} value={cliente.email} onChange={e => onChange('clientes', index, 'email', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Telefone 1</label>
                <input style={styles.input} value={cliente.tel_celular} onChange={e => onChange('clientes', index, 'tel_celular', e.target.value)} maxLength={15} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Telefone 2</label>
                <input style={styles.input} value={cliente.tel_residencial} onChange={e => onChange('clientes', index, 'tel_residencial', e.target.value)} maxLength={15} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Recado</label>
                <input style={styles.input} value={cliente.tel_comercial} onChange={e => onChange('clientes', index, 'tel_comercial', e.target.value)} maxLength={15} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BLOCO 2: EMPRESAS */}
      <div style={styles.sectionBlock}>
        <div style={styles.blockHeaderRow}>
          <div style={styles.sectionTitleBlock}><FaBuilding size={14} /> DADOS DA(S) RECLAMADA(S)</div>
          <button onClick={actions.addCompany} style={styles.btnAdd} title="Adicionar outra empresa ao processo">
            <FaPlus size={10} /> Adicionar Empresa
          </button>
        </div>
        {data.empresas.map((empresa, index) => (
          <div key={index} style={index > 0 ? styles.separator : {}}>
            {index > 0 && (
              <div style={styles.subHeader}>
                Empresa Ré #{index + 1}
                <button onClick={() => actions.removeCompany(index)} style={styles.btnRemove}>
                  <FaTrash size={10} /> Remover
                </button>
              </div>
            )}
            <div style={styles.grid12} className="responsive-grid">
              <div style={{ gridColumn: 'span 5' }}>
                <label style={styles.label}>Nome da Empresa Ré</label>
                <input style={styles.input} value={empresa.nome} onChange={e => onChange('empresas', index, 'nome', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>CNPJ</label>
                <input style={styles.input} value={empresa.cnpj} onChange={e => onChange('empresas', index, 'cnpj', e.target.value)} maxLength={18} />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <label style={styles.label}>Endereço Comercial</label>
                <input style={styles.input} value={empresa.endereco} onChange={e => onChange('empresas', index, 'endereco', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>Bairro</label>
                <input style={styles.input} value={empresa.bairro} onChange={e => onChange('empresas', index, 'bairro', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <label style={styles.label}>Cidade</label>
                <input style={styles.input} value={empresa.cidade} onChange={e => onChange('empresas', index, 'cidade', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={styles.label}>UF</label>
                <input style={styles.input} value={empresa.estado} onChange={e => onChange('empresas', index, 'estado', e.target.value)} maxLength={2} placeholder="SP" />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <label style={styles.label}>CEP</label>
                <input style={styles.input} value={empresa.cep} onChange={e => onChange('empresas', index, 'cep', e.target.value)} maxLength={9} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BLOCO 3: INTERNOS */}
      <div style={styles.sectionBlock}>
        <div style={styles.sectionTitleBlock}><FaBriefcase size={14} /> DADOS INTERNOS</div>
        <div style={styles.grid12} className="responsive-grid">
          <div style={{ gridColumn: 'span 4' }}>
            <label style={styles.label}>Responsável pelo Atendimento</label>
            <input style={styles.input} value={data.interno.responsavel} onChange={e => onChange('interno', null, 'responsavel', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={styles.label}>Honorários (%)</label>
            <input style={styles.input} value={data.interno.honorarios} onChange={e => onChange('interno', null, 'honorarios', e.target.value)} placeholder="Ex: 30%" />
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <label style={styles.label}>Forma de Pagamento</label>
            <input style={styles.input} value={data.interno.forma_pagamento} onChange={e => onChange('interno', null, 'forma_pagamento', e.target.value)} placeholder="Ex: Êxito final / Entrada + Parcelas" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- LÓGICA PRINCIPAL ---

function HomeContent() {
  const router = useRouter();
  const [view, setView] = useState('home');
  const [formData, setFormData] = useState<FormState>(INITIAL_DATA);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analiseJuridica, setAnaliseJuridica] = useState<Record<string, any>>({});

  const searchParams = useSearchParams();

  useEffect(() => {
    const fileToOpen = searchParams.get('open');
    if (fileToOpen) {
      setLoading(true);
      fetchAtendimentos()
        .then(lista => {
          const item = lista.find(f => f.filename === fileToOpen);
          if (item) abrirAtendimento(item as unknown as HistoryItem);
          else console.warn('Arquivo da URL não encontrado na lista atual.');
        })
        .catch(err => console.error('Erro ao abrir via URL:', err))
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // MÁSCARAS
  const maskCPF = (v: string) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  const maskCEP = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  const maskCNPJ = (v: string) => v.replace(/\D/g, '').slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  const maskPhone = (v: string) => v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  const maskDate = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
  const maskPascalCase = (v: string) => v.replace(/(?:^|\s)\S/g, c => c.toUpperCase());

  // BUSCA CEP (ViaCEP)
  const buscarCEP = async (cep: string, section: 'clientes' | 'empresas', index: number) => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      setFormData(prev => {
        const listKey = section === 'clientes' ? 'clientes' : 'empresas';
        const newList = [...prev[listKey]];
        newList[index] = {
          ...newList[index],
          ...(data.logradouro && { endereco: data.logradouro }),
          ...(data.bairro && { bairro: data.bairro }),
          ...(data.localidade && { cidade: data.localidade }),
          ...(data.uf && { estado: data.uf }),
        };
        return { ...prev, [listKey]: newList };
      });
    } catch {
      // falha silenciosa — usuário preenche manualmente
    }
  };

  // CONTROLADOR DE MUDANÇAS
  const handleChange = (section: 'clientes' | 'empresas' | 'interno', index: number | null, field: string, value: string) => {
    let finalValue = value;
    if (field === 'nome' && section === 'clientes') finalValue = maskPascalCase(value);
    if (field === 'cpf') finalValue = maskCPF(value);
    if (field === 'cep') finalValue = maskCEP(value);
    if (field === 'cnpj') finalValue = maskCNPJ(value);
    if (field === 'nascimento') finalValue = maskDate(value);
    if (field.startsWith('tel_')) finalValue = maskPhone(value);
    if (field === 'cep' && finalValue.length === 9 && (section === 'clientes' || section === 'empresas') && index !== null) {
      buscarCEP(finalValue, section, index);
    }

    setFormData(prev => {
      if (section === 'interno') {
        return { ...prev, interno: { ...prev.interno, [field]: finalValue } as InternData };
      }
      if (section === 'clientes') {
        const newList = [...prev.clientes];
        newList[index!] = { ...newList[index!], [field]: finalValue } as ClienteData;
        return { ...prev, clientes: newList };
      }
      const newList = [...prev.empresas];
      newList[index!] = { ...newList[index!], [field]: finalValue } as EmpresaData;
      return { ...prev, empresas: newList };
    });
  };

  // ACTIONS
  const actions: FormActions = {
    addClient: () => setFormData(prev => ({ ...prev, clientes: [...prev.clientes, { ...EMPTY_CLIENTE }] })),
    removeClient: (idx: number) => {
      if (formData.clientes.length === 1) return alert('É necessário ter pelo menos 1 cliente.');
      if (confirm('Remover este cliente?')) {
        setFormData(prev => ({ ...prev, clientes: prev.clientes.filter((_, i) => i !== idx) }));
      }
    },
    addCompany: () => setFormData(prev => ({ ...prev, empresas: [...prev.empresas, { ...EMPTY_EMPRESA }] })),
    removeCompany: (idx: number) => {
      if (formData.empresas.length === 1) return alert('É necessário ter pelo menos 1 empresa.');
      if (confirm('Remover esta empresa?')) {
        setFormData(prev => ({ ...prev, empresas: prev.empresas.filter((_, i) => i !== idx) }));
      }
    },
  };

  // CARREGAR HISTÓRICO
  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const data = await fetchAtendimentos();
      setHistoryList(data as unknown as HistoryItem[]);
      setView('history');
    } catch (error) {
      console.error(error);
      alert('Erro ao buscar histórico.');
    }
    setLoading(false);
  };

  // EXCLUIR
  const excluirAtendimentoHandler = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${filename}" permanentemente?`)) return;
    try {
      const res = await deleteAtendimento(filename);
      if (res.success) {
        alert('Excluído com sucesso!');
        carregarHistorico();
      } else {
        alert('Erro ao excluir.');
      }
    } catch {
      alert('Erro ao conectar.');
    }
  };

  // SALVAR — retorna o filename em caso de sucesso, null em caso de falha/cancelamento
  const salvarProgresso = async (silencioso = false): Promise<string | null> => {
    if (!formData.clientes[0].nome) {
      alert('Preencha pelo menos o nome do primeiro cliente.');
      return null;
    }

    let customName: string | undefined;
    if (!currentFile) {
      const nomeSugerido = formData.clientes[0].nome;
      const input = prompt('Nome para salvar o arquivo (ex: Joao_Silva_Padaria):', nomeSugerido);
      if (input === null) return null;
      customName = input.trim() || nomeSugerido;
    }

    setLoading(true);
    try {
      const payload = Object.keys(analiseJuridica).length > 0
        ? { ...formData, analise_juridica: analiseJuridica }
        : formData;
      const responseData = await salvarAtendimento(currentFile, payload, customName);
      if (responseData.success) {
        setCurrentFile(responseData.filename);
        if (!silencioso) alert('Salvo com sucesso!');
        return responseData.filename;
      } else {
        alert('Erro ao salvar: ' + (responseData.error || 'Erro desconhecido'));
        return null;
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao salvar.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ABRIR
  const abrirAtendimento = (item: HistoryItem) => {
    // Converte null/undefined/números → '' para evitar inputs não-controlados
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const limpar = <T extends Record<string, string>>(base: T, dados: Record<string, any>): T =>
      Object.fromEntries(
        Object.entries({ ...base, ...dados }).map(([k, v]) => [k, typeof v === 'string' ? v : ''])
      ) as T;

    const rawClientes = Array.isArray(item.clientes) ? item.clientes : (item.cliente ? [item.cliente] : []);
    const rawEmpresas = Array.isArray(item.empresas) ? item.empresas : (item.empresa ? [item.empresa] : []);
    const clientes = rawClientes.length > 0 ? rawClientes.map(c => {
      const cleaned = limpar(EMPTY_CLIENTE, c);
      // Migração: valor antigo "Brasileiro" → "Brasileiro(a)"
      if (cleaned.nacionalidade === 'Brasileiro') cleaned.nacionalidade = 'Brasileiro(a)';
      if (cleaned.nacionalidade === 'Brasileira') cleaned.nacionalidade = 'Brasileiro(a)';
      return cleaned;
    }) : [{ ...EMPTY_CLIENTE }];
    const empresas = rawEmpresas.length > 0 ? rawEmpresas.map(e => limpar(EMPTY_EMPRESA, e)) : [{ ...EMPTY_EMPRESA }];
    const interno = limpar(INITIAL_DATA.interno, item.interno || {});
    setAnaliseJuridica(item.analise_juridica || {});
    setFormData({ clientes, empresas, interno });
    setCurrentFile(item.filename);
    setView('form');
  };

  // AVANÇAR — salva automaticamente e navega
  const irParaBlocos = async () => {
    const filename = await salvarProgresso(true);
    if (filename) {
      router.push(`/blocos?file=${encodeURIComponent(filename)}`);
    }
  };

  const iniciarNovo = () => {
    setFormData(INITIAL_DATA);
    setCurrentFile(null);
    setAnaliseJuridica({});
    setView('form');
  };

  return (
    <div style={styles.container}>
      {view === 'home' && (
        <RenderHome onNew={iniciarNovo} onHistory={carregarHistorico} loading={loading} />
      )}
      {view === 'history' && (
        <RenderHistory list={historyList} onOpen={abrirAtendimento} onDelete={excluirAtendimentoHandler} onBack={() => setView('home')} />
      )}
      {view === 'form' && (
        <RenderForm
          data={formData}
          onChange={handleChange}
          actions={actions}
          onBack={() => setView('home')}
          onSave={() => { salvarProgresso(false); }}
          onNext={irParaBlocos}
          loading={loading}
          currentFile={currentFile}
        />
      )}
      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Carregando sistema...</div>}>
      <HomeContent />
    </Suspense>
  );
}

// --- ESTILOS ---
const styles: Record<string, CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', padding: '10px' },
  cardHome: { backgroundColor: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '40px', display: 'flex', flexDirection: 'column' },
  cardForm: { backgroundColor: '#ffffff', width: '98%', maxWidth: 'none', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', padding: '20px', display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '90vh' },
  scrollableContent: { overflowY: 'auto', flex: 1, paddingRight: '5px' },
  headerRowCompact: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' },
  sectionTitleCompact: { color: '#1b4d3e', fontSize: '1.2rem', margin: 0, fontWeight: 'bold' },
  fileBadgeCompact: { backgroundColor: '#e8f5e9', color: '#1b4d3e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #c8e6c9', marginLeft: '10px' },
  sectionBlock: { marginBottom: '20px', border: '1px solid #eee', borderRadius: '6px', padding: '15px', backgroundColor: '#fff' },
  blockHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #1b4d3e', paddingBottom: '8px' },
  sectionTitleBlock: { fontSize: '1rem', fontWeight: 'bold', color: '#1b4d3e', display: 'flex', alignItems: 'center', gap: '8px' },
  subHeader: { fontSize: '0.85rem', fontWeight: 'bold', color: '#666', marginTop: '15px', marginBottom: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' },
  separator: { marginTop: '10px' },
  grid12: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '10px', alignItems: 'end' },
  label: { fontSize: '0.75rem', color: '#666', fontWeight: 600, marginBottom: '2px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem', width: '100%', transition: 'border 0.2s', outline: 'none', height: '32px', boxSizing: 'border-box' },
  select: { padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem', width: '100%', outline: 'none', height: '32px', backgroundColor: '#fff', cursor: 'pointer', boxSizing: 'border-box' },
  btnPrimarySmall: { backgroundColor: '#1b4d3e', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem' },
  btnSecondarySmall: { backgroundColor: 'white', color: '#666', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' },
btnAdd: { backgroundColor: '#e3f2fd', color: '#1565c0', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
  btnRemove: { backgroundColor: '#ffebee', color: '#c62828', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '1.2rem', padding: 0 },
  btnTrashIcon: { background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginBottom: '40px', textAlign: 'center', gap: '12px' },
  logoBg: { backgroundColor: '#1b4d3e', borderRadius: '12px', padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoImg: { height: '60px', width: 'auto', display: 'block' },
  subtitle: { color: '#666', margin: 0, fontSize: '1rem' },
  menuGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  bigButtonPrimary: { backgroundColor: '#1b4d3e', color: 'white', border: 'none', padding: '20px', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', transition: '0.2s', boxShadow: '0 4px 10px rgba(27, 77, 62, 0.2)' },
  bigButtonSecondary: { backgroundColor: 'white', color: '#1b4d3e', border: '2px solid #1b4d3e', padding: '20px', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', transition: '0.2s' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  listItem: { padding: '15px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', transition: '0.2s' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { color: '#1b4d3e', fontSize: '1.4rem', margin: 0 },
};
