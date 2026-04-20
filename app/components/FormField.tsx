interface FormFieldProps {
  label: string;
  type?: 'text' | 'boolean_sim_nao' | 'select_radio' | 'select' | 'textarea' | 'date' | 'money' | 'number';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  placeholder?: string;
  options?: string[];
}

const styles = {
  fieldRow: { display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '15px' },
  label: { fontSize: '0.95rem', fontWeight: 600, color: '#444' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', width: '100%', outline: 'none', backgroundColor: '#fafafa' },
  textarea: { width: '100%', minHeight: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' as const, backgroundColor: '#fafafa' },
  radioGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  radioBtn: { padding: '8px 20px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fff', color: '#666', transition: '0.2s' },
  radioBtnActive: { padding: '8px 20px', border: '1px solid #1b4d3e', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#1b4d3e', color: '#fff', fontWeight: 'bold' as const, boxShadow: '0 2px 5px rgba(27, 77, 62, 0.3)' },
};

export const FormField = ({ label, type = 'text', value, onChange, placeholder, options }: FormFieldProps) => {

  const handleMoney = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    const float = parseFloat(v) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(float) ? 0 : float);
    onChange(formatted);
  };

  const handleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
    onChange(v);
  };

  if (type === 'boolean_sim_nao') {
    return (
      <div style={styles.fieldRow}>
        <label style={styles.label}>{label}</label>
        <div style={styles.radioGroup}>
          <label style={value === true ? styles.radioBtnActive : styles.radioBtn}
            onClick={(e) => { e.preventDefault(); onChange(value === true ? null : true); }}>
            <input type="radio" checked={value === true} onChange={() => {}} style={{ display: 'none' }} /> Sim
          </label>
          <label style={value === false ? styles.radioBtnActive : styles.radioBtn}
            onClick={(e) => { e.preventDefault(); onChange(value === false ? null : false); }}>
            <input type="radio" checked={value === false} onChange={() => {}} style={{ display: 'none' }} /> Não
          </label>
        </div>
      </div>
    );
  }

  if (type === 'select_radio') {
    return (
      <div style={styles.fieldRow}>
        <label style={styles.label}>{label}</label>
        <div style={styles.radioGroup}>
          {options?.map(opt => (
            <label key={opt} style={value === opt ? styles.radioBtnActive : styles.radioBtn}
              onClick={(e) => { e.preventDefault(); onChange(value === opt ? null : opt); }}>
              <input type="radio" checked={value === opt} onChange={() => {}} style={{ display: 'none' }} /> {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div style={styles.fieldRow}>
        <label style={styles.label}>{label}</label>
        <select
          style={{ ...styles.input, cursor: 'pointer' }}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Selecione...</option>
          {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div style={styles.fieldRow}>
        <label style={styles.label}>{label}</label>
        <textarea style={styles.textarea} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    );
  }

  return (
    <div style={styles.fieldRow}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        style={styles.input}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => {
          if (type === 'money') handleMoney(e);
          else if (type === 'date') handleDate(e);
          else if (type === 'number') onChange(e.target.value.replace(/\D/g, '').slice(0, 2));
          else onChange(e.target.value);
        }}
        maxLength={type === 'date' ? 10 : undefined}
      />
    </div>
  );
};
