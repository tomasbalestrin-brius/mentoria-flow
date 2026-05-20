## Recuperar respostas do /conteudos-julia

Há 99 registros salvos no banco de dados. Vou recuperar apenas os **completos** (status = 'Completo') de duas formas:

### 1. Gerar planilha Excel (.xlsx)
- Consultar todos os registros completos de `aplicacoes_mentoria` onde `tipo_formulario = 'conteudos-julia'`
- Gerar arquivo `/mnt/documents/leads-conteudos-julia.xlsx` com as 17 colunas padrão (Timestamp, Nome, Telefone, Email, Instagram, Nicho, Cargo, Faturamento, Dificuldade, Investimento, Data, Horário, Status, Última Pergunta, Meta Carreira, Dificuldades Objetivo, Por que escolhida)
- Disponibilizar para download via `<presentation-artifact>`

### 2. Reenviar para o Google Sheets
- Chamar a edge function `sheets-sync` uma vez por lead, sem `rowId`, para fazer append no spreadsheet `1Ksl64qBOV2Ggx8ltp-QlI5UfTky7ea0Rexd__dZmf48`
- Cada lead vira uma nova linha começando na coluna A (graças à correção anterior)
- Status marcado como "Completo"

### Observações
- Nenhuma alteração no código do projeto — é apenas recuperação de dados
- Os leads vão ser adicionados **abaixo** dos que já existem na planilha (não duplica os atuais)
- Se quiser limpar a planilha antes (manter só cabeçalho na linha 1), me avisa antes de eu rodar
