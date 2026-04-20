import { FormField } from '../FormField';

interface BlocoProps {
  dados: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (campo: string, valor: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const AGENTES_NOCIVOS = [
  'Ruído',
  'Produtos Químicos',
  'Calor/Frio excessivo',
  'Eletricidade',
  'Inflamáveis',
  'Agentes biológicos',
  'Limpeza de banheiro',
];

export const BlocoInsalubridade = ({ dados, onChange }: BlocoProps) => {
  const handleChange = (campo: string, valor: any) => {
    onChange(campo, valor);
    if (campo === 'epi_fornecimento' && valor !== 'Fornecidos' && valor !== 'Insuficientes') onChange('lista_epis', '');
  };
  const toggleAgente = (agente: string) => {
    const atuais: string[] = Array.isArray(dados.agentes_nocivos) ? dados.agentes_nocivos : [];
    if (atuais.includes(agente)) {
      onChange('agentes_nocivos', atuais.filter(a => a !== agente));
    } else {
      onChange('agentes_nocivos', [...atuais, agente]);
    }
  };

  const agentesSelecionados: string[] = Array.isArray(dados.agentes_nocivos) ? dados.agentes_nocivos : [];

  return (
    <div>
      <div style={{ marginBottom: 25 }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#444', marginBottom: 10, display: 'block' }}>
          Trabalhava exposto a:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {AGENTES_NOCIVOS.map(agente => (
            <label
              key={agente}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 10,
                border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer',
                backgroundColor: agentesSelecionados.includes(agente) ? '#e6f7ff' : '#fff',
                borderColor: agentesSelecionados.includes(agente) ? '#1890ff' : '#ddd',
              }}
            >
              <input type="checkbox" checked={agentesSelecionados.includes(agente)} onChange={() => toggleAgente(agente)} />
              {agente}
            </label>
          ))}
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

      <FormField
        label="Recebia algum adicional?"
        type="select_radio"
        options={['Insalubridade', 'Periculosidade', 'Nenhum']}
        value={dados.adicional_recebido}
        onChange={(v) => onChange('adicional_recebido', v)}
      />

      {dados.adicional_recebido === 'Insalubridade' && (
        <div style={{ marginTop: 12 }}>
          <FormField
            label="O grau estava correto?"
            type="boolean_sim_nao"
            value={dados.grau_correto}
            onChange={(v) => onChange('grau_correto', v)}
          />
        </div>
      )}

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

      <div style={{ backgroundColor: '#fff0f6', padding: 15, borderRadius: 8, border: '1px solid #ffadd2' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#c41d7f' }}>Controle de EPIs</h4>

        <FormField
          label="Fornecimento de EPIs"
          type="select_radio"
          options={['Fornecidos', 'Não fornecidos', 'Insuficientes']}
          value={dados.epi_fornecimento}
          onChange={(v) => handleChange('epi_fornecimento', v)}
        />

        {(dados.epi_fornecimento === 'Fornecidos' || dados.epi_fornecimento === 'Insuficientes') && (
          <div style={{ marginTop: 15 }}>
            <FormField
              label="Anote os EPIs que eram fornecidos"
              type="textarea"
              placeholder="Ex: Botas, luvas de látex, protetor auricular..."
              value={dados.lista_epis}
              onChange={(v) => onChange('lista_epis', v)}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <FormField
          label="Utilização dos EPIs"
          type="select_radio"
          options={['Eram utilizados', 'Não eram utilizados', 'Parcialmente utilizados']}
          value={dados.epi_uso}
          onChange={(v) => onChange('epi_uso', v)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 10 }}>
          <FormField
            label="O uso do EPI era fiscalizado?"
            type="boolean_sim_nao"
            value={dados.epi_fiscalizacao}
            onChange={(v) => onChange('epi_fiscalizacao', v)}
          />
          <FormField
            label="Os EPIs eram trocados com regularidade?"
            type="boolean_sim_nao"
            value={dados.epi_troca}
            onChange={(v) => onChange('epi_troca', v)}
          />
        </div>
      </div>
    </div>
  );
};
