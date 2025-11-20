-- Criar tabela de aplicações de mentoria
CREATE TABLE aplicacoes_mentoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    instagram VARCHAR(100),
    nicho VARCHAR(255),
    cargo VARCHAR(50),
    faturamento VARCHAR(50),
    dificuldade TEXT,
    investimento VARCHAR(100),
    data_agendamento DATE,
    horario_agendamento TIME,
    status VARCHAR(20) DEFAULT 'incompleto',
    ultima_pergunta INTEGER DEFAULT 1,
    sheet_row_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de agendamentos
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_agendamento DATE NOT NULL,
    horario_agendamento TIME NOT NULL,
    nome_cliente VARCHAR(255),
    email_cliente VARCHAR(255),
    telefone_cliente VARCHAR(20),
    status VARCHAR(20) DEFAULT 'confirmado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_agendamento, horario_agendamento)
);

-- Habilitar RLS
ALTER TABLE aplicacoes_mentoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (formulário não requer autenticação)
CREATE POLICY "Permitir inserção pública" ON aplicacoes_mentoria FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON aplicacoes_mentoria FOR UPDATE USING (true);
CREATE POLICY "Permitir leitura pública" ON aplicacoes_mentoria FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de agendamentos" ON agendamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura de agendamentos" ON agendamentos FOR SELECT USING (true);

-- Índices para performance
CREATE INDEX idx_agendamentos_data_horario ON agendamentos(data_agendamento, horario_agendamento);
CREATE INDEX idx_aplicacoes_email ON aplicacoes_mentoria(email);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicacoes_mentoria
CREATE TRIGGER update_aplicacoes_mentoria_updated_at
    BEFORE UPDATE ON aplicacoes_mentoria
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();