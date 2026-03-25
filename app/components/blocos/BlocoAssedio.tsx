import { FormField } from '../FormField';

interface BlocoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void;
}

const TIPOS_ASSEDIO = ['Assédio moral', 'Assédio sexual', 'Humilhações', 'Ameaças'];

export const BlocoAssedio = ({ dados, onChange }: BlocoProps) => {
  const toggleTipo = (tipo: string) => {
    const atuais: string[] = Array.isArray(dados.tipos_sofridos) ? dados.tipos_sofridos : [];
    if (atuais.includes(tipo)) {
      onChange('tipos_sofridos', atuais.filter(t => t !== tipo));
    } else {
      onChange('tipos_sofridos', [...atuais, tipo]);
    }
  };
  const tiposSelecionados: string[] = Array.isArray(dados.tipos_sofridos) ? dados.tipos_sofridos : [];

  return (
    <div>
      <div style={{ backgroundColor: '#f9f0ff', padding: 20, borderRadius: 8, border: '1px solid #d3adf7', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#531dab', fontSize: '1.1rem' }}>Investigação Inicial</h4>
        <FormField
          label="Como era o ambiente de trabalho?"
          type="textarea"
          value={dados.ambiente_trabalho}
          onChange={(v) => onChange('ambiente_trabalho', v)}
          placeholder="Anote aqui a percepção geral do trabalhador sobre o clima da empresa..."
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e8e8e8', marginBottom: 25 }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#444', fontSize: '1.1rem' }}>Caracterização do Dano</h4>
        <div style={{ marginBottom: 25 }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: 10, display: 'block' }}>
            O trabalhador relata ter sofrido:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {TIPOS_ASSEDIO.map(tipo => (
              <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', backgroundColor: tiposSelecionados.includes(tipo) ? '#fff0f6' : '#fff', borderColor: tiposSelecionados.includes(tipo) ? '#eb2f96' : '#ddd' }}>
                <input type="checkbox" checked={tiposSelecionados.includes(tipo)} onChange={() => toggleTipo(tipo)} />
                {tipo}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 15 }}>
          <FormField
            label="Quem praticava esses atos?"
            value={dados.quem_praticava}
            onChange={(v) => onChange('quem_praticava', v)}
            placeholder="Ex: O gerente geral (João), os colegas de setor, o próprio dono..."
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#fffbe6', padding: 20, borderRadius: 8, border: '1px solid #ffe58f' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#d48806', fontSize: '1.1rem' }}>Fatos e Provas</h4>
        <p style={{ fontSize: '0.85rem', color: '#876800', marginBottom: 15 }}>
          Descreva abaixo as situações. Tente ser o mais <strong>literal possível</strong> nas afirmações feitas pelo empregado. Anote também o tipo de prova disponível.
        </p>
        <FormField
          label=""
          type="textarea"
          value={dados.descricao_fatos_provas}
          onChange={(v) => onChange('descricao_fatos_provas', v)}
          placeholder='Ex: O supervisor dizia "você é um imprestável" toda semana na frente da equipe. O cliente possui prints de WhatsApp e a colega Maria aceitou ser testemunha.'
        />
      </div>
    </div>
  );
};
