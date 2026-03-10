
Diagnóstico direto do erro (com evidência):
- O erro não é mais coluna faltando. As colunas novas já existem no banco.
- O backend está retornando repetidamente: `invalid input syntax for type date: ""` (visto nos logs recentes).
- Isso explica os `400` no save automático e no botão Finalizar.

Por que isso acontece no código:
1) Em `src/pages/BioJuliaOttoni.tsx`, o formulário não coleta mais `data_agendamento`/`horario_agendamento`.
2) Mesmo assim, no `useFormPersistence.saveProgress`, o payload enviado para `aplicacoes_mentoria` inclui esses campos como string vazia (`''`).
3) No banco, `data_agendamento` é `date` e `horario_agendamento` é `time`; `''` é inválido para esses tipos (aceita `NULL`, não string vazia).
4) Além disso, `completeForm` ainda executa fluxo de agendamento (validação em `agendamentos`, insert em `agendamentos`, calendário), o que também depende de data/hora válidas.

Plano de correção:
1) Normalizar payload antes de salvar progresso (`saveProgress`):
- Converter `data_agendamento: ''` para `null`.
- Converter `horario_agendamento: ''` para `null`.
- Manter strings válidas quando houver agendamento real.
- Resultado: inserts/updates deixam de quebrar com 400.

2) Tornar `completeForm` compatível com formulários sem agenda:
- Criar flag `hasSchedulingData = !!(formData.data_agendamento && formData.horario_agendamento)`.
- Se `hasSchedulingData` for `false`:
  - apenas marcar aplicação como `Completo` em `aplicacoes_mentoria`;
  - pular validação/insert em `agendamentos`;
  - pular criação de evento de calendário.
- Se `true`, manter fluxo atual de agendamento.

3) Ajuste de consistência na sincronização de planilha:
- Hoje `syncWithSheets(formData, 12, true)` está fixo.
- Tornar esse step final parametrizável para refletir corretamente cada rota (ex.: `/bio` finaliza em 9, `/bio-julia-ottoni` em 12).

4) Revisão de regressão:
- Aplicar a correção de forma genérica no hook (beneficia `/bio-julia-ottoni` e também `/` que está no mesmo risco após remoção de agenda).
- Sem necessidade de nova migração de schema para este erro específico.

Validação após correção:
1) Preencher `/bio-julia-ottoni` até o fim.
2) Confirmar ausência de `400` no network.
3) Confirmar criação/atualização em `aplicacoes_mentoria` com:
- `tipo_formulario='bio-julia-ottoni'`
- `data_agendamento = null`
- `horario_agendamento = null`
- novos campos textuais preenchidos.
4) Confirmar página de obrigado abrindo normalmente.
