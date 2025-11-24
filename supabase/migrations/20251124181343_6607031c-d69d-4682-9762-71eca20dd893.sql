-- Adicionar campo tipo_formulario nas tabelas (compatível com dados existentes)
ALTER TABLE aplicacoes_mentoria 
ADD COLUMN IF NOT EXISTS tipo_formulario VARCHAR(50) DEFAULT 'bio';

ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS tipo_formulario VARCHAR(50) DEFAULT 'bio';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aplicacoes_tipo 
ON aplicacoes_mentoria(tipo_formulario);

CREATE INDEX IF NOT EXISTS idx_agendamentos_tipo 
ON agendamentos(tipo_formulario);

-- Atualizar constraint único para incluir tipo de formulário
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_data_agendamento_horario_agendamento_key;

ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_unique_slot 
UNIQUE(data_agendamento, horario_agendamento, tipo_formulario);

-- Comentários para documentação
COMMENT ON COLUMN aplicacoes_mentoria.tipo_formulario IS 'Tipo do formulário (bio, matematica, fisica, etc)';
COMMENT ON COLUMN agendamentos.tipo_formulario IS 'Tipo do formulário associado ao agendamento';